import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Next.js + TS rules, then Prettier to disable any conflicting style rules
  ...compat.extends(
    'next/core-web-vitals',
    'next/typescript',
    'prettier'          // <- new line
  ),

  // keep CI quick by skipping generated folders
  {
    ignores: ['.next', 'node_modules'],
  },
];
