<script lang="ts">
  import { P } from '@mia/permissions';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import CheckIcon from '@lucide/svelte/icons/check';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import MailIcon from '@lucide/svelte/icons/mail';
  import XCircleIcon from '@lucide/svelte/icons/x-circle';
  import type { InferResponseType } from 'hono/client';
  import { toast } from 'svelte-sonner';

  import { page } from '$app/state';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { cn } from '$lib/utils.js';
  import { api } from '~/lib/api';
  import PageHeader from '~/lib/components/page-header.svelte';
  import { contractStatusMeta, variantLabel } from '~/lib/contracts/status';
  import { EM_DASH, formatDateTime, orDash } from '~/lib/format';
  import { errorMessage, unwrap } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';

  type ContractDetail = InferResponseType<
    (typeof api.api.admin.contracts)[':id']['$get'],
    200
  >['data'];

  const contract = new Resource(
    () => page.params.id,
    async (id, signal) =>
      unwrap<ContractDetail>(
        await api.api.admin.contracts[':id'].$get(
          { param: { id: id! } },
          { init: { signal } },
        ),
      ),
    { enabled: () => session.can(P.CONTRACT_READ) },
  );

  const canUpdate = $derived(session.can(P.CONTRACT_UPDATE));

  const headerDescription = $derived.by(() => {
    if (!contract.data) return '';
    if (!contract.data.orderNumber) return 'Manual contract';
    return `Order ${contract.data.orderNumber}`;
  });

  let busy = $state<string | null>(null);
  let voidReason = $state('');

  const TIMELINE_STEPS = [
    { key: 'createdAt', label: 'Generated' },
    { key: 'sentAt', label: 'Sent' },
    { key: 'viewedAt', label: 'Viewed' },
    { key: 'signedAt', label: 'Signed' },
  ] as const;

  const timelineIndex = $derived.by(() => {
    if (!contract.data) return -1;
    if (contract.data.status === 'voided') return -1;
    const c = contract.data;
    if (c.signedAt) return 3;
    if (c.viewedAt) return 2;
    if (c.sentAt) return 1;
    return 0;
  });

  async function resend() {
    const c = contract.data;
    if (!c) return;
    busy = 'send';
    try {
      const updated = await unwrap<ContractDetail>(
        await api.api.admin.contracts[':id'].send.$post({ param: { id: c.id } }),
      );
      contract.set(updated);
      toast.success(`Signing link resent for ${c.number}.`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      busy = null;
    }
  }

  async function voidContract() {
    const c = contract.data;
    if (!c || !voidReason.trim()) return;
    busy = 'void';
    try {
      const updated = await unwrap<ContractDetail>(
        await api.api.admin.contracts[':id'].void.$post({
          param: { id: c.id },
          json: { reason: voidReason.trim() },
        }),
      );
      contract.set(updated);
      voidReason = '';
      toast.success(`Contract ${c.number} voided.`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      busy = null;
    }
  }

  function previewUrl(id: string): string {
    return `/api/admin/contracts/${id}/preview`;
  }
</script>

<section class="admin-page">
  <PageHeader
    eyebrow="Contracts"
    title={contract.data?.number ?? 'Contract'}
    description={headerDescription}
  >
    {#snippet actions()}
      <Button href={routes.contracts} variant="outline">
        <ArrowLeftIcon />
        Back to contracts
      </Button>
    {/snippet}
  </PageHeader>

  {#if contract.error}
    <Empty.Root class="border bg-card">
      <Empty.Header>
        <Empty.Title>This contract could not be loaded</Empty.Title>
        <Empty.Description>{contract.error}</Empty.Description>
      </Empty.Header>
      <Empty.Content>
        <Button variant="outline" onclick={() => contract.refresh()}>Try again</Button>
      </Empty.Content>
    </Empty.Root>
  {:else if !contract.data}
    <div class="space-y-4">
      <Skeleton class="h-20 w-full" />
      <Skeleton class="h-64 w-full" />
    </div>
  {:else}
    {@const c = contract.data}
    {@const meta = contractStatusMeta(c.status)}

    <div class="flex flex-wrap items-center gap-2">
      <Badge variant="outline" class={meta.tone}>
        <span class={cn('size-1.5 rounded-full', meta.dot)}></span>
        {meta.label}
      </Badge>
      <Badge variant="outline">{variantLabel(c.variant)}</Badge>
      {#if c.requiresDeposit}
        <Badge variant="outline" class="border-amber-500/40 text-amber-600 dark:text-amber-400">
          Deposit required
        </Badge>
      {/if}
    </div>

    <!-- Timeline stepper -->
    <div class="flex items-center gap-2">
      {#each TIMELINE_STEPS as step, index (step.key)}
        {@const done = timelineIndex >= 0 && index <= timelineIndex}
        <div class="flex items-center gap-2">
          <span
            class={cn(
              'flex size-5 items-center justify-center rounded-full border text-[0.625rem] font-medium',
              done
                ? 'border-transparent bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground',
            )}
          >
            {#if done}<CheckIcon class="size-3" />{:else}{index + 1}{/if}
          </span>
          <span class={cn('text-sm', done ? 'font-medium' : 'text-muted-foreground')}>
            {step.label}
          </span>
        </div>
        {#if index < TIMELINE_STEPS.length - 1}
          <span
            class={cn('h-px w-6 shrink-0', timelineIndex > index ? 'bg-primary' : 'bg-border')}
          ></span>
        {/if}
      {/each}
      {#if c.status === 'voided'}
        <span class="ml-2 text-sm text-muted-foreground">
          — voided, so the path above ended early.
        </span>
      {/if}
    </div>

    <div class="@container grid gap-5 @4xl:grid-cols-3">
      <div class="space-y-5 @4xl:col-span-2">
        <!-- Contract preview -->
        <Card.Root class="gap-0 overflow-hidden py-0">
          <div class="flex items-center justify-between border-b px-4 py-2.5">
            <span class="text-sm font-medium">Contract Preview</span>
            <Button
              href={previewUrl(c.id)}
              target="_blank"
              variant="ghost"
              size="sm"
            >
              <ExternalLinkIcon class="size-4" />
              Open in new tab
            </Button>
          </div>
          <iframe
            src={previewUrl(c.id)}
            title="Contract preview"
            class="h-[600px] w-full border-0 bg-white"
          ></iframe>
        </Card.Root>
      </div>

      <div class="space-y-5">
        <!-- Details -->
        <Card.Root class="gap-0 py-0">
          <div class="border-b px-4 py-2.5 text-sm font-medium">Details</div>
          <div class="space-y-2 p-4 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Contract</span>
              <span class="font-mono font-medium">{c.number}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Order</span>
              {#if c.orderId}
                <a
                  href={routes.orderDetail(c.orderId)}
                  class="font-mono font-medium hover:underline"
                >
                  {c.orderNumber}
                </a>
              {:else}
                <span class="text-muted-foreground">Manual — no order</span>
              {/if}
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Variant</span>
              <span>{variantLabel(c.variant)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Language</span>
              <span class="uppercase">{c.language}</span>
            </div>
            {#if c.requiresDeposit}
              <div class="flex justify-between">
                <span class="text-muted-foreground">Deposit</span>
                <span class="tabular-nums">{c.depositAmount ? `€ ${c.depositAmount}` : EM_DASH}</span>
              </div>
            {/if}
          </div>
        </Card.Root>

        <!-- Timestamps -->
        <Card.Root class="gap-0 py-0">
          <div class="border-b px-4 py-2.5 text-sm font-medium">Timestamps</div>
          <div class="space-y-2 p-4 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Created</span>
              <span>{formatDateTime(c.createdAt)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Sent</span>
              <span>{orDash(c.sentAt ? formatDateTime(c.sentAt) : null)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Viewed</span>
              <span>{orDash(c.viewedAt ? formatDateTime(c.viewedAt) : null)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Signed</span>
              <span>{orDash(c.signedAt ? formatDateTime(c.signedAt) : null)}</span>
            </div>
            {#if c.voidedAt}
              <div class="flex justify-between">
                <span class="text-muted-foreground">Voided</span>
                <span>{formatDateTime(c.voidedAt)}</span>
              </div>
              {#if c.voidedByAdminName}
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Voided by</span>
                  <span>{c.voidedByAdminName}</span>
                </div>
              {/if}
              {#if c.voidReason}
                <div>
                  <span class="text-muted-foreground">Reason</span>
                  <p class="mt-1 whitespace-pre-wrap">{c.voidReason}</p>
                </div>
              {/if}
            {/if}
          </div>
        </Card.Root>

        <!-- Actions -->
        {#if c.status !== 'signed' && c.status !== 'voided'}
          <Card.Root class="gap-0 py-0">
            <div class="border-b px-4 py-2.5 text-sm font-medium">Actions</div>
            <div class="space-y-3 p-4">
              <Button
                variant="outline"
                size="sm"
                class="w-full"
                disabled={!canUpdate || busy !== null}
                onclick={resend}
              >
                {#if busy === 'send'}<Spinner />{/if}
                <MailIcon class="size-4" />
                {c.sentAt ? 'Resend signing link' : 'Send signing link'}
              </Button>

              <div class="space-y-2">
                <Textarea
                  bind:value={voidReason}
                  rows={2}
                  disabled={!canUpdate}
                  placeholder="Reason for voiding…"
                  aria-label="Void reason"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  class="w-full"
                  disabled={!canUpdate || busy !== null || !voidReason.trim()}
                  onclick={voidContract}
                >
                  {#if busy === 'void'}<Spinner />{/if}
                  <XCircleIcon class="size-4" />
                  Void contract
                </Button>
              </div>
            </div>
          </Card.Root>
        {/if}
      </div>
    </div>

    <p class="text-xs text-muted-foreground">
      Last updated {c.updatedAt ? formatDateTime(c.updatedAt) : EM_DASH}
    </p>
  {/if}
</section>
