import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import type { ViteUserConfigExport } from "vitest/config";

const config: ViteUserConfigExport = defineConfig({
  test: {
    browser: {
      enabled: true,
      headless: true,
      instances: [{ browser: "chromium" }],
      provider: playwright(),
    },
    coverage: { enabled: false },
    include: ["browser-test/**/*.test.ts"],
  },
});

export default config;
