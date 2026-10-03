<!--
  THE section shape of the customer area: the heading on its own row, a
  hairline under it running the card's full width, and the body below. Every
  titled block in the area is one of these, so a customer learns one shape.

  The section exists from the first paint; only its body changes — a
  LoadingState while the data is on its way, the content once it is here.

    action — the title row's trailing control ("See all orders", "Mark all read")
    flush  — body without padding, for a divided list whose rows run edge to edge;
             pass it only while the list is showing, so loading/empty/error
             states keep the padded body

  The padded body's first child loses its top margin, so content written for a
  plain CARD (where a `mt-3` sat under the heading) does not open on a double gap.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  import { HEADING } from './fields';

  interface Props {
    title: string;
    action?: Snippet;
    flush?: boolean;
    class?: string;
    children: Snippet;
  }

  const { title, action, flush = false, class: className = '', children }: Props = $props();

  const body = $derived(flush ? '' : 'mid:p-6 p-5 [&>:first-child]:mt-0');
</script>

<section class="border-hair rounded-card overflow-hidden border bg-white {className}">
  <header
    class="border-hair mid:px-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b px-5 py-4"
  >
    <h2 class={HEADING}>{title}</h2>
    {#if action}
      <div class="-my-2 flex items-center gap-3">{@render action()}</div>
    {/if}
  </header>
  <div class={body}>
    {@render children()}
  </div>
</section>
