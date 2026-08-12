<!--
  Delivery Zones — the owner's price tree over Italy.

  Why a tree rather than the flat table their spreadsheet actually is: the sheet
  only covers the areas they serve, and Italy has ~7,900 comuni. A fee on a region
  or a province covers everything below it that has nothing of its own, so coverage
  is complete from the first row and gets more precise as rows are added — rather
  than starting with 7,700 holes.

  The country row (Italia) is why coverage is total rather than nearly total: it
  always carries a value, so an address no deeper row covers still gets an answer.
  It cannot be deleted, recoded, or set to inherit.

  MUTATIONS ARE OPTIMISTIC. The fee stepper writes to the local tree on every press
  and the PATCH is debounced, because nudging a fee four times must not be four
  round trips. Anything the server rejects is reported and the tree re-fetched, so
  the screen never keeps a value the database refused.

  TEXT BUDGET. One line of description and one Help button; every other explanation
  is in help-dialog.svelte or behind an (i). Model: ~/lib/delivery-zones/tree.ts.
-->
<script lang="ts">
  import { P } from '@mia/permissions';

  import ChevronsDownUpIcon from '@lucide/svelte/icons/chevrons-down-up';
  import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import CircleQuestionMarkIcon from '@lucide/svelte/icons/circle-question-mark';
  import SearchIcon from '@lucide/svelte/icons/search';
  import TruckIcon from '@lucide/svelte/icons/truck';
  // Reactive Set, so `collapsed.add/delete` re-renders the tree without
  // reassigning the whole thing on every toggle.
  import { SvelteSet } from 'svelte/reactivity';
  import { toast } from 'svelte-sonner';

  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { api } from '~/lib/api';
  import PageHeader from '~/lib/components/page-header.svelte';
  import HelpDialog from '~/lib/delivery-zones/help-dialog.svelte';
  import ZoneCoverage from '~/lib/delivery-zones/zone-coverage.svelte';
  import ZoneEditor from '~/lib/delivery-zones/zone-editor.svelte';
  import ZoneTreeRow from '~/lib/delivery-zones/zone-tree-row.svelte';
  import {
    type ApiZone,
    type ZoneLevel,
    type ZoneNode,
    type ZoneResponse,
    type ZoneValueKind,
    countDescendants,
    findZone,
    indexParents,
    toZoneNodes,
    zoneMatches,
    zoneTitle,
  } from '~/lib/delivery-zones/tree.ts';
  import { errorMessage, unwrapFull } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { session } from '~/lib/session.svelte';

  /**
   * Illustrative subtotal for the "at checkout" preview in the editor. It is a
   * fixed figure on purpose — the panel is showing what a delivery fee does to a
   * total, not previewing any real order.
   */
  const RENTAL_SUBTOTAL = '84.00';

  /** How long the fee stepper settles before the PATCH goes out. */
  const FEE_DEBOUNCE_MS = 500;

  const canWrite = $derived(session.can(P.DELIVERY_ZONE_UPDATE));
  const canCreate = $derived(session.can(P.DELIVERY_ZONE_CREATE));
  const canDelete = $derived(session.can(P.DELIVERY_ZONE_DELETE));

  const zones = new Resource(
    () => null,
    async (_key, signal) =>
      unwrapFull<ZoneResponse>(
        await api.api.admin['delivery-zones'].$get(undefined, { init: { signal } }),
      ),
    { enabled: () => session.can(P.DELIVERY_ZONE_READ) },
  );

  /**
   * A local copy of the tree, so an optimistic edit shows immediately.
   *
   * Replaced wholesale whenever the resource delivers, which is also how a rejected
   * mutation gets undone: report it, `refresh()`, and the server's version wins.
   */
  let tree = $state<ZoneNode[]>([]);

  $effect(() => {
    const payload = zones.data?.data;
    if (payload) tree = toZoneNodes(payload);
  });

  let selectedId = $state('');
  let helpOpen = $state(false);
  let filter = $state('');
  /* Already reactive, so it is mutated rather than reassigned — `$state` around a
     SvelteSet is redundant and the linter says so. */
  const collapsed = new SvelteSet<string>();

  const parents = $derived(indexParents(tree));
  const term = $derived(filter.trim().toLowerCase());
  const roots = $derived(tree.filter((node) => zoneMatches(node, term)));

  /** Falls back to the root when the selection is filtered away or deleted. */
  const selected = $derived(findZone(tree, selectedId) ?? tree[0]);

  /**
   * First load with nothing on screen yet, versus refreshing what is already there.
   * Taken from the resource rather than a local counter — `count += 1` inside the
   * sync effect reads the counter it writes, which is an infinite update loop.
   */
  const firstLoad = $derived(zones.loading && !zones.hasData);

  function toggle(id: string) {
    if (collapsed.has(id)) collapsed.delete(id);
    else collapsed.add(id);
  }

  function collapseAll() {
    const walk = (nodes: readonly ZoneNode[]) => {
      for (const node of nodes) {
        if (node.children.length > 0) collapsed.add(node.id);
        walk(node.children);
      }
    };
    collapsed.clear();
    walk(tree);
  }

  /* ----------------------------------------------------------- mutations --- */

  let busy = $state(false);
  let feeTimer: ReturnType<typeof setTimeout> | undefined;
  /* The write the timer owes, kept so it can be sent early. Not `$state`: nothing
     renders it. */
  let pendingFee: { id: string; fee: string } | null = null;

  /**
   * Sends a value change and reconciles.
   *
   * The optimistic write has already happened by the time this runs — its job is to
   * make the server agree, or to put the truth back if it will not.
   */
  async function patchZone(
    id: string,
    body: { name?: string; code?: string; valueKind?: ZoneValueKind | null; fee?: string | null },
  ): Promise<boolean> {
    busy = true;
    try {
      await unwrapFull(
        await api.api.admin['delivery-zones'][':id'].$patch({ param: { id }, json: body }),
      );
      // Re-fetch rather than trusting the local copy: a code change moves what the
      // row matches, and the server may have canonicalised it (`rm` → `RM`).
      zones.refresh();
      return true;
    } catch (err) {
      toast.error(errorMessage(err));
      zones.refresh();
      return false;
    } finally {
      busy = false;
    }
  }

  function setState(node: ZoneNode, state: 'inherit' | 'fee' | 'call') {
    if (!canWrite) return;
    flushFee();
    const valueKind = state === 'inherit' ? null : state;
    // Seeded from the row's own figure, or from whatever it currently inherits, so
    // switching to a fixed fee never lands on zero.
    const fee =
      valueKind === 'fee' ? (node.fee ?? effectiveFee(node) ?? '20.00') : null;

    node.valueKind = valueKind;
    node.fee = fee;
    void patchZone(node.id, { valueKind, fee });
  }

  /** What this row would charge today, for seeding the stepper. */
  function effectiveFee(node: ZoneNode): string | null {
    let cursor: ZoneNode | null | undefined = node;
    while (cursor) {
      if (cursor.valueKind === 'fee') return cursor.fee;
      if (cursor.valueKind === 'call') return null;
      cursor = parents.get(cursor.id);
    }
    return null;
  }

  /**
   * Sends the pending fee now instead of on the timer.
   *
   * Every other mutation calls this first, because they all end in `refresh()` —
   * and a refresh that arrives while a fee is still queued replaces the operator's
   * figure with the server's older one.
   */
  function flushFee() {
    clearTimeout(feeTimer);
    feeTimer = undefined;
    const pending = pendingFee;
    pendingFee = null;
    if (pending) void patchZone(pending.id, { valueKind: 'fee', fee: pending.fee });
  }

  /**
   * The stepper fires on every press, so the write is local and the PATCH waits.
   *
   * One timer for the whole screen, so moving to another row mid-debounce FLUSHES
   * the previous row's write rather than cancelling it. Cancelling was the bug:
   * the figure stayed on screen, was never sent, and the next refresh quietly put
   * the old one back.
   */
  function setFee(node: ZoneNode, fee: string) {
    if (!canWrite) return;
    node.valueKind = 'fee';
    node.fee = fee;

    if (pendingFee && pendingFee.id !== node.id) flushFee();
    pendingFee = { id: node.id, fee };
    clearTimeout(feeTimer);
    feeTimer = setTimeout(flushFee, FEE_DEBOUNCE_MS);
  }

  /** Reports whether the rename was accepted, so the panel's form knows to close. */
  async function renameZone(node: ZoneNode, name: string, code: string): Promise<boolean> {
    if (!canWrite) return false;
    flushFee();
    node.name = name;
    node.code = code;
    return patchZone(node.id, { name, code });
  }

  /* Deleting still asks, because it silently takes every nested area with it.
     Adding does not: the panel's own form asks for the name and the code, which is
     the half that matters — a row created with a placeholder code prices nothing
     while looking perfectly fine. */
  let deleting = $state<ZoneNode | null>(null);

  async function confirmAdd(
    parent: ZoneNode,
    level: ZoneLevel,
    name: string,
    code: string,
  ): Promise<boolean> {
    flushFee();
    busy = true;
    try {
      const created = await unwrapFull<{ data: ApiZone }>(
        await api.api.admin['delivery-zones'].$post({
          json: { parentId: parent.id, level, name, code },
        }),
      );
      // Graft the row in before moving the selection to it. `selected` falls back to
      // Italia for an id it cannot find, so selecting a row that only exists on the
      // server would flash the wrong area until the refetch landed.
      parent.children = [...parent.children, ...toZoneNodes([created.data])];
      collapsed.delete(parent.id);
      selectedId = created.data.id;
      zones.refresh();
      toast.success(`Added “${name}”.`);
      return true;
    } catch (err) {
      // A duplicate sibling or a malformed code comes back with a reason; show it
      // and leave the form on the values the operator typed.
      toast.error(errorMessage(err));
      return false;
    } finally {
      busy = false;
    }
  }

  async function confirmDelete() {
    const target = deleting;
    if (!target) return;
    flushFee();
    const parent = parents.get(target.id) ?? null;

    busy = true;
    try {
      await unwrapFull(
        await api.api.admin['delivery-zones'][':id'].$delete({ param: { id: target.id } }),
      );
      toast.success(`Deleted “${zoneTitle(target, parents)}”.`);
      // Land on the parent rather than nothing, so the operator keeps their place.
      selectedId = parent?.id ?? '';
      deleting = null;
      zones.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      busy = false;
    }
  }
