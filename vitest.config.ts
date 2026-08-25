import { defineConfig } from "vitest/config";
import type { ViteUserConfigExport } from "vitest/config";

const config: ViteUserConfigExport = defineConfig({
  test: {
    include: [
      "test/**/*.test.ts",
      "tools/liblouis-oracle/test/**/*.test.ts",
      "tools/rule-compiler/test/**/*.test.ts",
    ],
    coverage: {
      enabled: true,
      include: ["src/**/*.ts", "tools/rule-compiler/src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json-summary"],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
});

export default config;
