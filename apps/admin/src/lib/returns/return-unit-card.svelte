<!--
  One returned unit as a long card. Image, product and order read left to
  right once the card is wide enough (container query, so the page width does
  not matter); below that they stack. The actions come in as a snippet so the
  two lists share everything else.
-->
<script lang="ts">
  import PackageIcon from '@lucide/svelte/icons/package';
  import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
  import type { Snippet } from 'svelte';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { cn } from '$lib/utils.js';
  import { mediaUrl } from '~/lib/api';
  import { formatDate, relativeTime } from '~/lib/format';
  import type { ReturnUnit } from '~/lib/returns/types';
  import { routes } from '~/lib/routes';
  import { t } from '~/lib/ui-text';

  interface Props {
    unit: ReturnUnit;
    /** False hides the actions column and lets the card span its full width. */
    hasActions: boolean;
    actions?: Snippet;
  }

  let { unit, hasActions, actions }: Props = $props();

  const period = $derived(
    unit.rentalStartDate && unit.rentalEndDate
      ? `${formatDate(unit.rentalStartDate)} → ${formatDate(unit.rentalEndDate)}`
      : null,
  );
  /** Email and city, the parts of the contact line that are plain text. */
  const contact = $derived([unit.customerEmail, unit.customerCity].filter(Boolean).join(' · '));
  const receivedLine = $derived.by(() => {
    if (!unit.receivedAt) return null;
    const when = relativeTime(unit.receivedAt);
    if (!unit.receivedByName) return t('returns.received', { when });
    return t('returns.receivedBy', { when, name: unit.receivedByName });
  });

  /*
    A title that does not fit one line drops a size and wraps to two. The test
    runs on a hidden single-line copy at the full size, not on the title itself:
    measuring the visible title would flip it back and forth, since the smaller
    size can fit on one line again.
  */
  let titleBox = $state<HTMLElement>();
  let titleProbe = $state<HTMLElement>();
  let titleWraps = $state(false);

  $effect(() => {
    const box = titleBox;
    const probe = titleProbe;
    if (!box || !probe) return;
    const check = () => {
      titleWraps = probe.offsetWidth > box.clientWidth;
    };
    const observer = new ResizeObserver(check);
    observer.observe(box);
    check();
    return () => observer.disconnect();
  });
</script>

<article class="@container">
  <div
    class={cn(
      'grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-4 gap-y-2.5 rounded-xl border bg-card p-3',
      '@2xl:grid-cols-[72px_minmax(0,1.3fr)_minmax(0,1fr)]',
      hasActions && '@6xl:grid-cols-[72px_minmax(0,1.4fr)_minmax(0,1fr)_auto]',
    )}
  >
    <div
      class="flex size-18 items-center justify-center overflow-hidden rounded-md border bg-muted"
    >
      {#if unit.productImage}
        <img
          src={mediaUrl(unit.productImage)}
          alt=""
          class="size-full rounded-md object-cover"
          loading="lazy"
        />
      {:else}
        <PackageIcon class="size-7 text-muted-foreground" aria-hidden="true" />
      {/if}
    </div>

    <div class="min-w-0 space-y-1">
      <div bind:this={titleBox} class="relative overflow-hidden">
        <span
          bind:this={titleProbe}
          aria-hidden="true"
          class="invisible absolute top-0 left-0 text-sm font-medium whitespace-nowrap"
        >
          {unit.productTitle}
        </span>
        <p
          class={cn(
            'line-clamp-2 font-medium',
            titleWraps ? 'text-[13px] leading-snug' : 'text-sm',
          )}
          title={unit.productTitle}
        >
          {#if unit.productId}
            <a href={routes.productDetail(unit.productId)} class="hover:underline">
              {unit.productTitle}
            </a>
          {:else}
            {unit.productTitle}
          {/if}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <Badge variant="secondary" class="h-5 px-1.5 text-[11px]">
          {t('returns.unitOf', { n: unit.unitNumber, total: unit.quantity })}
        </Badge>
        {#if period}
          <span class="flex items-center gap-1.5">
            <CalendarDaysIcon class="size-3.5 shrink-0" aria-hidden="true" />
            {period}
          </span>
        {/if}
        {#if receivedLine}<span>{receivedLine}</span>{/if}
      </div>
    </div>

    <div class="col-span-2 min-w-0 space-y-0.5 @2xl:col-span-1">
      <a
        href={routes.orderDetail(unit.orderId)}
        class="font-mono text-xs font-medium hover:underline"
      >
        {unit.orderNumber}
      </a>
      <p class="truncate text-sm font-medium" title={unit.customerName}>{unit.customerName}</p>
      <p class="truncate text-xs text-muted-foreground">
        {#if unit.customerPhone}
          <a href="tel:{unit.customerPhone}" class="hover:underline">{unit.customerPhone}</a>
          {#if contact}<span aria-hidden="true"> · </span>{/if}
        {/if}
        {contact}
      </p>
    </div>

    {#if hasActions}
      <!-- Under the details until the card is wide enough to give it a column. -->
      <div
        class="col-span-2 border-t pt-2.5 @2xl:col-span-3 @6xl:col-span-1 @6xl:w-75 @6xl:border-t-0 @6xl:pt-0"
      >
        {@render actions?.()}
      </div>
    {/if}
  </div>
</article>
