// @ts-check

import js from '@eslint/js'
import ts from 'typescript-eslint'
import svelte from 'eslint-plugin-svelte'
import globals from 'globals'
import svelteConfig from './svelte.config.js'

export default ts.config(
  {
    ignores: ['.svelte-kit/**'],
  },
  js.configs.recommended,
  ts.configs.recommended,
  ...svelte.configs.recommended,
  {
    // Boilerplate from https://github.com/sveltejs/eslint-plugin-svelte
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    // Boilerplate from https://github.com/sveltejs/eslint-plugin-svelte
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'], // Add support for additional file extensions, such as .svelte
        parser: ts.parser,
        svelteConfig,
      },
    },
  },
  {
    rules: {
      // We don't have unique keys for everything
      'svelte/require-each-key': 'off',
    },
  }
)
