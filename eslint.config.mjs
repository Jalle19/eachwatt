import js from '@eslint/js'
import ts from 'typescript-eslint'

export default ts.config(
  {
    ignores: ['dist/**', 'webif/**', 'eslint.config.mjs'],
  },
  js.configs.recommended,
  ts.configs.recommendedTypeChecked,
  {
    // recommendedTypeChecked needs this
    languageOptions: {
      parserOptions: {
        projectService: true,
        parser: ts.parser,
      },
    },
  },
  {
    rules: {
      'no-console': 'error',
      // We have type-hinted functions that in their dummy implementations return static data
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/return-await': 'error',
    },
  },
)
