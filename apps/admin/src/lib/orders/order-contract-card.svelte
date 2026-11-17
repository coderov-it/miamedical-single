<script lang="ts">
  import { P } from '@mia/permissions';
  import FileSignatureIcon from '@lucide/svelte/icons/file-signature';
  import type { InferResponseType } from 'hono/client';
  import { toast } from 'svelte-sonner';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { cn } from '$lib/utils.js';
  import { api } from '~/lib/api';
  import BusyButton from '~/lib/components/busy-button.svelte';
  import { contractStatusMeta, variantLabel } from '~/lib/contracts/status';
  import { formatDate, formatDateTime } from '~/lib/format';
  import type { OrderDetail } from '~/lib/orders/types';
  import { errorMessage, unwrap } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';
  import { t } from '~/lib/ui-text';

  let { order }: { order: OrderDetail } = $props();

  type ContractSummaries = InferResponseType<
    (typeof api.api.admin.contracts)['by-order'][':orderId']['$get'],
    200
  >['data'];

  const orderContracts = new Resource(
    () => order.id,
    async (id, signal) =>
      unwrap<ContractSummaries>(
        await api.api.admin.contracts['by-order'][':orderId'].$get(
          { param: { orderId: id } },
          { init: { signal } },
        ),
      ),
    { enabled: () => session.can(P.CONTRACT_READ) },
  );

  /** Whether anything on this order is rented — the case where a contract is owed. */
  const hasRental = $derived(
    order.items.some((item) => item.configuration?.pricingMode === 'rental'),
  );
  /** Newest first from the server; the first non-voided one is the live one. */
  const liveContract = $derived(
    orderContracts.data?.find((contract) => contract.status !== 'voided') ?? null,
  );

  let generating = $state(false);

  async function generateContract() {
    generating = true;
    try {
      await unwrap(await api.api.admin.contracts.generate.$post({ json: { orderId: order.id } }));
      orderContracts.refresh();
      toast.success(t('orders.contractGenerated'));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      generating = false;
    }
  }

  /** Re-read the contracts, after something else on the order may have issued one. */
  export function refresh() {
    orderContracts.refresh();
  }
</script>

<!-- Contract. Renewals stack up, so this card reads as a history: the
     live contract on top, every earlier one dated beneath it. -->
<Card.Root class="gap-0 py-0">
  <div class="border-b px-4 py-2.5 text-sm font-medium">{t('orders.contractTitle')}</div>
  <div class="p-4 text-sm">
    {#if orderContracts.loading && !orderContracts.data}
      <div class="space-y-2">
        <Skeleton class="h-5 w-32 rounded-full" />
        <Skeleton class="h-4 w-48" />
      </div>
    {:else if liveContract}
      {@const cMeta = contractStatusMeta(liveContract.status)}
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <Badge variant="outline" class={cMeta.tone}>
            <span class={cn('size-1.5 rounded-full', cMeta.dot)}></span>
            {cMeta.label}
          </Badge>
          <span class="font-mono text-xs text-muted-foreground">{liveContract.number}</span>
        </div>
        <p class="text-muted-foreground">{variantLabel(liveContract.variant)}</p>
        {#if liveContract.status !== 'signed'}
          <!-- The one fact an operator must not miss: no signature, no
               money and no goods. It gates "Mark paid" on the server. -->
          <p class="text-xs font-semibold text-amber-600 dark:text-amber-400">
            {t('orders.contractBlocked')}
          </p>
        {:else}
          <p class="text-xs text-muted-foreground">
            {t('orders.contractSignedOn', {
              date: liveContract.signedAt ? formatDateTime(liveContract.signedAt) : '',
            })}
          </p>
        {/if}
        <Button
          href={routes.contractDetail(liveContract.id)}
          variant="outline"
          size="sm"
          class="w-full"
        >
          <FileSignatureIcon class="size-4" />
          {t('orders.contractView')}
        </Button>

        {#if (orderContracts.data?.length ?? 0) > 1}
          <div class="space-y-1 border-t pt-2">
            <p class="text-xs font-medium text-muted-foreground">
              {t('orders.contractHistory')}
            </p>
            {#each orderContracts.data ?? [] as history (history.id)}
              {#if history.id !== liveContract.id}
                {@const hMeta = contractStatusMeta(history.status)}
                <p class="flex items-center gap-2 text-xs">
                  <a href={routes.contractDetail(history.id)} class="font-mono hover:underline">
                    {history.number}
                  </a>
                  <span class={hMeta.tone}>{hMeta.label}</span>
                  <span class="ml-auto text-muted-foreground">
                    {formatDate(history.createdAt)}
                  </span>
                </p>
              {/if}
            {/each}
          </div>
        {/if}
      </div>
    {:else if !hasRental}
      <p class="text-muted-foreground">
        {t('orders.contractNoRental')}
      </p>
    {:else}
      <div class="space-y-2">
        <p class="text-xs font-semibold text-amber-600 dark:text-amber-400">
          {t('orders.contractNoneYet')}
        </p>
        {#if session.can(P.CONTRACT_CREATE)}
          <BusyButton
            variant="outline"
            size="sm"
            class="w-full"
            busy={generating}
            busyLabel={t('orders.contractGenerate')}
            onclick={generateContract}
          >
            <FileSignatureIcon class="size-4" />
            {t('orders.contractGenerate')}
          </BusyButton>
        {/if}
      </div>
    {/if}
  </div>
</Card.Root>
