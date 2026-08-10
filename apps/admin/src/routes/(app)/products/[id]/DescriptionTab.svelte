<script lang="ts">
  /**
   * The long description, on its own tab.
   *
   * It shares `product_translations` with the Basics tab, and the PATCH replaces
   * a language's whole translation row — so this tab sends the other five fields
   * back **as the server last returned them**, changing only `description`. Read
   * from `product` rather than from any local copy: the DTO is the freshest
   * truth, and a stale copy here would silently blank a title.
   */
  import { P } from '@mia/permissions';
  import { untrack } from 'svelte';
  import { toast } from 'svelte-sonner';

  import { api } from '~/lib/api';
  import TranslatedRichText from '~/lib/components/translated-rich-text.svelte';
  import { useContentLang } from '~/lib/content-lang.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { session } from '~/lib/session.svelte';
  import type { AdminProduct, Localized, TabProps } from './shared';
  import { sameAsSaved } from './shared';
  import TabPanel from './tab-panel.svelte';

  let { product, onSaved, dirty }: TabProps = $props();

  const SECTION = 'description';

  const snapshot = (source: AdminProduct): Localized => ({
    it: source.translations.it?.description ?? '',
    en: source.translations.en?.description ?? undefined,
  });

  let form = $state(untrack(() => snapshot(product)));
  let saved = $state(untrack(() => snapshot(product)));

  let seededFor = $state(untrack(() => product.id));
  $effect(() => {
    if (product.id === seededFor) return;
    seededFor = product.id;
    form = snapshot(product);
    saved = snapshot(product);
  });

  const isDirty = $derived(!sameAsSaved(form, saved));
  $effect(() => dirty.set(SECTION, isDirty));

  const contentLang = useContentLang();
  /**
   * The API cannot store an English description without an English title and
   * slug — `ProductTranslationsSchema` requires both. Say so instead of
   * accepting the text and dropping it on save.
   */
  const englishBlocked = $derived(
    contentLang.current === 'en' &&
      !(product.translations.en?.title && product.translations.en?.slug),
  );

  const canUpdate = $derived(session.can(P.PRODUCT_UPDATE));

  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});

  /** The language's row as the server has it, with our field swapped in. */
  function translationFor(lang: 'it' | 'en') {
    const row = product.translations[lang];
    const description = (lang === 'it' ? form.it : (form.en ?? '')).trim() || null;
    if (!row?.title || !row.slug) return undefined;
    return {
      title: row.title,
      slug: row.slug,
      shortDescription: row.shortDescription,
      description,
      metaTitle: row.metaTitle,
      metaDescription: row.metaDescription,
    };
  }

  async function save() {
    saving = true;
    error = null;
    fields = {};

    try {
      const it = translationFor('it');
      if (!it)
        throw new Error('This product has no Italian title yet — save the Basics tab first.');
      const en = translationFor('en');
      const updated = await unwrap<AdminProduct>(
        await api.api.admin.products[':id'].$patch({
          param: { id: product.id },
          json: { translations: { it, ...(en ? { en } : {}) } },
        }),
      );

      saved = snapshot(updated);
      form = snapshot(updated);
      dirty.clear(SECTION);
      onSaved(updated);
      toast.success('Description saved.');
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
    } finally {
      saving = false;
    }
  }
</script>

<TabPanel
  title="Description"
  description="The long copy on the product page, under “Descrizione”."
  dirty={isDirty}
  {saving}
  {error}
  onSave={save}
  saveLabel="Save description"
  disabledReason={canUpdate ? undefined : 'You need product:update to change this.'}
>
  <div class="space-y-3">
    {#if englishBlocked}
      <p
        class="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400"
        role="status"
      >
        Give this product an English title and slug on the Basics tab first — the API stores a
        translation as a whole row, so an English description has nowhere to go until then.
      </p>
    {/if}

    <TranslatedRichText
      name="Description"
      bind:value={form}
      hint="Headings start at H2 — the product title is the page's only H1. Images and video live on the Media tab."
      error={fields['translations.it.description'] ?? fields['translations.en.description']}
    />
  </div>
</TabPanel>
