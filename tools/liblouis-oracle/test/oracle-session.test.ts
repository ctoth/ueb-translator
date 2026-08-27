import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";

import { describe, expect, it, vi } from "vitest";

import { Grade2OracleSession } from "../src/oracle-session.js";
import type { OracleTranslation } from "../src/runner.js";

class FakeChild extends EventEmitter {
  readonly stdin = new PassThrough();
  readonly stdout = new PassThrough();
  readonly stderr = new PassThrough();
}

describe("persistent Liblouis session", () => {
  it("uses one-shot translations where stdbuf line buffering is unavailable", async () => {
    const translation: OracleTranslation = {
      id: "case",
      ok: true,
      oracle: {
        engine: "liblouis",
        status: "test",
        tables: ["en-ueb-g2.ctb"],
        version: "3.38.0",
      },
      output: "⠞⠑⠌",
    };
    const runTranslation = vi.fn(() => Promise.resolve(translation));
    const session = new Grade2OracleSession("lou_translate", "3.38.0", {
      platform: "win32",
      runTranslation,
      spawnProcess: () => {
        throw new Error("must not spawn a buffered persistent child");
      },
    });

    await expect(session.translate("case", "test")).resolves.toBe(translation);
    expect(runTranslation).toHaveBeenCalledOnce();
    await expect(session.close()).resolves.toBeUndefined();
  });

  it("settles close after the child has already exited", async () => {
    const child = new FakeChild();
    const session = new Grade2OracleSession("lou_translate", "3.38.0", {
      platform: "linux",
      // FakeChild deliberately implements the streams and events used by the session.
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      spawnProcess: () => child as never,
    });
    child.emit("close", 1);

    await expect(session.close()).rejects.toThrow("oracle session exited with 1");
  });
});
