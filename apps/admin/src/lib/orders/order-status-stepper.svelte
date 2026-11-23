<!--
  The happy path of this order's own flow, one dot per step. A missed attempt
  sits on its parent step (orange dot, the missed label) because it is the same
  step not yet done, not a step of its own. The full map of branches is one
  click away rather than drawn here.
-->
<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import RouteIcon from '@lucide/svelte/icons/route';

  import { Button } from '$lib/components/ui/button/index.js';
  import { cn } from '$lib/utils.js';
  import OrderStatusMapDialog from '~/lib/orders/order-status-map-dialog.svelte';
  import { flowSteps, MISSED_PARENT, orderStatusMeta, type OrderStatus } from '~/lib/orders/status';
  import type { OrderDetail } from '~/lib/orders/types';
  import { t } from '~/lib/ui-text';

  interface Props {
    order: OrderDetail;
  }

  let { order }: Props = $props();

  let mapOpen = $state(false);

  const steps = $derived(flowSteps(order.flow));
  const status = $derived(order.status as OrderStatus);
  /** A missed status is drawn on the step it interrupts. */
  const anchor = $derived(MISSED_PARENT[status] ?? status);
  /** `-1` for an exit status, which greys the stepper rather than pretending it is step one. */
  const stepIndex = $derived(steps.indexOf(anchor));
  const missed = $derived(MISSED_PARENT[status] !== undefined);
</script>

<div class="flex flex-wrap items-center gap-x-2 gap-y-2">
  {#each steps as step, index (step)}
    {@const done = stepIndex >= 0 && index <= stepIndex}
    {@const isMissed = missed && step === anchor}
    <div class="flex items-center gap-2">
      <span
        class={cn(
          'flex size-5 items-center justify-center rounded-full border text-[0.625rem] font-medium',
          isMissed && 'border-transparent bg-orange-500 text-white',
          !isMissed && done && 'border-transparent bg-primary text-primary-foreground',
          !isMissed && !done && 'border-border text-muted-foreground',
        )}
      >
        {#if isMissed}!{:else if done}<CheckIcon class="size-3" />{:else}{index + 1}{/if}
      </span>
      <span
        class={cn(
          'text-sm',
          isMissed && 'font-medium text-orange-600 dark:text-orange-400',
          !isMissed && done && 'font-medium',
          !isMissed && !done && 'text-muted-foreground',
        )}
      >
        {orderStatusMeta(isMissed ? status : step).label}
      </span>
    </div>
    {#if index < steps.length - 1}
      <span class={cn('h-px w-4 shrink-0', stepIndex > index ? 'bg-primary' : 'bg-border')}></span>
    {/if}
  {/each}
  {#if stepIndex < 0}
    <span class="ml-2 text-sm text-muted-foreground">
      {t('orders.stepperEndedEarly', { status: orderStatusMeta(order.status).label })}
    </span>
  {/if}
  <Button variant="ghost" size="sm" class="ml-auto" onclick={() => (mapOpen = true)}>
    <RouteIcon class="size-4" />
    {t('orders.statusMap')}
  </Button>
</div>

<OrderStatusMapDialog {order} open={mapOpen} onClose={() => (mapOpen = false)} />
