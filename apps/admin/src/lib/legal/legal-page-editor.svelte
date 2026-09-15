<!--
  One legal page — the privacy notice today — in every language, on its own
  screen rather than in a list.

  It is a dedicated page and not a row in a sheet because that is what the thing
  is: there is exactly one privacy notice, it is never created and never deleted,
  and the operator arrives here to rewrite a document rather than to pick one.
  So there is no "New", no delete, and the first visit opens an empty editor
  instead of an empty list (`exists: false` from the API).

  The component is generic over `code` so a cookie notice is a route file and a
  line in `nav.ts`, never a second copy of this form.

  Storage, sanitisation and the split from the product terms pool:
  docs/code/legal-pages.md.
-->
<script lang="ts">
  import { P } from '@mia/permissions';
  import type { LegalPageCode } from '@mia/validators';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import WandSparklesIcon from '@lucide/svelte/icons/wand-sparkles';
  import type { InferResponseType } from 'hono/client';
  import { toast } from 'svelte-sonner';

  import { env } from '$env/dynamic/public';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { api } from '~/lib/api';
  import LanguageSwitcher from '~/lib/components/language-switcher.svelte';
  import PageHeader from '~/lib/components/page-header.svelte';
  import TranslateDialog from '~/lib/components/translate-dialog.svelte';
  import TranslatedInput from '~/lib/components/translated-input.svelte';
  import TranslatedRichText from '~/lib/components/translated-rich-text.svelte';
  import TranslationProgress from '~/lib/components/translation-progress.svelte';
  import UnsavedChangesGuard from '~/lib/components/unsaved-changes-guard.svelte';
  import { provideContentLang } from '~/lib/content-lang.svelte';
  import { DirtyState } from '~/lib/dirty.svelte';
  import { formatDateTime } from '~/lib/format';
  import {
    autoTranslate,
    type LocalizedValue,
    type PlanField,
    progressAcross,
    type TargetLanguageCode,
  } from '~/lib/i18n';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { session } from '~/lib/session.svelte';

  import { type Draft, draftFrom, isSameDraft, toPayload } from './draft.ts';

  type LegalPage = InferResponseType<(typeof api.api.admin.legal)[':code']['$get'], 200>['data'];

  interface Props {
    /** A `LEGAL_PAGE_CODES` entry — the API's param type is that same union. */
    code: LegalPageCode;
    title: string;
    description: string;
    /**
     * Where it lives on the storefront, for the "View" button. Italian path
     * only — the other languages are prefixed rewrites of it.
     *
     * ⚠️ The storefront owns this URL in `apps/website/src/lib/routes.ts`; this
     * app cannot import from it. Changing the path there means changing the
     * route file that passes this prop.
     */
    publicPath: string;
  }

  let { code, title, description, publicPath }: Props = $props();

  const page = new Resource(
    () => code,
    async (current, signal) =>
      unwrap<LegalPage>(
        await api.api.admin.legal[':code'].$get({ param: { code: current } }, { init: { signal } }),
      ),
    { enabled: () => session.can(P.LEGAL_PAGE_READ) },
  );

  const canEdit = $derived(session.can(P.LEGAL_PAGE_UPDATE));
  const contentLang = provideContentLang();
  const dirty = new DirtyState();

  let draft = $state<Draft | null>(null);
  /** The last saved state, to compare the draft against. Never edited. */
  let saved = $state<Draft | null>(null);
  let saving = $state(false);
  let fields = $state<Record<string, string>>({});
  let translateOpen = $state(false);

  // Seed the form from the server, and re-seed after every save. Keyed on the
  // payload identity (`Resource` replaces it wholesale), so typing never
  // re-runs this and resets the form under the operator's hands.
  $effect(() => {
    const data = page.data;
    if (!data) return;
    draft = draftFrom(data);
    saved = draftFrom(data);
  });

  $effect(() => {
    dirty.set('page', draft !== null && saved !== null && !isSameDraft(draft, saved));
  });

  $effect(() => {
    if (canEdit) void autoTranslate.probe();
  });

  /**
   * One group for the whole page, so a run either produces a complete
   * translation of the document or leaves it alone.
   *
   * That is stricter than the product editor, and deliberately: half a privacy
   * notice in French with the rest falling back to Italian is a document nobody
   * can rely on, and the storefront's own rule (`availableLocales`) hides a
   * language until both the title and the body exist in it.
   */
  const translationFields = $derived.by((): PlanField[] => {
    const current = saved;
    if (!current) return [];
    const base = { section: title, group: code, groupLabel: title };
    return [
      {
        ...base,
        key: 'title',
        label: 'Title',
        format: 'text',
        createsRow: true,
        values: current.title,
      },
      { ...base, key: 'body', label: 'Text', format: 'html', values: current.body },
      {
        ...base,
        key: 'metaTitle',
        label: 'Meta title',
        format: 'text',
        deriveFrom: 'title',
        values: current.metaTitle,
      },
      {
        ...base,
        key: 'metaDescription',
        label: 'Meta description',
        format: 'text',
        values: current.metaDescription,
      },
    ];
  });

  const progress = $derived(draft ? progressAcross([draft.title, draft.body]) : progressAcross([]));

  const storefrontUrl = $derived.by(() => {
    const base = env.PUBLIC_SITE_URL;
    if (!base || !page.data?.exists) return null;
    return `${base.replace(/\/$/, '')}${publicPath}`;
  });

  function openTranslate() {
    if (dirty.any) {
      toast.error('Save your changes first — a run reads the saved text.');
      return;
    }
    translateOpen = true;
  }

  async function save(): Promise<void> {
    const current = draft;
    if (!current) return;

    saving = true;
    fields = {};
    try {
      const updated = await unwrap<LegalPage>(
        await api.api.admin.legal[':code'].$put({ param: { code }, json: toPayload(current) }),
      );
      page.set(updated);
      toast.success('Saved. The site picks it up within a few minutes.');
    } catch (error) {
      fields = errorFields(error);
      toast.error(errorMessage(error));
    } finally {
      saving = false;
    }
  }

  /** The dialog hands back `{ fr: { title: …, body: … } }`; write it and save. */
  async function applyTranslations(
    rows: Partial<Record<TargetLanguageCode, Record<string, string>>>,
  ): Promise<void> {
    const current = draft;
    if (!current) return;

    for (const [lang, values] of Object.entries(rows) as [
      TargetLanguageCode,
      Record<string, string>,
    ][]) {
      for (const [key, text] of Object.entries(values)) {
        const field = current[key as keyof Draft];
        if (typeof field === 'string') continue;
        (field as LocalizedValue)[lang] = text || undefined;
      }
    }

    await save();
  }
