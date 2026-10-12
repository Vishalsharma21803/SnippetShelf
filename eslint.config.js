import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';

export default [{ ignores: ['dist', 'node_modules', 'coverage'] }, { files: ['**/*.{ts,tsx}'], languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } }, plugins: { '@typescript-eslint': tseslint, 'react-hooks': reactHooks }, rules: { ...tseslint.configs.recommended.rules, ...reactHooks.configs.recommended.rules, '@typescript-eslint/no-explicit-any': 'off', 'react-hooks/exhaustive-deps': 'warn' } }];
