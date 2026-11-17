<!--
  Email first. Typing searches the customer accounts; arrows and Enter pick a result,
  a click does too. An email with no match is fine — it only needs to be an email to
  start the order, and the account is created from it.
-->
<script lang="ts">
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { cn } from '$lib/utils.js';
  import { api } from '~/lib/api';
  import { Resource } from '~/lib/resource.svelte';
  import { t } from '~/lib/ui-text';
  import type { OrderForm } from './order-form.svelte';
  import type { AccountMatch, AccountMatches } from './types';

  let { form }: { form: OrderForm } = $props();

  let open = $state(false);
  let active = $state(0);

  const matches = new Resource(
    () => form.email.trim(),
    async (q, signal) => {
      if (q.length < 2) return [] as AccountMatches;
      const res = await api.api.admin.orders['customer-accounts'].$get(
        { query: { q } },
        { init: { signal } },
      );
      const json = (await res.json()) as { data: AccountMatches };
      active = 0;
      return json.data;
    },
    { enabled: () => open && !form.accountId, debounce: 250 },
  );

  const list = $derived(matches.data ?? []);
  const showList = $derived(open && form.email.trim().length >= 2);

  const fullName = (match: AccountMatch) => `${match.firstName} ${match.lastName}`.trim();
  const initials = (match: AccountMatch) =>
    (fullName(match) || match.email).slice(0, 1).toUpperCase();

  function pick(match: AccountMatch) {
    open = false;
    form.pickAccount(match);
    form.clear('email');
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      open = false;
      return;
    }
    if (!showList || list.length === 0) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const by = event.key === 'ArrowDown' ? 1 : -1;
      active = Math.min(list.length - 1, Math.max(0, active + by));
      return;
    }
    const match = list[active];
    if (event.key === 'Enter' && match) {
      event.preventDefault();
      pick(match);
    }
  }
</script>

<div class="relative">
  <Label class="mb-1.5" for="no-email">{t('newOrder.fieldEmail')}</Label>
  <Input
    id="no-email"
    autofocus
    type="email"
    role="combobox"
    aria-expanded={showList}
    aria-controls="no-email-results"
    autocomplete="off"
    class="h-11 text-base"
    bind:value={form.email}
    placeholder="mario@example.com"
    aria-invalid={form.fields.email ? 'true' : undefined}
    oninput={() => form.clear('email')}
    onkeydown={onKeydown}
    onfocus={() => (open = true)}
    onblur={() => setTimeout(() => (open = false), 150)}
  />
  {#if form.fields.email}
    <p class="mt-1 text-xs text-destructive" role="alert">{form.fields.email}</p>
  {/if}
  {#if showList}
    <ul
      id="no-email-results"
      role="listbox"
      class="absolute top-full right-0 left-0 z-20 mt-1 max-h-72 overflow-auto rounded-xl border bg-popover p-1 shadow-md"
    >
      {#if matches.loading}
        <li class="px-3 py-2 text-sm text-muted-foreground">{t('newOrder.searching')}</li>
      {:else if list.length === 0}
        <li class="px-3 py-2 text-sm text-muted-foreground">{t('newOrder.noAccount')}</li>
      {:else}
        {#each list as match, index (match.id)}
          <li role="option" aria-selected={index === active}>
            <button
              type="button"
              class={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted',
                index === active && 'bg-muted',
              )}
              onmousedown={(event) => {
                event.preventDefault();
                pick(match);
              }}
            >
              <span
                class="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
              >
                {initials(match)}
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate font-medium">{match.email}</span>
                <span class="block truncate text-xs text-muted-foreground">
                  {fullName(match) || '—'}{match.phone ? ` · ${match.phone}` : ''}
                </span>
              </span>
            </button>
          </li>
        {/each}
      {/if}
    </ul>
  {/if}
</div>
