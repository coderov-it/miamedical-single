<!--
  Manual contract. For rentals that never went through the storefront — walk-ins,
  phone bookings, or a returning customer who needs a fresh contract.

  Three lookups feed the form so nothing has to be retyped: an earlier contract
  (copies customer + items, deliberately not dates), a past customer from the
  order history, and the product catalogue per line item. All three are plain
  text searches by name, email, phone or title.

  Fiscal rules mirror the checkout: tourists carry no Italian fiscal identifier,
  a private customer needs a codice fiscale, a company needs partita IVA and the
  codice univoco (SDI) its invoice is routed to.

  The signing link is emailed to the customer as soon as the contract is created,
  the same flow an order-generated contract follows.
-->
<script lang="ts">
  import { P } from '@mia/permissions';
  import { resolvePeriod } from '@mia/pricing';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import SearchIcon from '@lucide/svelte/icons/search';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import UserSearchIcon from '@lucide/svelte/icons/user-search';
  import type { InferResponseType } from 'hono/client';
  import { toast } from 'svelte-sonner';

  import { goto } from '$app/navigation';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { cn } from '$lib/utils.js';
  import { api } from '~/lib/api';
  import MoneyInput from '~/lib/components/money-input.svelte';
  import PageHeader from '~/lib/components/page-header.svelte';
  import { variantLabel } from '~/lib/contracts/status';
  import { formatMoney } from '~/lib/format';
  import { errorMessage, unwrap } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';

  type ContractList = InferResponseType<typeof api.api.admin.contracts.$get, 200>['data'];
  type ContractDetail = InferResponseType<
    (typeof api.api.admin.contracts)[':id']['$get'],
    200
  >['data'];
  type CustomerMatches = InferResponseType<typeof api.api.admin.orders.customers.$get, 200>['data'];
  type ProductList = InferResponseType<typeof api.api.admin.products.$get, 200>['data'];

  type CustomerType = 'private' | 'company' | 'tourist';

  interface ContractDataShape {
    customer: {
      fullName: string;
      email: string;
      phone: string;
      address: string;
      codiceFiscale: string | null;
      partitaIva: string | null;
      codiceUnivoco?: string | null;
      customerType: CustomerType;
    };
    items: {
      productTitle: string;
      sku: string;
      quantity: number;
      unitPrice: string;
      total: string;
      duration: number;
      durationUnit: 'hour' | 'day';
    }[];
    shippingTotal: string;
    requiresDeposit: boolean;
  }

  // --- form state ------------------------------------------------------------

  let customerType = $state<CustomerType>('private');
  let fullName = $state('');
  let email = $state('');
  let phone = $state('');
  let address = $state('');
  let codiceFiscale = $state('');
  let partitaIva = $state('');
  let codiceUnivoco = $state('');
  let hasDepositProduct = $state(false);

  /**
   * A hand-typed contract line. Deliberately NOT catalogue pricing: this is a
   * walk-in whose price was agreed on the phone, so the operator types every
   * figure and nothing here consults a package. It shares the storefront's
   * vocabulary — a duration in a unit, and an end date derived from the start —
   * so both kinds of contract read alike once printed.
   */
  interface ItemDraft {
    productTitle: string;
    sku: string;
    quantity: number;
    duration: number;
    durationUnit: 'hour' | 'day';
    unitPrice: string;
    total: string;
    startDate: string;
    startTime: string;
  }

  function blankItem(): ItemDraft {
    return {
      productTitle: '',
      sku: '',
      quantity: 1,
      duration: 1,
      durationUnit: 'day',
      unitPrice: '0.00',
      total: '0.00',
      startDate: '',
      startTime: '',
    };
  }

  /** The end this line's start and duration place, or `null` while incomplete. */
  const endOf = (item: ItemDraft) =>
    item.startDate
      ? resolvePeriod(item.startDate, item.startTime || null, {
          unit: item.durationUnit,
          duration: item.duration,
        })
      : null;

  let items = $state<ItemDraft[]>([blankItem()]);
  let shippingTotal = $state('0.00');
  let busy = $state(false);

  const CUSTOMER_TYPES: { value: CustomerType; label: string }[] = [
    { value: 'private', label: 'Private' },
    { value: 'company', label: 'Company' },
    { value: 'tourist', label: 'Tourist' },
  ];

  // --- source contract search ------------------------------------------------

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

  /**
   * Prefill from an earlier contract: customer and items carry over, the rental
   * dates deliberately do not — a copied contract is a new rental period, and
   * stale dates on a legal document are worse than empty ones.
   */
  async function copyFromContract(id: string, number: string) {
    sourceOpen = false;
    sourceQuery = number;
    copying = true;
    try {
      const source = await unwrap<ContractDetail>(
        await api.api.admin.contracts[':id'].$get({ param: { id } }),
      );
      const data = source.contractData as unknown as ContractDataShape;

      customerType = data.customer.customerType;
      fullName = data.customer.fullName;
      email = data.customer.email;
      phone = data.customer.phone;
      address = data.customer.address;
      codiceFiscale = data.customer.codiceFiscale ?? '';
      partitaIva = data.customer.partitaIva ?? '';
      codiceUnivoco = data.customer.codiceUnivoco ?? '';
      hasDepositProduct = data.requiresDeposit;
      shippingTotal = data.shippingTotal || '0.00';
      items = data.items.map((item) => ({
        productTitle: item.productTitle,
        sku: item.sku ?? '',
        quantity: item.quantity,
        duration: item.duration,
        durationUnit: item.durationUnit,
        unitPrice: item.unitPrice,
        total: item.total,
        startDate: '',
        startTime: '',
      }));
      toast.success(`Copied from ${source.number}. Set the new rental dates.`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      copying = false;
    }
  }

  // --- customer search ---------------------------------------------------------

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
    // Orders that predate the customer-type column carry null — default to private.
    customerType = (match.customerType ?? 'private') as CustomerType;
    fullName = match.fullName;
    email = match.email;
    phone = match.phone ?? '';
    address = match.address;
    codiceFiscale = match.codiceFiscale ?? '';
    partitaIva = match.partitaIva ?? '';
    toast.success(`Customer ${match.fullName || match.email} filled in.`);
  }

  // --- product search ----------------------------------------------------------

  /** Which item row's product field is currently searching; one popover at a time. */
  let productSearchIndex = $state<number | null>(null);
  let productQuery = $state('');

  const productResults = new Resource(
    () => productQuery.trim(),
    async (q, signal) => {
      if (q.length < 2) return [] as ProductList;
      const res = await api.api.admin.products.$get(
        { query: { page: '1', perPage: '8', q, status: 'active' } },
        { init: { signal } },
      );
      const json = (await res.json()) as { data: ProductList };
      return json.data;
    },
    { enabled: () => session.can(P.PRODUCT_READ) && productSearchIndex !== null, debounce: 250 },
  );

  function onProductInput(index: number, value: string) {
    productSearchIndex = index;
    productQuery = value;
  }

  function pickProduct(index: number, product: ProductList[number]) {
    const item = items[index];
    if (!item) return;
    item.productTitle = product.title;
    item.sku = product.baseSku;
    /* A starting point for the operator to edit, not a price: a rental has no
       rate of its own, so its marketing headline stands in. */
    item.unitPrice = product.basePrice ?? product.marketingRate ?? '0.00';
    recomputeLineTotal(index);
    productSearchIndex = null;
    productQuery = '';
  }

  // --- money -------------------------------------------------------------------

  function toCents(amount: string): number {
    const [whole = '0', frac = ''] = amount.split('.');
    const cents = Number(whole) * 100 + Number(frac.padEnd(2, '0').slice(0, 2));
    return Number.isFinite(cents) ? cents : 0;
  }

  function fromCents(cents: number): string {
    return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
  }

  const subtotal = $derived(fromCents(items.reduce((sum, item) => sum + toCents(item.total), 0)));
  const total = $derived(fromCents(toCents(subtotal) + toCents(shippingTotal)));

  /** Suggest the line total from price × quantity × days; still editable after. */
  function recomputeLineTotal(index: number) {
    const item = items[index];
    if (!item) return;
    item.total = fromCents(toCents(item.unitPrice) * item.quantity * item.duration);
  }

  function addItem() {
    items = [...items, blankItem()];
  }

  function removeItem(index: number) {
    items = items.filter((_, i) => i !== index);
    if (productSearchIndex === index) productSearchIndex = null;
  }

  // Mirrors the server's variant matrix so the admin sees which of the four
  // contracts will be issued before submitting. The server resolves it again.
  const previewVariant = $derived.by(() => {
    const isTourist = customerType === 'tourist';
    if (hasDepositProduct) return isTourist ? 'scooter_tourist' : 'scooter_italian';
    return isTourist ? 'carrozzina_tourist' : 'carrozzina_italian';
  });

  // Same conditional rules ManualContractSchema enforces server-side.
  const fiscalValid = $derived.by(() => {
    if (customerType === 'private') return codiceFiscale.trim().length > 0;
    if (customerType === 'company') {
      return partitaIva.trim().length > 0 && codiceUnivoco.trim().length > 0;
    }
    return true;
  });

  const formValid = $derived(
    fullName.trim().length > 0 &&
      email.trim().length > 0 &&
      phone.trim().length > 0 &&
      address.trim().length > 0 &&
      fiscalValid &&
      items.length > 0 &&
      items.every((item) => item.productTitle.trim().length > 0 && item.startDate.length > 0),
  );

  async function create() {
    if (!formValid) return;
    busy = true;
    try {
      const res = await api.api.admin.contracts.manual.$post({
        json: {
          customerType,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          codiceFiscale: codiceFiscale.trim() ? codiceFiscale.trim() : null,
          partitaIva: partitaIva.trim() ? partitaIva.trim() : null,
          codiceUnivoco: codiceUnivoco.trim() ? codiceUnivoco.trim() : null,
          hasDepositProduct,
          items: items.map((item) => ({
            productTitle: item.productTitle.trim(),
            ...(item.sku ? { sku: item.sku } : {}),
            quantity: item.quantity,
            duration: item.duration,
            durationUnit: item.durationUnit,
            unitPrice: item.unitPrice,
            total: item.total,
            startDate: item.startDate,
            endDate: endOf(item)?.endDate ?? null,
          })),
          shippingTotal,
        },
      });
      const created = await unwrap<ContractDetail>(res);
      toast.success(`Contract ${created.number} created — signing link sent to ${email.trim()}.`);
      void goto(routes.contractDetail(created.id));
    } catch (err) {
      toast.error(errorMessage(err));
      busy = false;
    }
  }

  const resultRowClass =
    'flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted';
