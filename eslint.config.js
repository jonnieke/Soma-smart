import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import react from 'eslint-plugin-react';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['dist'] },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        plugins: {
            'react-hooks': reactHooks,
            react,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            ...react.configs.recommended.rules,
            'react/react-in-jsx-scope': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            'react-hooks/set-state-in-effect': 'off',
            'react-hooks/preserve-manual-memoization': 'off',
            'react-hooks/immutability': 'off',
            'react-hooks/purity': 'off',
            'react/no-unescaped-entities': 'error',
            'no-irregular-whitespace': 'error',
            'prefer-const': 'error',
            '@typescript-eslint/ban-ts-comment': 'error',
            'no-empty': 'error',
            'no-useless-escape': 'error',
            '@typescript-eslint/no-unused-expressions': 'error',
            'react/prop-types': 'off',
            'react-hooks/exhaustive-deps': 'off',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
);
