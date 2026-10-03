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
  import LoadingState from '../primitives/LoadingState.svelte';

  interface Props {
    label: string;
  }

  const { label }: Props = $props();
</script>

<div data-cart-boot>
  <LoadingState framed {label} />
</div>
