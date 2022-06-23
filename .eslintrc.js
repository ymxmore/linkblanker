module.exports = {
    root: true,
    env: {
        browser: true,
        es6: true,
        node: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2022,
        ecmaFeatures: {
            jsx: true,
        },
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.eslint.json']
    },
    plugins: [
        '@typescript-eslint',
        'import',
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'prettier',
    ],
    rules: {
        '@typescript-eslint/no-explicit-any': 0,
        '@typescript-eslint/no-unsafe-member-access': 0,
        '@typescript-eslint/no-unsafe-argument': 0,
        '@typescript-eslint/restrict-template-expressions': 0,
        '@typescript-eslint/no-empty-interface': 0,
        'sort-imports': 0,
        'import/order': [2, {
            alphabetize: {
                order: 'asc',
            },
        }],
    },
};
