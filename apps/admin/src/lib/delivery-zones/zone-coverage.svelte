<!--
  The coverage check: pick a real Italian address, see what it would be charged and
  WHY.

  It exists because a price tree is easy to believe and hard to verify. The tree on
  the left says what each row costs; this says what an ADDRESS costs, which is a
  different question — a CAP can be shared by 17 comuni, and the answer then comes
  from whichever row they all agree on.

  THE ANSWER IS THE SERVER'S. `POST /api/delivery/quote` is the same call the
  checkout makes, so what an operator sees here is what a customer will be charged,
  not a second implementation that happens to agree. The ladder underneath is
  display only: it lists which rows exist along the path and what each one carries,
  so the answer can be read rather than trusted.

  THE PICKER IS ITALY'S OWN HIERARCHY — regione → provincia → comune → CAP, from
  the committed ISTAT data. Picking the comune settles the CAP for 7,338 of 7,896
  comuni; the 30 with more than five are the cities, where the CAP is the choice
  that matters.
-->
<script lang="ts">
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';

  import * as Card from '$lib/components/ui/card/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { cn } from '$lib/utils.js';
  import { api } from '~/lib/api';
  import { formatMoney } from '~/lib/format';
  import { unwrapFull } from '~/lib/request';
  import type { ZoneNode } from './tree.ts';

  interface Props {
    /** The tree as rendered, for the ladder. Never used to compute the answer. */
    tree: ZoneNode[];
  }

  let { tree }: Props = $props();

  interface Region {
    code: string;
    name: string;
  }
  interface Province {
    code: string;
    name: string;
  }
  interface Comune {
    istatCode: string;
    name: string;
    provinceCode: string;
    caps: string[];
  }
  interface Quote {
    kind: 'fee' | 'call';
    fee: string | null;
    areaLabel: string;
    resolvedVia: string;
    comune: { istatCode: string; name: string; provinceCode: string } | null;
  }

  let regions = $state<Region[]>([]);
  let provinces = $state<Province[]>([]);
  let comuni = $state<Comune[]>([]);

  let regionCode = $state('');
  let provinceCode = $state('');
  let istatCode = $state('');
  let cap = $state('');

  let quote = $state<Quote | null>(null);
  let error = $state('');
  let busy = $state(false);

  const comune = $derived(comuni.find((row) => row.istatCode === istatCode) ?? null);

  /* Regions never change while the page is open — one load, no resource wrapper. */
  $effect(() => {
    void (async () => {
      try {
        const payload = await unwrapFull<{ data: Region[] }>(
          await api.api.address.regions.$get(),
        );
        regions = payload.data;
      } catch {
        error = 'Could not load the region list.';
      }
    })();
  });

  async function pickRegion(code: string) {
    regionCode = code;
    provinceCode = '';
    istatCode = '';
    cap = '';
    provinces = [];
    comuni = [];
    quote = null;
    if (!code) return;
    const payload = await unwrapFull<{ data: Province[] }>(
      await api.api.address.provinces.$get({ query: { regionCode: code } }),
    );
    provinces = payload.data;
  }

  async function pickProvince(code: string) {
    provinceCode = code;
    istatCode = '';
    cap = '';
    comuni = [];
    quote = null;
    if (!code) return;
    const payload = await unwrapFull<{ data: Comune[] }>(
      await api.api.address.comuni.$get({ query: { provinceCode: code } }),
    );
    comuni = payload.data;
  }

  /**
   * Picking the comune settles the CAP when there is only one, which is 93% of
   * Italy. Anything else waits for the operator to choose.
   */
  function pickComune(code: string) {
    istatCode = code;
    quote = null;
    const only = comuni.find((row) => row.istatCode === code)?.caps ?? [];
    cap = only.length === 1 ? (only[0] ?? '') : '';
    if (cap) void ask();
  }

  function pickCap(value: string) {
    cap = value;
    if (value) void ask();
  }

  /** The one authority. Same endpoint, same body, as the storefront's checkout. */
  async function ask() {
    if (!cap) return;
    busy = true;
    error = '';
    try {
      const payload = await unwrapFull<{ data: Quote }>(
        await api.api.delivery.quote.$post({
          json: { cap, comuneName: comune?.name ?? null },
        }),
      );
      quote = payload.data;
    } catch {
      error = 'The quote could not be resolved.';
      quote = null;
    } finally {
      busy = false;
    }
  }

  /**
   * The rows that exist along this address's path, narrowest first.
   *
   * Found by matching each tier's code against the tree — NOT by re-running the
   * resolver. A missing tier is shown as missing, which is the useful part: it is
   * how an operator sees that the answer came from three levels up.
   */
  interface Rung {
    level: string;
    label: string;
    node: ZoneNode | null;
  }

  const ladder = $derived.by<Rung[]>(() => {
    const country = tree[0] ?? null;
    const region = country
      ? (country.children.find((child) => child.code === regionCode) ?? null)
      : null;
    const province = region
      ? (region.children.find((child) => child.code === provinceCode) ?? null)
      : null;
    const comuneNode = province
      ? (province.children.find((child) => child.code === istatCode) ?? null)
      : null;
    const capNode = comuneNode
      ? (comuneNode.children.find((child) => child.code === cap) ?? null)
      : null;

    return [
      { level: 'cap', label: comune ? `${comune.name} + ${cap || '—'}` : '—', node: capNode },
      { level: 'comune', label: comune ? `${comune.name} ${istatCode}` : '—', node: comuneNode },
      {
        level: 'province',
        label: provinceLabel(provinceCode),
        node: province,
      },
      { level: 'region', label: regionLabel(regionCode), node: region },
      { level: 'country', label: country ? `${country.name} ${country.code}` : '—', node: country },
    ];
  });

  function regionLabel(code: string): string {
    const row = regions.find((region) => region.code === code);
    return row ? `${row.name} ${row.code}` : '—';
  }

  function provinceLabel(code: string): string {
    const row = provinces.find((province) => province.code === code);
    return row ? `${row.name} ${row.code}` : '—';
  }

  /** What a row carries in its own right — never what it inherits. */
  function ownValue(node: ZoneNode | null): string {
    if (!node) return 'no row';
    if (node.valueKind === null) return 'inherits';
    return node.valueKind === 'call' ? 'needs call' : formatMoney(node.fee);
  }

  /* Which rung the server says answered. Compared on the level rather than the id,
     because a widened answer names a row this ladder may not contain — a shared CAP
     resolves through comuni the operator never picked. */
  const answeredLevel = $derived(quote?.resolvedVia ?? '');

  const capOptions = $derived(comune?.caps ?? []);

  /*
    NOT shown here: a warning that the CAP is shared with comuni priced differently.
    The picker takes its comune name from the same table the resolver matches
    against, so the name always pins and the answer never widens — the widening
    case only reaches `resolveQuote` from a typed address. Showing a banner that
    cannot fire would be worse than the ladder, which already says "no row" at each
    tier the answer skipped.
  */