</script>

<UnsavedChangesGuard {dirty} />

<section class="admin-page">
  <PageHeader eyebrow="Content" {title} {description}>
    {#snippet actions()}
      {#if autoTranslate.available && canEdit && page.data}
        <Button variant="outline" onclick={openTranslate}>
          <WandSparklesIcon />
          Translate
        </Button>
      {/if}
      {#if storefrontUrl}
        <Button href={storefrontUrl} target="_blank" rel="noreferrer" variant="outline">
          <ExternalLinkIcon />
          View
        </Button>
      {/if}
      {#if canEdit}
        <Button disabled={saving || !draft} onclick={save}>
          {#if saving}<Spinner />{/if}
          {saving ? 'Saving…' : 'Save'}
        </Button>
      {/if}
    {/snippet}
  </PageHeader>

  {#if page.error}
    <p class="text-sm text-destructive" role="alert">{page.error}</p>
  {:else if !draft}
    <div class="space-y-3">
      <Skeleton class="h-10 w-full" />
      <Skeleton class="h-64 w-full" />
    </div>
  {:else}
    <Card.Root class="gap-0 py-0">
      <div class="flex items-center justify-between gap-4 border-b px-5">
        <LanguageSwitcher lang={contentLang} {progress} />
        <TranslationProgress {progress} class="max-sm:hidden" />
      </div>

      <div class="space-y-5 p-5">
        <TranslatedInput
          label="Title"
          bind:value={draft.title}
          error={fields['title.it']}
          placeholder="Informativa sulla privacy"
          hint="The h1 on the page and the first half of its browser tab title."
        />

        <TranslatedRichText
          label="Text"
          name="Policy text"
          bind:value={draft.body}
          error={fields['body.it']}
        />
      </div>
    </Card.Root>

    <Card.Root class="mt-5 gap-0 py-0">
      <div class="border-b px-5 py-3">
        <h2 class="text-sm font-semibold">Search listing</h2>
        <p class="text-xs text-muted-foreground">
          Left empty, the page falls back to its own title and first paragraph.
        </p>
      </div>

      <div class="space-y-5 p-5">
        <TranslatedInput
          label="Meta title"
          bind:value={draft.metaTitle}
          required={false}
          error={fields['metaTitle.it']}
          hint="Around 60 characters — Google cuts it there."
        />

        <TranslatedInput
          label="Meta description"
          bind:value={draft.metaDescription}
          required={false}
          error={fields['metaDescription.it']}
          multiline
          rows={3}
          hint="Around 160 characters."
        />

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <Label class="mb-1.5" for="legal-effective-at">In effect from</Label>
            <Input id="legal-effective-at" type="date" bind:value={draft.effectiveAt} />
            <p class="mt-1 text-xs text-muted-foreground">
              Shown under the title. Not the same as the last edit — fixing a typo does not move it.
            </p>
          </div>

          {#if page.data?.exists}
            <div class="text-sm">
              <span class="text-muted-foreground">Last edited</span>
              <p>{formatDateTime(page.data.updatedAt)}</p>
            </div>
          {/if}
        </div>
      </div>
    </Card.Root>
  {/if}
</section>

<TranslateDialog bind:open={translateOpen} fields={translationFields} onApply={applyTranslations} />
