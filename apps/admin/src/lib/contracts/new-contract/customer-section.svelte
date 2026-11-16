<script lang="ts">
  import { P } from '@mia/permissions';
  import UserSearchIcon from '@lucide/svelte/icons/user-search';
  import { toast } from 'svelte-sonner';

  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { cn } from '$lib/utils.js';
  import { api } from '~/lib/api';
  import { Resource } from '~/lib/resource.svelte';
  import { session } from '~/lib/session.svelte';
  import { t } from '~/lib/ui-text';
  import type { ContractForm } from './contract-form.svelte';
  import { CUSTOMER_TYPES, RESULT_ROW_CLASS, type CustomerMatches } from './types';

  let { form }: { form: ContractForm } = $props();

  let customerQuery = $state('');
  let customerOpen = $state(false);

  const customerResults = new Resource(
    () => customerQuery.trim(),
    async (q, signal) => {
      if (q.length < 2) return [] as CustomerMatches;
      const res = await api.api.admin.orders.customers.$get({ query: { q } }, { init: { signal } });
      const json = (await res.json()) as { data: CustomerMatches };
      return json.data;
    },
    { enabled: () => session.can(P.ORDER_READ) && customerOpen, debounce: 250 },
  );

  function pickCustomer(match: CustomerMatches[number]) {
    customerOpen = false;
    customerQuery = '';
    form.applyCustomer(match);
    toast.success(t('contracts.toastCustomerFilled', { name: match.fullName || match.email }));
  }

  function customerTypeLabel(type: string | null): string {
    const known = CUSTOMER_TYPES.find((entry) => entry.value === type);
    return known ? t(known.labelKey) : (type ?? '');
  }
</script>

<!-- Customer -->
<Card.Root class="gap-0 py-0">
  <div class="border-b px-4 py-2.5 text-sm font-medium">
    {t('contracts.colCustomer')}
  </div>
  <div class="space-y-4 p-4">
    <!-- Existing-customer lookup -->
    <div class="relative">
      <UserSearchIcon
        class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        bind:value={customerQuery}
        placeholder={t('contracts.customerSearchPlaceholder')}
        aria-label={t('contracts.customerSearchLabel')}
        class="pl-8"
        onfocus={() => (customerOpen = true)}
        onblur={() => setTimeout(() => (customerOpen = false), 150)}
      />
      {#if customerOpen && customerQuery.trim().length >= 2}
        <div
          class="absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-md border bg-popover shadow-md"
        >
          {#if customerResults.loading && !customerResults.hasData}
            <p class="px-3 py-2 text-sm text-muted-foreground">{t('contracts.searching')}</p>
          {:else if (customerResults.data ?? []).length === 0}
            <p class="px-3 py-2 text-sm text-muted-foreground">
              {t('contracts.customerNoMatch')}
            </p>
          {:else}
            {#each customerResults.data ?? [] as match (match.email)}
              <button
                type="button"
                class={RESULT_ROW_CLASS}
                onmousedown={(event) => {
                  event.preventDefault();
                  pickCustomer(match);
                }}
              >
                <span class="min-w-0 flex-1">
                  <span class="block truncate font-medium">{match.fullName || '—'}</span>
                  <span class="block truncate text-xs text-muted-foreground">
                    {match.email}{match.phone ? ` · ${match.phone}` : ''}
                  </span>
                </span>
                <span class="shrink-0 text-xs text-muted-foreground capitalize">
                  {customerTypeLabel(match.customerType)}
                </span>
              </button>
            {/each}
          {/if}
        </div>
      {/if}
    </div>

    <!-- Type chips, same three identities the checkout offers -->
    <div>
      <Label class="mb-1.5">{t('contracts.customerType')}</Label>
      <div class="flex w-fit items-center gap-1 rounded-lg border bg-card p-1">
        {#each CUSTOMER_TYPES as type (type.value)}
          {@const active = form.customerType === type.value}
          <button
            type="button"
            onclick={() => (form.customerType = type.value)}
            aria-pressed={active}
            class={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted',
            )}
          >
            {t(type.labelKey)}
          </button>
        {/each}
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <Label class="mb-1.5" for="mc-name">{t('contracts.fieldFullName')}</Label>
        <Input id="mc-name" bind:value={form.fullName} placeholder="Mario Rossi" />
      </div>
      <div>
        <Label class="mb-1.5" for="mc-email">{t('contracts.fieldEmail')}</Label>
        <Input id="mc-email" type="email" bind:value={form.email} placeholder="mario@example.com" />
      </div>
      <div>
        <Label class="mb-1.5" for="mc-phone">{t('contracts.fieldPhone')}</Label>
        <Input id="mc-phone" bind:value={form.phone} placeholder="+39 …" />
      </div>
      <div>
        <Label class="mb-1.5" for="mc-address">{t('contracts.fieldAddress')}</Label>
        <Input id="mc-address" bind:value={form.address} placeholder="Via Roma 1, 00100 Roma" />
      </div>

      <!-- Fiscal identifiers — same conditions as the checkout -->
      {#if form.customerType === 'private'}
        <div>
          <Label class="mb-1.5" for="mc-cf">{t('contracts.fieldCodiceFiscaleRequired')}</Label>
          <Input id="mc-cf" bind:value={form.codiceFiscale} placeholder="RSSMRA80A01H501U" />
        </div>
      {:else if form.customerType === 'company'}
        <div>
          <Label class="mb-1.5" for="mc-piva">{t('contracts.fieldPartitaIva')}</Label>
          <Input id="mc-piva" bind:value={form.partitaIva} placeholder="12345678901" />
        </div>
        <div>
          <Label class="mb-1.5" for="mc-univoco">{t('contracts.fieldCodiceUnivoco')}</Label>
          <Input id="mc-univoco" bind:value={form.codiceUnivoco} placeholder="ABC1234" />
        </div>
        <div>
          <Label class="mb-1.5" for="mc-cf">{t('contracts.fieldCodiceFiscale')}</Label>
          <Input
            id="mc-cf"
            bind:value={form.codiceFiscale}
            placeholder={t('contracts.companyCodiceFiscalePlaceholder')}
          />
        </div>
      {:else}
        <p class="self-end pb-2 text-xs text-muted-foreground sm:col-span-2">
          {t('contracts.touristNote')}
        </p>
      {/if}
    </div>
  </div>
</Card.Root>
