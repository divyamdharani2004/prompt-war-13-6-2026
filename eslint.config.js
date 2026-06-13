import js from "@eslint/js";
import globals from "globals";

/** Flat ESLint config (ESLint 9+). */
export default [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "smart"],
    },
  },
  {
    // Browser front-end.
    files: ["public/**/*.js"],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    // Test files use the node:test globals via imports; allow node env.
    files: ["test/**/*.js"],
    languageOptions: { globals: { ...globals.node } },
  },
  { ignores: ["node_modules/", "data/", "public/vendor/"] },
];
