<script lang="ts">
  import { type MessageKey, t } from '~/lib/ui-text';
  import { P } from '@mia/permissions';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import CheckIcon from '@lucide/svelte/icons/check';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import MailIcon from '@lucide/svelte/icons/mail';
  import PrinterIcon from '@lucide/svelte/icons/printer';
  import XCircleIcon from '@lucide/svelte/icons/x-circle';
  import type { InferResponseType } from 'hono/client';
  import { toast } from 'svelte-sonner';

  import { page } from '$app/state';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { cn } from '$lib/utils.js';
  import { api, apiUrl } from '~/lib/api';
  import PageHeader from '~/lib/components/page-header.svelte';
  import ResourceView from '~/lib/components/resource-view.svelte';
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
        await api.api.admin.contracts[':id'].$get({ param: { id: id! } }, { init: { signal } }),
      ),
    { enabled: () => session.can(P.CONTRACT_READ) },
  );

  const canUpdate = $derived(session.can(P.CONTRACT_UPDATE));

  const headerDescription = $derived.by(() => {
    if (!contract.data) return '';
    if (!contract.data.orderNumber) return t('contracts.headerManual');
    return t('contracts.headerOrder', { number: contract.data.orderNumber });
  });

  let busy = $state<string | null>(null);
  let voidReason = $state('');
  let previewHtml = $state<string | null>(null);
  let previewError = $state<string | null>(null);
  let previewFrame = $state<HTMLIFrameElement | null>(null);

  /*
    The preview is fetched with credentials and rendered via `srcdoc` rather than
    pointing the iframe at the API: a bare iframe `src` carries no error handling
    and, depending on cookie SameSite, sometimes no session either. Fetching also
    hands us the HTML for "open in new tab" and printing. Re-runs whenever the
    contract is replaced by an action, so a fresh signature shows up in it.
  */
  $effect(() => {
    const c = contract.data;
    if (!c) return;
    const controller = new AbortController();
    previewError = null;
    fetch(apiUrl(`/api/admin/contracts/${c.id}/preview`), {
      credentials: 'include',
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(t('contracts.previewLoadFailedStatus', { status: r.status }));
        previewHtml = await r.text();
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        previewError = err instanceof Error ? err.message : t('contracts.previewLoadFailed');
      });
    return () => controller.abort();
  });

  function openPreviewTab() {
    if (!previewHtml) return;
    const url = URL.createObjectURL(new Blob([previewHtml], { type: 'text/html' }));
    window.open(url, '_blank', 'noopener');
    // The new tab has the document by now; the URL itself can go.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  /** The browser's print dialog on the contract alone — "Save as PDF" lives there. */
  function printContract() {
    previewFrame?.contentWindow?.print();
  }

  const TIMELINE_STEPS = [
    { key: 'createdAt', labelKey: 'status.contractGenerated' },
    { key: 'sentAt', labelKey: 'status.contractSent' },
    { key: 'viewedAt', labelKey: 'status.contractViewed' },
    { key: 'signedAt', labelKey: 'status.contractSigned' },
  ] as const satisfies readonly { key: string; labelKey: MessageKey }[];

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
      toast.success(t('contracts.toastLinkResent', { number: c.number }));
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
      toast.success(t('contracts.toastVoided', { number: c.number }));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      busy = null;
    }
  }
</script>