</script>

<section class="admin-page">
  <PageHeader
    eyebrow="Sales"
    title="Delivery Zones"
    description="A fee set on any area covers everything below it until a deeper area overrides."
  >
    {#snippet actions()}
      <Button variant="outline" onclick={() => (helpOpen = true)}>
        <CircleQuestionMarkIcon />
        Help
      </Button>
    {/snippet}
  </PageHeader>

  {#if !session.can(P.DELIVERY_ZONE_READ)}
    <Empty.Root>
      <Empty.Header>
        <Empty.Media variant="icon"><TruckIcon /></Empty.Media>
        <Empty.Title>No access to delivery zones</Empty.Title>
        <Empty.Description>Ask an administrator for the “View delivery zones” permission.</Empty.Description>
      </Empty.Header>
    </Empty.Root>
  {:else}
    <div class="grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,1fr)]">
      <Card.Root class="gap-0 overflow-hidden py-0">
        <div class="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center">
          <div class="relative sm:max-w-xs sm:flex-1">
            <SearchIcon
              class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              placeholder="Filter by name, ISTAT code or CAP…"
              class="pl-8"
              bind:value={filter}
            />
          </div>
          <!-- The tree's own controls sit with the tree, not in the page header —
               the legend that used to be here is in Help, where the OWN/INHERITED
               badges are explained once instead of restated on every visit. -->
          <div class="flex gap-1.5 sm:ml-auto">
            <Button variant="outline" size="sm" onclick={collapseAll}>
              <ChevronsDownUpIcon />
              Collapse all
            </Button>
            <Button variant="outline" size="sm" onclick={() => collapsed.clear()}>
              <ChevronsUpDownIcon />
              Expand all
            </Button>
          </div>
        </div>

        <!-- Reserved height either way, so the tree does not shift by 2px on load. -->
        <div class="h-0.5">
          {#if zones.loading && !firstLoad}<div class="admin-loading-bar"></div>{/if}
        </div>

        {#if firstLoad}
          <div class="space-y-2 p-4">
            {#each { length: 8 } as _, row (row)}
              <Skeleton class="h-8" style="margin-left: {(row % 4) * 1.25}rem" />
            {/each}
          </div>
        {:else}
          <div class="p-2">
            <ul class="space-y-0.5" role="tree" aria-label="Delivery zones tree">
              {#each roots as node (node.id)}
                <ZoneTreeRow
                  {node}
                  {parents}
                  {selectedId}
                  {collapsed}
                  {term}
                  onSelect={(next) => (selectedId = next.id)}
                  onToggle={toggle}
                />
              {/each}
            </ul>

            {#if roots.length === 0 && tree.length > 0}
              <p class="px-3 py-8 text-center text-sm text-muted-foreground">
                No area matches “{filter}”.
              </p>
            {/if}
          </div>
        {/if}

        {#if zones.error}
          <div
            class="flex items-center gap-3 border-t bg-destructive/5 px-4 py-3 text-sm"
            role="alert"
          >
            <CircleAlertIcon class="size-4 shrink-0 text-destructive" />
            <span class="text-destructive">{zones.error}</span>
            <Button variant="outline" size="sm" class="ml-auto" onclick={() => zones.refresh()}>
              Retry
            </Button>
          </div>
        {:else if zones.hasData && tree.length === 0}
          <!-- Only reachable on a database that was never seeded: the country row
               is created by the seed, not from this screen. -->
          <Empty.Root class="border-t">
            <Empty.Header>
              <Empty.Media variant="icon"><TruckIcon /></Empty.Media>
              <Empty.Title>No areas yet</Empty.Title>
              <Empty.Description>
                Even the country row is missing, so no address can be priced. Run
                <code class="font-mono">pnpm --filter @mia/server seed</code>
                to create it.
              </Empty.Description>
            </Empty.Header>
          </Empty.Root>
        {/if}
      </Card.Root>

      {#if selected}
        <ZoneEditor
          node={selected}
          {parents}
          {busy}
          canWrite={canWrite}
          canDelete={canDelete && canWrite}
          rentalSubtotal={RENTAL_SUBTOTAL}
          onStateChange={setState}
          onFeeChange={setFee}
          canCreate={canCreate && canWrite}
          onAddChild={confirmAdd}
          onIdentityChange={renameZone}
          onDelete={(node) => (deleting = node)}
        />
      {/if}

      <!-- Under the editor, not beside it: the editor answers "what does this row
           cost", this answers "what does an address cost", and reading the second
           only makes sense once the first has been set. -->
      {#if tree.length > 0}
        <ZoneCoverage {tree} />
      {/if}
    </div>
  {/if}
</section>

<HelpDialog open={helpOpen} onOpenChange={(open) => (helpOpen = open)} />

<AlertDialog.Root open={deleting !== null} onOpenChange={(open) => !open && (deleting = null)}>
  <AlertDialog.Content>
    {#if deleting}
      {@const nested = countDescendants(deleting)}
      <AlertDialog.Header>
        <AlertDialog.Title>Delete “{zoneTitle(deleting, parents)}”?</AlertDialog.Title>
        <AlertDialog.Description>
          {#if nested > 0}
            This also deletes {nested} nested {nested === 1 ? 'area' : 'areas'} and every fee set on
            them. Addresses there fall back to the nearest area above.
          {:else}
            Addresses here fall back to the nearest area above.
          {/if}
        </AlertDialog.Description>
      </AlertDialog.Header>
      <AlertDialog.Footer>
        <AlertDialog.Cancel disabled={busy}>Cancel</AlertDialog.Cancel>
        <AlertDialog.Action
          class={buttonVariants({ variant: 'destructive' })}
          disabled={busy}
          onclick={confirmDelete}
        >
          Delete area
        </AlertDialog.Action>
      </AlertDialog.Footer>
    {/if}
  </AlertDialog.Content>
</AlertDialog.Root>