</script>

<Card.Root class="gap-0 py-0">
  <div class="flex items-center gap-2 border-b px-4 py-2.5">
    <p class="text-sm font-medium">Check an address</p>
    <p class="text-xs text-muted-foreground">
      Italy's own hierarchy — the answer comes from the checkout's endpoint
    </p>
  </div>

  <div class="space-y-3.5 px-4 py-3.5">
    <div class="grid gap-3 sm:grid-cols-2">
      <div>
        <Label class="mb-1.5">Regione</Label>
        <Select.Root type="single" value={regionCode} onValueChange={(v) => void pickRegion(v)}>
          <Select.Trigger class="h-8 text-sm">
            {regions.find((r) => r.code === regionCode)?.name ?? 'Choose a region'}
          </Select.Trigger>
          <Select.Content>
            {#each regions as region (region.code)}
              <Select.Item value={region.code}>{region.name}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div>
        <Label class="mb-1.5">Provincia</Label>
        <Select.Root
          type="single"
          value={provinceCode}
          onValueChange={(v) => void pickProvince(v)}
          disabled={provinces.length === 0}
        >
          <Select.Trigger class="h-8 text-sm">
            {provinces.find((p) => p.code === provinceCode)?.name ?? 'Choose a province'}
          </Select.Trigger>
          <Select.Content>
            {#each provinces as province (province.code)}
              <Select.Item value={province.code}>{province.name} · {province.code}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div>
        <Label class="mb-1.5">Comune</Label>
        <Select.Root
          type="single"
          value={istatCode}
          onValueChange={pickComune}
          disabled={comuni.length === 0}
        >
          <Select.Trigger class="h-8 text-sm">
            {comune?.name ?? `Choose a comune${comuni.length ? ` (${comuni.length})` : ''}`}
          </Select.Trigger>
          <Select.Content class="max-h-72">
            {#each comuni as row (row.istatCode)}
              <Select.Item value={row.istatCode}>
                {row.name}
                <span class="ml-auto font-mono text-xs text-muted-foreground">{row.istatCode}</span>
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div>
        <Label class="mb-1.5">
          CAP
          {#if capOptions.length > 1}
            <span class="font-normal text-muted-foreground">— {capOptions.length} in this comune</span>
          {/if}
        </Label>
        <Select.Root
          type="single"
          value={cap}
          onValueChange={pickCap}
          disabled={capOptions.length === 0}
        >
          <Select.Trigger class="h-8 font-mono text-sm">
            {cap || (capOptions.length ? 'Choose a CAP' : '—')}
          </Select.Trigger>
          <Select.Content class="max-h-72">
            {#each capOptions as option (option)}
              <Select.Item value={option}>{option}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
    </div>

    {#if error}
      <p class="flex items-center gap-2 text-xs font-medium text-destructive">
        <CircleAlertIcon class="size-3.5 shrink-0" />
        {error}
      </p>
    {/if}

    {#if quote}
      <!-- The answer, and then the reason for it. -->
      <div class="rounded-md border">
        <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b px-3 py-2.5">
          {#if quote.kind === 'fee'}
            <span class="text-lg font-semibold tabular-nums">{formatMoney(quote.fee)}</span>
          {:else}
            <span class="text-lg font-semibold text-amber-600 dark:text-amber-400">Needs call</span>
          {/if}
          <span class="text-sm text-muted-foreground">from</span>
          <span class="text-sm font-medium">{quote.areaLabel}</span>
          <span class="ml-auto text-xs text-muted-foreground">
            matched at <span class="font-medium text-foreground">{quote.resolvedVia}</span>
            {#if quote.comune}
              · comune pinned: {quote.comune.name}
            {:else}
              · no comune pinned
            {/if}
          </span>
        </div>

        <table class="w-full text-xs">
          <tbody>
            {#each ladder as rung (rung.level)}
              {@const answered = rung.level === answeredLevel && rung.node !== null}
              <tr class={cn('border-b last:border-0', answered && 'bg-primary/5')}>
                <td class="w-20 px-3 py-1.5 font-medium text-muted-foreground">{rung.level}</td>
                <td class="px-3 py-1.5">{rung.label}</td>
                <td
                  class={cn(
                    'px-3 py-1.5 text-right tabular-nums',
                    rung.node?.valueKind === null && 'text-muted-foreground',
                    !rung.node && 'text-muted-foreground',
                  )}
                >
                  {ownValue(rung.node)}
                </td>
                <td class="w-24 px-3 py-1.5">
                  {#if answered}
                    <span class="flex items-center gap-1 font-medium text-primary">
                      <ArrowRightIcon class="size-3" />
                      answered
                    </span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>

      </div>
    {:else if busy}
      <p class="text-xs text-muted-foreground">Resolving…</p>
    {:else}
      <p class="text-xs text-muted-foreground">
        Pick a comune. Its CAP fills itself for 7,338 of Italy's 7,896 comuni.
      </p>
    {/if}
  </div>
</Card.Root>
