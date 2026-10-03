<!--
  A titled card: the heading on its own row, a hairline under it running the
  card's full width, and the body below. The section exists from the first
  paint; only its body changes — a LoadingState while the data is on its way,
  the content once it is here.

  The body's first child loses its top margin, so content written for a plain
  CARD (where a `mt-3` sat under the heading) does not open on a double gap.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  import { HEADING } from './fields';

  interface Props {
    title: string;
    class?: string;
    children: Snippet;
  }

  const { title, class: className = '', children }: Props = $props();
</script>

<section class="border-hair rounded-card border bg-white {className}">
  <header class="border-hair mid:px-6 border-b px-5 py-4">
    <h2 class={HEADING}>{title}</h2>
  </header>
  <div class="mid:p-6 p-5 [&>:first-child]:mt-0">
    {@render children()}
  </div>
</section>
