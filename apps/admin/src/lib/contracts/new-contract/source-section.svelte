<script lang="ts">
  import { P } from '@mia/permissions';
  import SearchIcon from '@lucide/svelte/icons/search';
  import { toast } from 'svelte-sonner';

  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { api } from '~/lib/api';
  import { variantLabel } from '~/lib/contracts/status';
  import { errorMessage, unwrap } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { session } from '~/lib/session.svelte';
  import { t } from '~/lib/ui-text';
  import type { ContractForm } from './contract-form.svelte';
  import {
    RESULT_ROW_CLASS,
    type ContractDataShape,
    type ContractDetail,
    type ContractList,
  } from './types';

  let { form }: { form: ContractForm } = $props();

  let sourceQuery = $state('');
  let sourceOpen = $state(false);
  let copying = $state(false);

  const sourceResults = new Resource(
    () => sourceQuery.trim(),
    async (q, signal) => {
      const res = await api.api.admin.contracts.$get(
        { query: { page: '1', perPage: '8', ...(q ? { q } : {}) } },
        { init: { signal } },
      );
      const json = (await res.json()) as { data: ContractList };
      return json.data;
    },
    { enabled: () => session.can(P.CONTRACT_READ) && sourceOpen, debounce: 250 },
  );

  async function copyFromContract(id: string, number: string) {
    sourceOpen = false;
    sourceQuery = number;
    copying = true;
    try {
      const source = await unwrap<ContractDetail>(
        await api.api.admin.contracts[':id'].$get({ param: { id } }),
      );
      form.applyContract(source.contractData as unknown as ContractDataShape);
      toast.success(t('contracts.toastCopied', { number: source.number }));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      copying = false;
    }
  }
</script>

<!-- Copy from an earlier contract -->
<Card.Root class="gap-0 py-0">
  <div class="border-b px-4 py-2.5">
    <p class="text-sm font-medium">{t('contracts.sourceTitle')}</p>
    <p class="text-xs text-muted-foreground">
      {t('contracts.sourceHint')}
    </p>
  </div>
  <div class="p-4">
    <div class="relative">
      <SearchIcon
        class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        bind:value={sourceQuery}
        placeholder="CTR-2026-001000, Mario Rossi, mario@…"
        aria-label={t('contracts.sourceLabel')}
        class="pl-8"
        onfocus={() => (sourceOpen = true)}
        onblur={() => setTimeout(() => (sourceOpen = false), 150)}
      />
      {#if copying}
        <Spinner class="absolute top-1/2 right-2.5 -translate-y-1/2" />
      {/if}
      {#if sourceOpen}
        <div
          class="absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-md border bg-popover shadow-md"
        >
          {#if sourceResults.loading && !sourceResults.hasData}
            <p class="px-3 py-2 text-sm text-muted-foreground">{t('contracts.searching')}</p>
          {:else if (sourceResults.data ?? []).length === 0}
            <p class="px-3 py-2 text-sm text-muted-foreground">
              {sourceQuery.trim() ? t('contracts.sourceNoMatch') : t('contracts.sourceNone')}
            </p>
          {:else}
            {#if !sourceQuery.trim()}
              <p class="border-b px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {t('contracts.sourceRecent')}
              </p>
            {/if}
            {#each sourceResults.data ?? [] as option (option.id)}
              <button
                type="button"
                class={RESULT_ROW_CLASS}
                onmousedown={(event) => {
                  event.preventDefault();
                  void copyFromContract(option.id, option.number);
                }}
              >
                <span class="font-mono text-xs font-medium">{option.number}</span>
                <span class="min-w-0 flex-1 truncate">
                  {option.customerName ?? option.customerEmail ?? '—'}
                </span>
                <span class="shrink-0 text-xs text-muted-foreground">
                  {variantLabel(option.variant)}
                </span>
              </button>
            {/each}
          {/if}
        </div>
      {/if}
    </div>
  </div>
</Card.Root>
