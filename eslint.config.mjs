import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [
  ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended-type-checked"),
  {
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json"
      },
      ecmaVersion: 2021,
      sourceType: "module",
    },

    rules: {
      "no-console": "error",
      // We have type-hinted functions that in their dummy implementations return static data
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/return-await": "error"
    },
  },
];