<section class="admin-page">
  <PageHeader
    eyebrow={t('contracts.listTitle')}
    title={contract.data?.number ?? t('contracts.detailFallbackTitle')}
    description={headerDescription}
  >
    {#snippet actions()}
      <Button href={routes.contracts} variant="outline">
        <ArrowLeftIcon />
        {t('contracts.backToContracts')}
      </Button>
    {/snippet}
  </PageHeader>

  <ResourceView resource={contract} noun={t('entities.contractNoun')}>
    {#snippet children(c)}
      {@const meta = contractStatusMeta(c.status)}

      <div class="flex flex-wrap items-center gap-2">
        <Badge variant="outline" class={meta.tone}>
          <span class={cn('size-1.5 rounded-full', meta.dot)}></span>
          {meta.label}
        </Badge>
        <Badge variant="outline">{variantLabel(c.variant)}</Badge>
        {#if c.requiresDeposit}
          <Badge variant="outline" class="border-amber-500/40 text-amber-600 dark:text-amber-400">
            {t('contracts.depositRequired')}
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
              {t(step.labelKey)}
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
            {t('contracts.timelineVoided')}
          </span>
        {/if}
      </div>

      <div class="@container grid gap-5 @4xl:grid-cols-3">
        <div class="space-y-5 @4xl:col-span-2">
          <!-- Contract preview -->
          <Card.Root class="gap-0 overflow-hidden py-0">
            <div class="flex items-center justify-between gap-2 border-b px-4 py-2.5">
              <span class="text-sm font-medium">{t('contracts.previewTitle')}</span>
              <div class="flex items-center gap-1">
                <Button variant="ghost" size="sm" disabled={!previewHtml} onclick={openPreviewTab}>
                  <ExternalLinkIcon class="size-4" />
                  {t('contracts.openInNewTab')}
                </Button>
                <Button variant="ghost" size="sm" disabled={!previewHtml} onclick={printContract}>
                  <PrinterIcon class="size-4" />
                  {t('contracts.printPdf')}
                </Button>
              </div>
            </div>
            {#if previewHtml}
              <iframe
                bind:this={previewFrame}
                srcdoc={previewHtml}
                title={t('contracts.previewTitle')}
                class="h-[600px] w-full border-0 bg-white"
              ></iframe>
            {:else if previewError}
              <div class="flex h-40 items-center justify-center p-4 text-sm text-muted-foreground">
                {previewError}
              </div>
            {:else}
              <div class="p-4"><Skeleton class="h-[600px] w-full" /></div>
            {/if}
          </Card.Root>
        </div>

        <div class="space-y-5">
          <!-- Details -->
          <Card.Root class="gap-0 py-0">
            <div class="border-b px-4 py-2.5 text-sm font-medium">
              {t('contracts.detailsTitle')}
            </div>
            <div class="space-y-2 p-4 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">{t('contracts.colContract')}</span>
                <span class="font-mono font-medium">{c.number}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">{t('contracts.colOrder')}</span>
                {#if c.orderId}
                  <a
                    href={routes.orderDetail(c.orderId)}
                    class="font-mono font-medium hover:underline"
                  >
                    {c.orderNumber}
                  </a>
                {:else}
                  <span class="text-muted-foreground">{t('contracts.manualNoOrder')}</span>
                {/if}
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">{t('contracts.colVariant')}</span>
                <span>{variantLabel(c.variant)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">{t('contracts.detailLanguage')}</span>
                <span class="uppercase">{c.language}</span>
              </div>
              {#if c.requiresDeposit}
                <div class="flex justify-between">
                  <span class="text-muted-foreground">{t('contracts.detailDeposit')}</span>
                  <span class="tabular-nums"
                    >{c.depositAmount ? `€ ${c.depositAmount}` : EM_DASH}</span
                  >
                </div>
              {/if}
            </div>
          </Card.Root>

          <!-- Timestamps -->
          <Card.Root class="gap-0 py-0">
            <div class="border-b px-4 py-2.5 text-sm font-medium">
              {t('contracts.timestampsTitle')}
            </div>
            <div class="space-y-2 p-4 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">{t('contracts.detailCreated')}</span>
                <span>{formatDateTime(c.createdAt)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">{t('status.contractSent')}</span>
                <span>{orDash(c.sentAt ? formatDateTime(c.sentAt) : null)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">{t('status.contractViewed')}</span>
                <span>{orDash(c.viewedAt ? formatDateTime(c.viewedAt) : null)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">{t('status.contractSigned')}</span>
                <span>{orDash(c.signedAt ? formatDateTime(c.signedAt) : null)}</span>
              </div>
              {#if c.voidedAt}
                <div class="flex justify-between">
                  <span class="text-muted-foreground">{t('status.contractVoided')}</span>
                  <span>{formatDateTime(c.voidedAt)}</span>
                </div>
                {#if c.voidedByAdminName}
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">{t('contracts.voidedBy')}</span>
                    <span>{c.voidedByAdminName}</span>
                  </div>
                {/if}
                {#if c.voidReason}
                  <div>
                    <span class="text-muted-foreground">{t('contracts.detailReason')}</span>
                    <p class="mt-1 whitespace-pre-wrap">{c.voidReason}</p>
                  </div>
                {/if}
              {/if}
            </div>
          </Card.Root>

          <!-- Actions -->
          {#if c.status !== 'signed' && c.status !== 'voided'}
            <Card.Root class="gap-0 py-0">
              <div class="border-b px-4 py-2.5 text-sm font-medium">
                {t('common.actions')}
              </div>
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
                  {c.sentAt ? t('contracts.resendSigningLink') : t('contracts.sendSigningLink')}
                </Button>

                <div class="space-y-2">
                  <Textarea
                    bind:value={voidReason}
                    rows={2}
                    disabled={!canUpdate}
                    placeholder={t('contracts.voidReasonPlaceholder')}
                    aria-label={t('contracts.voidReasonLabel')}
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
                    {t('contracts.voidAction')}
                  </Button>
                </div>
              </div>
            </Card.Root>
          {/if}
        </div>
      </div>

      <p class="text-xs text-muted-foreground">
        {t('contracts.lastUpdated', {
          date: c.updatedAt ? formatDateTime(c.updatedAt) : EM_DASH,
        })}
      </p>
    {/snippet}
  </ResourceView>
</section>
