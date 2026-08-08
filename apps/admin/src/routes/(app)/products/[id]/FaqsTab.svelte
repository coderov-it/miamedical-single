<script lang="ts">
  import { P } from '@mia/permissions';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { untrack } from 'svelte';
  import { toast } from 'svelte-sonner';

  import { Button } from '$lib/components/ui/button/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';
  import { api } from '~/lib/api';
  import SortableList from '~/lib/components/sortable-list.svelte';
  import TranslatedInput from '~/lib/components/translated-input.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { session } from '~/lib/session.svelte';
  import type { AdminProduct, Localized, TabProps } from './shared';
  import { localizedOf, localizedOrNull, sameAsSaved } from './shared';
  import TabPanel from './tab-panel.svelte';

  let { product, onSaved, dirty }: TabProps = $props();

  const SECTION = 'faqs';

  interface FaqEdit {
    /** Client-only stable key — a new row has no server id to key on. */
    uid: string;
    question: Localized;
    answer: Localized;
    isActive: boolean;
  }

  const snapshot = (source: AdminProduct): FaqEdit[] =>
    source.faqs.map((faq, index) => ({
      uid: `faq-${index}-${crypto.randomUUID()}`,
      question: localizedOf(faq.question),
      answer: localizedOf(faq.answer),
      isActive: faq.isActive,
    }));

  /** `uid` is presentation-only, so it must not count towards dirtiness. */
  const comparable = (rows: FaqEdit[]) => rows.map(({ uid: _uid, ...rest }) => rest);

  let faqs = $state(untrack(() => snapshot(product)));
  let saved = $state(untrack(() => comparable(faqs)));

  let seededFor = $state(untrack(() => product.id));
  $effect(() => {
    if (product.id === seededFor) return;
    seededFor = product.id;
    faqs = snapshot(product);
    saved = comparable(faqs);
  });

  const isDirty = $derived(!sameAsSaved(comparable(faqs), saved));
  $effect(() => dirty.set(SECTION, isDirty));

  const canUpdate = $derived(session.can(P.PRODUCT_UPDATE));

  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});

  async function save() {
    saving = true;
    error = null;
    fields = {};

    try {
      const updated = await unwrap<AdminProduct>(
        await api.api.admin.products[':id'].faqs.$put({
          param: { id: product.id },
          json: faqs.map((faq, position) => ({
            question: localizedOrNull(faq.question) ?? { it: '' },
            answer: localizedOrNull(faq.answer) ?? { it: '' },
            isActive: faq.isActive,
            position,
          })),
        }),
      );
      faqs = snapshot(updated);
      saved = comparable(faqs);
      dirty.clear(SECTION);
      onSaved(updated);
      toast.success('FAQs saved.');
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
    } finally {
      saving = false;
    }
  }

  function add() {
    faqs.push({
      uid: crypto.randomUUID(),
      question: { it: '' },
      answer: { it: '' },
      isActive: true,
    });
  }
</script>

<TabPanel
  title="FAQs"
  description="Shown on the product page, in this order."
  dirty={isDirty}
  {saving}
  {error}
  onSave={save}
  saveLabel="Save FAQs"
  disabledReason={canUpdate ? undefined : 'You need product:update to change this.'}
>
  <div class="max-w-3xl space-y-3">
    {#if faqs.length === 0}
      <p class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No FAQs yet. They answer the questions that would otherwise become emails.
      </p>
    {/if}

    <SortableList
      bind:items={faqs}
      label="FAQ"
      key={(faq) => faq.uid}
      describe={(faq) => faq.question.it || 'this FAQ'}
      onRemove={(index) => faqs.splice(index, 1)}
    >
      {#snippet row(faq)}
        <div class="space-y-3">
          <TranslatedInput label="Question" bind:value={faq.question} />
          <TranslatedInput label="Answer" bind:value={faq.answer} multiline rows={3} />
          <div class="flex items-center gap-2">
            <Switch
              id="faq-active-{faq.uid}"
              checked={faq.isActive}
              onCheckedChange={(checked) => (faq.isActive = checked)}
            />
            <Label for="faq-active-{faq.uid}" class="text-sm">Visible on the site</Label>
          </div>
        </div>
      {/snippet}
    </SortableList>

    <Button variant="outline" size="sm" onclick={add}>
      <PlusIcon />
      Add FAQ
    </Button>

    {#if Object.keys(fields).length > 0}
      <ul class="space-y-0.5 text-xs text-destructive">
        {#each Object.entries(fields) as [path, message] (path)}
          <li><code class="font-mono">{path}</code>: {message}</li>
        {/each}
      </ul>
    {/if}
  </div>
</TabPanel>
