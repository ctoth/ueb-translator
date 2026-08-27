import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

const runtimeSourceBoundaries = [{
  group: ["../rules/**", "../tools/**"],
  message: "Published runtime modules must not import development-only rules or tools.",
}];

const genericRuntimeBoundaries = [
  ...runtimeSourceBoundaries,
  {
    group: [
      "./generated/**",
      "./grade1.js",
      "./grade2.js",
      "./technical.js",
    ],
    message: "Generic runtime modules must not depend on generated UEB packages or public mode entry points.",
  },
];

export default tseslint.config(
  {
    ignores: [
      "coverage/**",
      "dist/**",
      "eslint.config.mjs",
      "node_modules/**",
    ],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ["**/*.ts", "**/*.mts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "never" }
      ],
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" }
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/prefer-readonly": "error"
    },
  },
  {
    files: ["src/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: runtimeSourceBoundaries }],
    },
  },
  {
    files: [
      "src/composition.ts",
      "src/contextual-transducer.ts",
      "src/mode-engine.ts",
      "src/symbol-program.ts",
    ],
    rules: {
      "no-restricted-imports": ["error", { patterns: genericRuntimeBoundaries }],
    },
  },
  {
    files: ["src/grade2.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [{
          message: "Grade 2 must compose generated programs instead of calling the Grade 1 entry point.",
          name: "./grade1.js",
        }],
        patterns: runtimeSourceBoundaries,
      }],
    },
  },
  {
    files: ["rules/ueb-2024/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{
        group: [
          "**/src/generated/**",
          "**/src/grade1.js",
          "**/src/grade2.js",
          "**/src/index.js",
          "**/src/technical.js",
        ],
        message: "Rule compilers may depend on runtime contracts, never generated output or public entry points.",
      }] }],
    },
  },
);
