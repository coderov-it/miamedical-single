<script lang="ts">
  import { P } from '@mia/permissions';
  import { untrack } from 'svelte';
  import { toast } from 'svelte-sonner';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { cn } from '$lib/utils.js';
  import { api } from '~/lib/api';
  import { errorMessage, unwrap } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';
  import type { AdminProduct, AdminTerms, TabProps } from './shared';
  import { sameAsSaved } from './shared';
  import TabPanel from './tab-panel.svelte';

  let { product, onSaved, dirty }: TabProps = $props();

  const SECTION = 'terms';

  let selected = $state<string[]>(untrack(() => [...product.termsIds]));
  let saved = $state<string[]>(untrack(() => [...product.termsIds]));

  let seededFor = $state(untrack(() => product.id));
  $effect(() => {
    if (product.id === seededFor) return;
    seededFor = product.id;
    selected = [...product.termsIds];
    saved = [...product.termsIds];
  });

  const isDirty = $derived(!sameAsSaved(selected, saved));
  $effect(() => dirty.set(SECTION, isDirty));

  const documents = new Resource(
    () => null,
    async (_key, signal) =>
      unwrap<AdminTerms[]>(await api.api.admin.terms.$get(undefined, { init: { signal } })),
    { enabled: () => session.can(P.TERMS_READ) },
  );

  const canUpdate = $derived(session.can(P.PRODUCT_UPDATE));

  let saving = $state(false);
  let error = $state<string | null>(null);

  function toggle(id: string) {
    // Append rather than splice-in-place: selection order *is* display order,
    // so a newly ticked document belongs at the end.
    selected = selected.includes(id) ? selected.filter((entry) => entry !== id) : [...selected, id];
  }

  async function save() {
    saving = true;
    error = null;

    try {
      const updated = await unwrap<AdminProduct>(
        await api.api.admin.products[':id'].terms.$put({
          param: { id: product.id },
          json: selected.map((termsId, position) => ({ termsId, position })),
        }),
      );
      selected = [...updated.termsIds];
      saved = [...updated.termsIds];
      dirty.clear(SECTION);
      onSaved(updated);
      toast.success('Terms links saved.');
    } catch (err) {
      error = errorMessage(err);
    } finally {
      saving = false;
    }
  }
</script>

<TabPanel
  title="Terms documents"
  description="Linked documents appear on the product page and are accepted at checkout, in the order ticked."
  dirty={isDirty}
  {saving}
  error={error ?? documents.error}
  onSave={save}
  saveLabel="Save links"
  disabledReason={canUpdate ? undefined : 'You need product:update to change this.'}
>
  <div class="max-w-2xl space-y-2">
    {#if !documents.data}
      {#each { length: 3 } as _, row (row)}
        <Skeleton class="h-14 w-full" />
      {/each}
    {:else if documents.data.length === 0}
      <p class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No terms documents exist yet — create one under
        <a href={routes.terms} class="underline underline-offset-4">Terms</a>.
      </p>
    {:else}
      {#each documents.data as doc (doc.id)}
        {@const checked = selected.includes(doc.id)}
        <Label
          class={cn(
            'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
            checked ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
          )}
        >
          <Checkbox {checked} onCheckedChange={() => toggle(doc.id)} disabled={!canUpdate} />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium">
              {doc.translations.it?.title ?? doc.code}
            </span>
            <span class="text-xs text-muted-foreground">v{doc.version} · {doc.status}</span>
          </span>
          {#if doc.status !== 'published'}
            <!-- Linkable, but flagged: a draft document is not something a
                 customer can be asked to accept at checkout. -->
            <Badge variant="outline" class="border-amber-500/40 text-amber-600 dark:text-amber-400">
              not published
            </Badge>
          {/if}
        </Label>
      {/each}
    {/if}
  </div>
</TabPanel>
