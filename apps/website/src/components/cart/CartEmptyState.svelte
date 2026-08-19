<!--
  Nothing in the cart. The reference design has no such state — it always has a cart
  behind it — so this one is the site's own, and it offers the one thing a customer
  with an empty cart can actually do.
-->
<script lang="ts">
  import type { CartCopy } from '~/lib/cart';

  interface Props {
    copy: CartCopy;
    catalogPath: string;
  }

  const { copy, catalogPath }: Props = $props();
</script>

<div
  class="border-hair shadow-pdp-card flex max-w-150 flex-col items-start gap-4 rounded-[14px] border bg-white p-7"
>
  <h2 class="m-0 text-[19px] font-bold">{copy.emptyTitle}</h2>
  <p class="text-ink-2 m-0 text-[16px] leading-[1.55]">{copy.emptyDetail}</p>
  <a class="btn btn-soft min-h-12 px-6 text-[16px]" href={catalogPath}>{copy.goToCatalog}</a>
</div>
