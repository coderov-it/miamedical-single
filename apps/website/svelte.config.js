/**
 * Not used by the build — `@astrojs/svelte` configures the compiler itself.
 *
 * This exists only so `svelte-check` can parse the islands, which
 * `astro check` refuses to: @astrojs/language-server filters `.svelte` out by
 * design ("we don't have the same understanding of Svelte and Vue files as
 * their own respective tools"). No preprocessor is declared because the
 * islands use nothing but `<script lang="ts">`, which svelte-check reads
 * natively.
 *
 * @type {import('svelte/compiler').CompileOptions}
 */
export default {};
