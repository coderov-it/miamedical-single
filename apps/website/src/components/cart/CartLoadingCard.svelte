<!--
  The first paint, and it promises nothing.

  The lines live in `localStorage`, so the server cannot know whether this cart has
  rows; it used to render the empty state and get corrected on hydration, which is a
  content flash on every visit. This plate holds until storage has been read AND the
  first price response has landed.

  `data-cart-boot` is what the page's <noscript> style hides, so a browser that will
  never run the island shows the page's own fallback instead of a spinner that cannot
  resolve.
-->
<script lang="ts">
  interface Props {
    label: string;
  }

  const { label }: Props = $props();
</script>

<div
  class="border-hair rounded-card flex min-h-40 flex-col items-center justify-center gap-4 border bg-white p-8"
  role="status"
  aria-live="polite"
  data-cart-boot
>
  <span
    class="border-hair border-t-accent size-7 animate-spin rounded-full border-[3px]"
    aria-hidden="true"
  ></span>
  <span class="text-ink-2 text-[16px] font-semibold">{label}</span>
</div>
