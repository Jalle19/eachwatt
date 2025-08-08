import js from '@eslint/js'
import ts from 'typescript-eslint'

export default ts.config(
  {
    ignores: ['dist/**', 'webif/**'],
  },
  js.configs.recommended,
  ts.configs.strict,
)
