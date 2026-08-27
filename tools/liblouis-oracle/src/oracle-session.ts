import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";

import { LIBLOUIS_ORACLE_STATUS } from "./metadata.js";
import {
  encodeOracleInput,
  type OracleTranslation,
  runOracleTranslation,
} from "./runner.js";

interface PendingTranslation {
  readonly id: string;
  readonly reject: (error: Error) => void;
  readonly resolve: (translation: OracleTranslation) => void;
}

interface OracleSessionOptions {
  readonly platform?: NodeJS.Platform;
  readonly runTranslation?: typeof runOracleTranslation;
  readonly spawnProcess?: (
    command: string,
    arguments_: readonly string[],
  ) => ChildProcessWithoutNullStreams;
}

export class Grade2OracleSession {
  readonly #child: ChildProcessWithoutNullStreams | undefined;
  #closed = false;
  readonly #executable: string;
  readonly #exit: Promise<Error | undefined> | undefined;
  readonly #pending: PendingTranslation[] = [];
  readonly #runTranslation: typeof runOracleTranslation;
  #stderr = "";
  readonly #version: string;

  constructor(
    executable: string,
    version: string,
    options: OracleSessionOptions = {},
  ) {
    this.#executable = executable;
    this.#runTranslation = options.runTranslation ?? runOracleTranslation;
    this.#version = version;
    if ((options.platform ?? process.platform) !== "linux") {
      this.#child = undefined;
      this.#exit = undefined;
      return;
    }
    const oracleArguments = [
      "--forward",
      "--display-table",
      "unicode.dis",
      "en-ueb-g2.ctb",
    ];
    const spawnProcess = options.spawnProcess ?? ((command, arguments_) =>
      spawn(command, arguments_, {
        env: process.env,
        shell: false,
        stdio: "pipe",
        windowsHide: true,
      }));
    this.#child = spawnProcess("stdbuf", ["-oL", executable, ...oracleArguments]);
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
    this.#exit = new Promise((resolvePromise) => {
      this.#child?.once("error", (error) => {
        this.#fail(error);
        resolvePromise(error);
      });
      this.#child?.once("close", (code) => {
        const detail = this.#stderr.trim();
        const error = code === 0 && detail.length === 0 && this.#closed
          ? undefined
          : new Error(
            `oracle session exited with ${String(code)}${detail.length === 0 ? "" : `: ${detail}`}`,
          );
        if (error !== undefined) {
          this.#fail(error);
        }
        resolvePromise(error);
      });
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
    if (this.#child === undefined) {
      return this.#runTranslation(this.#executable, {
        direction: "forward",
        id,
        mode: "grade2",
        text,
      }, this.#version);
    }
    const child = this.#child;
    return new Promise((resolvePromise, reject) => {
      this.#pending.push({ id, reject, resolve: resolvePromise });
      child.stdin.write(`${encodeOracleInput(text)}\n`, "utf8", (error) => {
        if (error !== null && error !== undefined) {
          this.#fail(error);
        }
      });
    });
  }

  async close(): Promise<void> {
    if (this.#pending.length > 0) {
      throw new Error("cannot close oracle session with pending translations");
    }
    this.#closed = true;
    if (this.#child === undefined || this.#exit === undefined) {
      return;
    }
    if (!this.#child.stdin.destroyed) {
      this.#child.stdin.end();
    }
    const error = await this.#exit;
    if (error !== undefined) {
      throw error;
    }
  }
}
