<!--
  A language's flag, drawn as inline SVG from `@mia/i18n`'s `LANGUAGE_FLAGS` —
  the same artwork the storefront's switcher draws. Decorative: the label beside
  it names the language.
-->
<script lang="ts">
  import { LANGUAGE_FLAGS } from '@mia/i18n';
  import type { LanguageCode } from '@mia/validators';

  import { cn } from '$lib/utils.js';

  interface Props {
    code: LanguageCode;
    class?: string;
  }

  let { code, class: className }: Props = $props();

  const flag = $derived(LANGUAGE_FLAGS[code]);
</script>

<!--
  The box is the span, not the svg: shadcn's buttons and menu items force any
  `svg` without a `size-*` class to a 16px square (`[&_svg:not([class*='size-'])]`),
  which squashed a 3:2 flag. `size-full` opts the svg out of that rule and lets
  it fill the 3:2 span.
-->
<span
  class={cn(
    'block h-3 w-4.5 shrink-0 overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgb(0_0_0/0.12)]',
    className,
  )}
  aria-hidden="true"
>
  <svg
    class="block size-full"
    viewBox={flag.viewBox}
    preserveAspectRatio="xMidYMid slice"
    focusable="false"
  >
    <!-- Safe: `flag.body` is a constant from `@mia/i18n`, never user input. -->
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html flag.body}
  </svg>
</span>
