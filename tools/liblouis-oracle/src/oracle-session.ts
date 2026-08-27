import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";

import { LIBLOUIS_ORACLE_STATUS } from "./metadata.js";
import { encodeOracleInput, type OracleTranslation } from "./runner.js";

interface PendingTranslation {
  readonly id: string;
  readonly reject: (error: Error) => void;
  readonly resolve: (translation: OracleTranslation) => void;
}

export class Grade2OracleSession {
  readonly #child: ChildProcessWithoutNullStreams;
  #closed = false;
  readonly #pending: PendingTranslation[] = [];
  #stderr = "";
  readonly #version: string;

  constructor(executable: string, version: string) {
    this.#version = version;
    const oracleArguments = [
      "--forward",
      "--display-table",
      "unicode.dis",
      "en-ueb-g2.ctb",
    ];
    const command = process.platform === "linux" ? "stdbuf" : executable;
    const arguments_ = process.platform === "linux"
      ? ["-oL", executable, ...oracleArguments]
      : oracleArguments;
    this.#child = spawn(
      command,
      arguments_,
      { env: process.env, shell: false, stdio: "pipe", windowsHide: true },
    );
    this.#child.stderr.setEncoding("utf8");
    this.#child.stderr.on("data", (chunk: string) => {
      this.#stderr += chunk;
    });
    createInterface({ input: this.#child.stdout }).on("line", (output) => {
      const pending = this.#pending.shift();
      if (pending === undefined) {
        this.#fail(new Error("oracle session returned an unsolicited line"));
        return;
      }
      pending.resolve({
        id: pending.id,
        ok: true,
        oracle: {
          engine: "liblouis",
          status: LIBLOUIS_ORACLE_STATUS,
          tables: ["en-ueb-g2.ctb"],
          version: this.#version,
        },
        output,
      });
    });
    this.#child.once("error", (error) => {
      this.#fail(error);
    });
    this.#child.once("close", (code) => {
      if (!this.#closed || this.#pending.length > 0 || code !== 0) {
        const detail = this.#stderr.trim();
        this.#fail(new Error(
          `oracle session exited with ${String(code)}${detail.length === 0 ? "" : `: ${detail}`}`,
        ));
      }
    });
  }

  #fail(error: Error): void {
    this.#closed = true;
    for (const pending of this.#pending.splice(0)) {
      pending.reject(error);
    }
  }

  translate(id: string, text: string): Promise<OracleTranslation> {
    if (this.#closed) {
      return Promise.reject(new Error("oracle session is closed"));
    }
    if (text.includes("\n") || text.includes("\r")) {
      return Promise.reject(new Error("oracle session input must be one line"));
    }
    return new Promise((resolvePromise, reject) => {
      this.#pending.push({ id, reject, resolve: resolvePromise });
      this.#child.stdin.write(`${encodeOracleInput(text)}\n`, "utf8", (error) => {
        if (error !== null && error !== undefined) {
          this.#fail(error);
        }
      });
    });
  }

  async close(): Promise<void> {
    this.#closed = true;
    if (this.#pending.length > 0) {
      throw new Error("cannot close oracle session with pending translations");
    }
    await new Promise<void>((resolvePromise, reject) => {
      this.#child.once("error", reject);
      this.#child.once("close", (code) => {
        const detail = this.#stderr.trim();
        if (code === 0 && detail.length === 0) {
          resolvePromise();
        } else {
          reject(new Error(
            `oracle session exited with ${String(code)}${detail.length === 0 ? "" : `: ${detail}`}`,
          ));
        }
      });
      this.#child.stdin.end();
    });
  }
}