</script>

<section class="admin-page">
  <PageHeader
    eyebrow="Contracts"
    title="New Contract"
    description="Issue a contract by hand — for walk-in and phone rentals, or a fresh contract for a returning customer."
  >
    {#snippet actions()}
      <Button href={routes.contracts} variant="outline">
        <ArrowLeftIcon />
        Back to contracts
      </Button>
    {/snippet}
  </PageHeader>

  <div class="@container grid gap-5 @4xl:grid-cols-3">
    <div class="space-y-5 @4xl:col-span-2">
      <!-- Copy from an earlier contract -->
      <Card.Root class="gap-0 py-0">
        <div class="border-b px-4 py-2.5">
          <p class="text-sm font-medium">Start from an earlier contract</p>
          <p class="text-xs text-muted-foreground">
            Search by contract number, customer name, email or phone. Copies the customer and items
            — you set the new rental dates.
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
              aria-label="Search earlier contracts"
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
                  <p class="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
                {:else if (sourceResults.data ?? []).length === 0}
                  <p class="px-3 py-2 text-sm text-muted-foreground">
                    {sourceQuery.trim() ? 'No contracts match.' : 'No contracts yet.'}
                  </p>
                {:else}
                  {#if !sourceQuery.trim()}
                    <p class="border-b px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      Recent contracts
                    </p>
                  {/if}
                  {#each sourceResults.data ?? [] as option (option.id)}
                    <button
                      type="button"
                      class={resultRowClass}
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

      <!-- Customer -->
      <Card.Root class="gap-0 py-0">
        <div class="border-b px-4 py-2.5 text-sm font-medium">Customer</div>
        <div class="space-y-4 p-4">
          <!-- Existing-customer lookup -->
          <div class="relative">
            <UserSearchIcon
              class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              bind:value={customerQuery}
              placeholder="Search existing customers by name, email or phone…"
              aria-label="Search existing customers"
              class="pl-8"
              onfocus={() => (customerOpen = true)}
              onblur={() => setTimeout(() => (customerOpen = false), 150)}
            />
            {#if customerOpen && customerQuery.trim().length >= 2}
              <div
                class="absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-md border bg-popover shadow-md"
              >
                {#if customerResults.loading && !customerResults.hasData}
                  <p class="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
                {:else if (customerResults.data ?? []).length === 0}
                  <p class="px-3 py-2 text-sm text-muted-foreground">
                    No past customers match. Fill the form in below.
                  </p>
                {:else}
                  {#each customerResults.data ?? [] as match (match.email)}
                    <button
                      type="button"
                      class={resultRowClass}
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
                        {match.customerType}
                      </span>
                    </button>
                  {/each}
                {/if}
              </div>
            {/if}
          </div>

          <!-- Type chips, same three identities the checkout offers -->
          <div>
            <Label class="mb-1.5">Customer type</Label>
            <div class="flex w-fit items-center gap-1 rounded-lg border bg-card p-1">
              {#each CUSTOMER_TYPES as type (type.value)}
                {@const active = customerType === type.value}
                <button
                  type="button"
                  onclick={() => (customerType = type.value)}
                  aria-pressed={active}
                  class={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  {type.label}
                </button>
              {/each}
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <Label class="mb-1.5" for="mc-name">Full name *</Label>
              <Input id="mc-name" bind:value={fullName} placeholder="Mario Rossi" />
            </div>
            <div>
              <Label class="mb-1.5" for="mc-email">Email *</Label>
              <Input
                id="mc-email"
                type="email"
                bind:value={email}
                placeholder="mario@example.com"
              />
            </div>
            <div>
              <Label class="mb-1.5" for="mc-phone">Phone *</Label>
              <Input id="mc-phone" bind:value={phone} placeholder="+39 …" />
            </div>
            <div>
              <Label class="mb-1.5" for="mc-address">Address *</Label>
              <Input id="mc-address" bind:value={address} placeholder="Via Roma 1, 00100 Roma" />
            </div>

            <!-- Fiscal identifiers — same conditions as the checkout -->
            {#if customerType === 'private'}
              <div>
                <Label class="mb-1.5" for="mc-cf">Codice fiscale *</Label>
                <Input id="mc-cf" bind:value={codiceFiscale} placeholder="RSSMRA80A01H501U" />
              </div>
            {:else if customerType === 'company'}
              <div>
                <Label class="mb-1.5" for="mc-piva">Partita IVA *</Label>
                <Input id="mc-piva" bind:value={partitaIva} placeholder="12345678901" />
              </div>
              <div>
                <Label class="mb-1.5" for="mc-univoco">Codice univoco *</Label>
                <Input id="mc-univoco" bind:value={codiceUnivoco} placeholder="ABC1234" />
              </div>
              <div>
                <Label class="mb-1.5" for="mc-cf">Codice fiscale</Label>
                <Input
                  id="mc-cf"
                  bind:value={codiceFiscale}
                  placeholder="Company codice fiscale (optional)"
                />
              </div>
            {:else}
              <p class="self-end pb-2 text-xs text-muted-foreground sm:col-span-2">
                Tourists carry no Italian fiscal identifier — none is required.
              </p>
            {/if}
          </div>
        </div>
      </Card.Root>

      <!-- Items -->
      <Card.Root class="gap-0 py-0">
        <div class="flex items-center justify-between border-b px-4 py-2.5">
          <span class="text-sm font-medium">Rental items</span>
          <Button variant="ghost" size="sm" onclick={addItem}>
            <PlusIcon class="size-4" />
            Add item
          </Button>
        </div>
        <div class="space-y-4 p-4">
          {#each items as item, index (index)}
            <div class="space-y-3 rounded-lg border p-3">
              <div class="flex items-end gap-3">
                <div class="relative flex-1">
                  <Label class="mb-1.5" for={`item-title-${index}`}>Product *</Label>
                  <Input
                    id={`item-title-${index}`}
                    bind:value={item.productTitle}
                    placeholder="Type to search the catalogue, or enter freely…"
                    autocomplete="off"
                    oninput={(event) => onProductInput(index, event.currentTarget.value)}
                    onfocus={() => onProductInput(index, item.productTitle)}
                    onblur={() =>
                      setTimeout(() => {
                        if (productSearchIndex === index) productSearchIndex = null;
                      }, 150)}
                  />
                  {#if productSearchIndex === index && productQuery.trim().length >= 2}
                    <div
                      class="absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-md border bg-popover shadow-md"
                    >
                      {#if productResults.loading && !productResults.hasData}
                        <p class="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
                      {:else if (productResults.data ?? []).length === 0}
                        <p class="px-3 py-2 text-sm text-muted-foreground">
                          No products match — the typed text is used as is.
                        </p>
                      {:else}
                        {#each productResults.data ?? [] as product (product.id)}
                          <button
                            type="button"
                            class={resultRowClass}
                            onmousedown={(event) => {
                              event.preventDefault();
                              pickProduct(index, product);
                            }}
                          >
                            <span class="min-w-0 flex-1 truncate">{product.title}</span>
                            <span class="shrink-0 text-xs text-muted-foreground">
                              {formatMoney(product.basePrice, product.currency)}
                            </span>
                          </button>
                        {/each}
                      {/if}
                    </div>
                  {/if}
                </div>
                {#if items.length > 1}
                  <Button
                    variant="ghost"
                    size="icon"
                    class="text-destructive"
                    aria-label="Remove item"
                    onclick={() => removeItem(index)}
                  >
                    <Trash2Icon class="size-4" />
                  </Button>
                {/if}
              </div>
              <div class="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label class="mb-1.5" for={`item-qty-${index}`}>Quantity</Label>
                  <Input
                    id={`item-qty-${index}`}
                    type="number"
                    min="1"
                    bind:value={item.quantity}
                    onchange={() => recomputeLineTotal(index)}
                  />
                </div>
                <div>
                  <Label class="mb-1.5" for={`item-duration-${index}`}>Duration</Label>
                  <div class="flex gap-2">
                    <Input
                      id={`item-duration-${index}`}
                      type="number"
                      min="1"
                      bind:value={item.duration}
                      onchange={() => recomputeLineTotal(index)}
                    />
                    <Select.Root type="single" bind:value={item.durationUnit}>
                      <Select.Trigger class="w-28">
                        {item.durationUnit === 'hour' ? 'hours' : 'days'}
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="day">days</Select.Item>
                        <Select.Item value="hour">hours</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </div>
                </div>
                <div onfocusout={() => recomputeLineTotal(index)}>
                  <MoneyInput
                    label="Unit price / {item.durationUnit}"
                    bind:value={item.unitPrice}
                    suffix="EUR"
                  />
                </div>
                <div>
                  <Label class="mb-1.5" for={`item-start-${index}`}>Start date *</Label>
                  <Input id={`item-start-${index}`} type="date" bind:value={item.startDate} />
                </div>
                {#if item.durationUnit === 'hour'}
                  <div>
                    <Label class="mb-1.5" for={`item-time-${index}`}>Start time *</Label>
                    <Input id={`item-time-${index}`} type="time" bind:value={item.startTime} />
                  </div>
                {/if}
                <div>
                  <!-- Derived, as on the storefront: the duration decides the end. -->
                  <Label class="mb-1.5">End</Label>
                  <p
                    class="flex h-9 items-center rounded-md border border-dashed px-3 text-sm tabular-nums"
                  >
                    {endOf(item)?.endDate ?? '—'}
                    {endOf(item)?.endTime ?? ''}
                  </p>
                </div>
                <MoneyInput label="Line total" bind:value={item.total} suffix="EUR" />
              </div>
            </div>
          {/each}
        </div>
      </Card.Root>
    </div>

    <div class="space-y-5">
      <!-- Contract type -->
      <Card.Root class="gap-0 py-0">
        <div class="border-b px-4 py-2.5 text-sm font-medium">Contract type</div>
        <div class="space-y-3 p-4">
          <label class="flex items-start gap-2.5">
            <Checkbox bind:checked={hasDepositProduct} class="mt-0.5" />
            <span class="text-sm">
              Scooter, electric wheelchair or similar
              <span class="block text-xs text-muted-foreground">
                Requires a 300 EUR deposit. Leave off for manual wheelchairs, walkers and other
                aids.
              </span>
            </span>
          </label>
          <div class="rounded-md bg-muted px-3 py-2 text-sm">
            Will issue: <span class="font-medium">{variantLabel(previewVariant)}</span>
            <span class="block text-xs text-muted-foreground">
              {customerType === 'tourist' ? 'English contract' : 'Italian contract'}
              {hasDepositProduct ? ' · 300 EUR deposit clause' : ' · no deposit'}
            </span>
          </div>
        </div>
      </Card.Root>

      <!-- Totals -->
      <Card.Root class="gap-0 py-0">
        <div class="border-b px-4 py-2.5 text-sm font-medium">Totals</div>
        <div class="space-y-3 p-4">
          <MoneyInput label="Delivery" bind:value={shippingTotal} suffix="EUR" />
          <div class="space-y-1.5 border-t pt-3 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Subtotal</span>
              <span class="tabular-nums">{subtotal} EUR</span>
            </div>
            <div class="flex justify-between font-medium">
              <span>Total</span>
              <span class="tabular-nums">{total} EUR</span>
            </div>
          </div>
        </div>
      </Card.Root>

      <!-- Create -->
      <Card.Root class="gap-0 py-0">
        <div class="space-y-3 p-4">
          <Button class="w-full" disabled={!formValid || busy} onclick={create}>
            {#if busy}<Spinner />{/if}
            Create contract & send signing link
          </Button>
          <p class="text-xs text-muted-foreground">
            The customer receives the signing link by email immediately, in the contract's language.
          </p>
        </div>
      </Card.Root>
    </div>
  </div>
</section>
