<!--
  Email first: typing it searches the customer accounts, and picking one fills the
  rest. A typed email with no match is fine — only the email is needed to create the
  order; the customer (or the agent) completes the rest later.
-->
<script lang="ts">
  import { toast } from 'svelte-sonner';

  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { cn } from '$lib/utils.js';
  import { api } from '~/lib/api';
  import { Resource } from '~/lib/resource.svelte';
  import { t } from '~/lib/ui-text';
  import type { OrderForm } from './order-form.svelte';
  import {
    CUSTOMER_TYPES,
    RESULT_ROW_CLASS,
    type AccountMatch,
    type AccountMatches,
  } from './types';

  let { form }: { form: OrderForm } = $props();

  let open = $state(false);

  const matches = new Resource(
    () => form.email.trim(),
    async (q, signal) => {
      if (q.length < 2) return [] as AccountMatches;
      const res = await api.api.admin.orders['customer-accounts'].$get(
        { query: { q } },
        { init: { signal } },
      );
      const json = (await res.json()) as { data: AccountMatches };
      return json.data;
    },
    { enabled: () => open && !form.accountId, debounce: 250 },
  );

  function pick(match: AccountMatch) {
    open = false;
    form.pickAccount(match);
    toast.success(t('newOrder.toastAccountFilled', { email: match.email }));
  }

  const fullName = (match: AccountMatch) => `${match.firstName} ${match.lastName}`.trim();
</script>

{#snippet error(key: string)}
  {#if form.fields[key]}
    <p class="mt-1 text-xs text-destructive" role="alert">{form.fields[key]}</p>
  {/if}
{/snippet}

<Card.Root class="gap-0 py-0">
  <div class="border-b px-4 py-2.5 text-sm font-medium">{t('newOrder.customerTitle')}</div>
  <div class="space-y-4 p-4">
    <div class="relative">
      <Label class="mb-1.5" for="no-email">{t('newOrder.fieldEmail')}</Label>
      <Input
        id="no-email"
        type="email"
        autocomplete="off"
        bind:value={form.email}
        placeholder="mario@example.com"
        aria-invalid={form.fields.email ? 'true' : undefined}
        oninput={() => form.onEmailInput()}
        onfocus={() => (open = true)}
        onblur={() => setTimeout(() => (open = false), 150)}
      />
      {@render error('email')}
      {#if form.accountId}
        <p class="mt-1 text-xs text-muted-foreground">{t('newOrder.existingAccount')}</p>
      {/if}
      {#if open && !form.accountId && form.email.trim().length >= 2}
        <div
          class="absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-md border bg-popover shadow-md"
        >
          {#if matches.loading && !matches.hasData}
            <p class="px-3 py-2 text-sm text-muted-foreground">{t('newOrder.searching')}</p>
          {:else if (matches.data ?? []).length === 0}
            <p class="px-3 py-2 text-sm text-muted-foreground">{t('newOrder.noAccount')}</p>
          {:else}
            {#each matches.data ?? [] as match (match.id)}
              <button
                type="button"
                class={RESULT_ROW_CLASS}
                onmousedown={(event) => {
                  event.preventDefault();
                  pick(match);
                }}
              >
                <span class="min-w-0 flex-1">
                  <span class="block truncate font-medium">{match.email}</span>
                  <span class="block truncate text-xs text-muted-foreground">
                    {fullName(match) || '—'}{match.phone ? ` · ${match.phone}` : ''}
                  </span>
                </span>
              </button>
            {/each}
          {/if}
        </div>
      {/if}
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <Label class="mb-1.5" for="no-first-name">{t('newOrder.fieldFirstName')}</Label>
        <Input id="no-first-name" bind:value={form.firstName} />
      </div>
      <div>
        <Label class="mb-1.5" for="no-last-name">{t('newOrder.fieldLastName')}</Label>
        <Input id="no-last-name" bind:value={form.lastName} />
      </div>
      <div>
        <Label class="mb-1.5" for="no-phone">{t('newOrder.fieldPhone')}</Label>
        <Input id="no-phone" bind:value={form.phone} placeholder="+39 …" />
        {@render error('phone')}
      </div>
      <div>
        <Label class="mb-1.5">{t('newOrder.fieldCustomerType')}</Label>
        <div class="flex w-fit items-center gap-1 rounded-lg border bg-card p-1">
          {#each CUSTOMER_TYPES as type (type.value)}
            {@const active = form.customerType === type.value}
            <button
              type="button"
              onclick={() => (form.customerType = active ? '' : type.value)}
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
      {#if form.customerType === 'private' || form.customerType === 'company'}
        <div>
          <Label class="mb-1.5" for="no-codice-fiscale">{t('newOrder.fieldCodiceFiscale')}</Label>
          <Input id="no-codice-fiscale" bind:value={form.codiceFiscale} />
        </div>
      {/if}
      {#if form.customerType === 'company'}
        <div>
          <Label class="mb-1.5" for="no-partita-iva">{t('newOrder.fieldPartitaIva')}</Label>
          <Input id="no-partita-iva" bind:value={form.partitaIva} />
        </div>
      {/if}
    </div>
  </div>
</Card.Root>
