import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

import svelteConfig from './svelte.config.js';

/**
 * ESLint owns correctness; Prettier owns formatting. The two `prettier` configs
 * below are rule *disablers* — they switch off everything stylistic so
 * `pnpm lint` and `pnpm format` can never disagree. Keep them last.
 *
 * Type-aware linting (`parserOptions.projectService`) is deliberately off:
 * `pnpm check` already runs svelte-check over the same files with full type
 * information, so turning it on here would pay the typechecker cost twice for
 * rules that mostly restate what svelte-check already reports. Add
 * `projectService: true` to the Svelte block if you ever want the typed rules.
 */
export default defineConfig(
  globalIgnores([
    '.svelte-kit/',
    'dist/',
    '.turbo/',
    // Vendored shadcn-svelte source. The CLI regenerates these wholesale, so
    // findings here are neither ours to fix nor durable across an update.
    'src/lib/components/ui/',
  ]),

  js.configs.recommended,
  ts.configs.recommended,
  svelte.configs.recommended,
  prettier,
  svelte.configs.prettier,

  {
    // `ssr = false` in +layout.ts — this is a browser-only SPA, so Node globals
    // are genuinely absent at runtime and referencing one is a real bug.
    languageOptions: { globals: { ...globals.browser } },
  },

  {
    // Config files are the exception: they run in Node, at build time.
    files: ['*.config.{js,ts}', 'svelte.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },

  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
        extraFileExtensions: ['.svelte'],
        svelteConfig,
      },
    },
  },

  {
    rules: {
      // A leading underscore is this codebase's existing "deliberately unused"
      // marker — destructured discards, ignored callback params, caught errors
      // nobody inspects. Honour it instead of rewriting 16 call sites.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],

      // Wants `goto(resolve('/orders'))`. `resolve()` only does real work when
      // `kit.paths.base` is set, and this admin is served from a domain root —
      // so today it is 20 call sites of indirection for an identical string.
      // Turn this back on the moment the admin moves under a subpath.
      'svelte/no-navigation-without-resolve': 'off',

      // Flags every `new Map/Set/URLSearchParams`, but the reactive variants
      // only matter for an instance that is *mutated after creation and read in
      // markup*. All nine hits here are the other thing: scratch values built
      // inside a function or a `$derived.by` and never rendered from. The rule
      // has no option to tell those apart, and nine inline disables would be
      // noisier than this line.
      'svelte/prefer-svelte-reactivity': 'off',
    },
  },
);
