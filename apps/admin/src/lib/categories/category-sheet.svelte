<!--
  The category editor, as a right-side sheet at 80vw.

  It replaces a full-page route, and the reason is the work itself: editing a
  category is almost always something you do *while* looking at the list, and
  the specs are long enough to need real width. A sheet keeps the list behind
  it so the next edit is one click away.

  `open` is three-valued and that is load-bearing:
    undefined → closed
    null      → create
    Category  → edit
  A boolean plus a separate "mode" lets the two disagree; this cannot.

  Translate fills the form rather than the database: the sheet already holds
  one form and one Save, and a new category has nowhere else to put the answers.
-->
<script lang="ts">
  import { P } from '@mia/permissions';
  import WandSparklesIcon from '@lucide/svelte/icons/wand-sparkles';
  import type { InferResponseType } from 'hono/client';
  import { toast } from 'svelte-sonner';

  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Sheet from '$lib/components/ui/sheet/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';
  import { api } from '~/lib/api';
  import LanguageSwitcher from '~/lib/components/language-switcher.svelte';
  import IconPicker from '~/lib/components/icon-picker.svelte';
  import TranslateDialog from '~/lib/components/translate-dialog.svelte';
  import TranslatedInput from '~/lib/components/translated-input.svelte';
  import { provideContentLang } from '~/lib/content-lang.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import {
    autoTranslate,
    buildTranslations,
    progressAcross,
    SOURCE_LANGUAGE,
    textFor,
    translationError,
  } from '~/lib/i18n';
  import { session } from '~/lib/session.svelte';
  import BusyButton from '~/lib/components/busy-button.svelte';
  import SpecFieldList from './spec-field-list.svelte';
  import {
    cloneLocalized,
    localizedFrom,
    type Localized,
    type SpecEdit,
    toSpecsPayload,
  } from './spec-edit';
  import { applyTranslations, buildPlanFields, type TranslationRows } from './translation-fields';

  type Category = InferResponseType<(typeof api.api.admin.categories)[':id']['$get'], 200>['data'];

  interface Props {
    /** `undefined` closed · `null` create · a category to edit. */
    open: Category | null | undefined;
    onClose: () => void;
    onSaved: () => void;
  }

  let { open, onClose, onSaved }: Props = $props();

  // Sheet-wide editing language: the IT/EN tabs under the header drive every
  // bilingual field here, spec rows and their options included.
  const contentLang = provideContentLang();

  let code = $state('');
  let isActive = $state(true);
  let requiresDeposit = $state(false);
  let icon = $state<string | null>(null);
  let name = $state<Localized>({ [SOURCE_LANGUAGE]: '' });
  let description = $state<Localized>({ [SOURCE_LANGUAGE]: '' });
  let slug = $state<Localized>({ [SOURCE_LANGUAGE]: '' });
  let specs = $state<SpecEdit[]>([]);

  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});

  const isEdit = $derived(open !== null && open !== undefined);

  // Re-seed whenever the sheet is pointed at a different subject. Keyed on the
  // id (or `null` for create) rather than on `open` itself, so a refresh that
  // hands back an equal-but-new object does not wipe work in progress.
  let seededFor = $state<string | null | undefined>(undefined);

  $effect(() => {
    const subject = open === undefined ? undefined : (open?.id ?? null);
    if (subject === seededFor) return;
    seededFor = subject;

    error = null;
    fields = {};
    // A different subject means a fresh editing session — back to Italian.
    contentLang.reset();

    if (open === undefined) return;

    if (open === null) {
      code = '';
      isActive = true;
      requiresDeposit = false;
      icon = null;
      name = { [SOURCE_LANGUAGE]: '' };
      description = { [SOURCE_LANGUAGE]: '' };
      slug = { [SOURCE_LANGUAGE]: '' };
      specs = [];
      return;
    }

    code = open.code;
    isActive = open.isActive;
    requiresDeposit = open.requiresDeposit;
    icon = open.icon;
    name = localizedFrom(open.translations, (t) => t.name);
    description = localizedFrom(open.translations, (t) => t.description);
    slug = localizedFrom(open.translations, (t) => t.slug);
    specs = open.specs.map((spec) => ({
      uid: spec.id,
      id: spec.id,
      key: spec.key,
      label: cloneLocalized(spec.label),
      helpText: cloneLocalized(spec.helpText),
      valueType: spec.valueType,
      unit: spec.unit ?? '',
      isRequired: spec.isRequired,
      isFilterable: spec.isFilterable,
      isComparable: spec.isComparable,
      icon: spec.icon,
      tips: '',
      options: spec.options.map((option) => ({
        uid: option.id,
        id: option.id,
        value: option.value,
        label: cloneLocalized(option.label),
      })),
    }));
  });

  let translateOpen = $state(false);

  const canEdit = $derived(session.can(isEdit ? P.CATEGORY_UPDATE : P.CATEGORY_CREATE));

  // The action is absent until the API says a provider is configured.
  $effect(() => {
    if (canEdit) void autoTranslate.probe();
  });

  const translationFields = $derived(buildPlanFields({ name, slug, description, specs }));

  async function onTranslated(rows: TranslationRows) {
    applyTranslations({ name, slug, description, specs }, rows);
    const count = Object.keys(rows).length;
    toast.success(`Filled ${count} ${count === 1 ? 'language' : 'languages'}. Save to keep them.`);
  }

  /** A category counts as translated once it has a name and a slug. */
  const progress = $derived(progressAcross([name, slug]));

  function translationsPayload() {
    return buildTranslations(
      (lang) => ({
        name: textFor(name, lang).trim(),
        slug: textFor(slug, lang).trim(),
        description: textFor(description, lang).trim() || null,
      }),
      (row) => Boolean(row.name && row.slug),
    )!; // never null: the builder always returns a row, and the form gate
    // already requires the source-language name before save is reachable.
  }

  async function save() {
    saving = true;
    error = null;
    fields = {};

    try {
      const body = { code, isActive, requiresDeposit, icon, translations: translationsPayload() };

      // Two calls, because specs have their own PUT. Basics first: a category
      // that does not exist yet has no id to hang specs off.
      const saved = isEdit
        ? await unwrap<Category>(
            await api.api.admin.categories[':id'].$patch({
              param: { id: open!.id },
              json: body,
            }),
          )
        : await unwrap<Category>(await api.api.admin.categories.$post({ json: body }));

      await unwrap<Category>(
        await api.api.admin.categories[':id'].specs.$put({
          param: { id: saved.id },
          json: toSpecsPayload(specs),
        }),
      );

      toast.success(`Saved "${textFor(name, SOURCE_LANGUAGE) || code}".`);
      onSaved();
      onClose();
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
      // Kept open on failure: closing would discard everything they typed.
      toast.error(error);
    } finally {
      saving = false;
    }
  }
</script>

<Sheet.Root
  open={open !== undefined}
  onOpenChange={(next) => {
    if (!next && !saving) onClose();
  }}
>
  <Sheet.Content
    side="right"
    class="w-full gap-0 p-0 data-[side=right]:sm:max-w-[80vw]"
    showCloseButton={false}
  >
    <Sheet.Header class="border-b bg-muted/50">
      <Sheet.Title>{isEdit ? 'Edit category' : 'New category'}</Sheet.Title>
      <Sheet.Description>
        The specs defined here become the filters and comparison rows for every product in this
        category.
      </Sheet.Description>
    </Sheet.Header>

    <div class="flex items-center justify-between gap-2 border-b px-6">
      <LanguageSwitcher lang={contentLang} {progress} />
      {#if autoTranslate.available && canEdit}
        <Button
          variant="outline"
          size="sm"
          disabled={saving}
          onclick={() => (translateOpen = true)}
        >
          <WandSparklesIcon />
          Translate
        </Button>
      {/if}
    </div>

    <div class="min-h-0 flex-1 divide-y overflow-y-auto">
      {#if error}
        <div class="bg-destructive/5 px-6 py-3 text-sm text-destructive" role="alert">{error}</div>
      {/if}

      <section class="space-y-4 p-6">
        <div class="grid gap-4 sm:grid-cols-2">
          <TranslatedInput
            label="Name"
            bind:value={name}
            error={translationError(fields, 'name')}
            placeholder="Carrozzine"
          />
          <TranslatedInput
            label="Slug"
            bind:value={slug}
            error={translationError(fields, 'slug')}
            placeholder="carrozzine"
            hint="The URL segment on the storefront."
          />
        </div>

        <TranslatedInput
          label="Description"
          bind:value={description}
          required={false}
          multiline
          placeholder="Shown at the top of the category page."
        />

        <div class="grid items-start gap-4 sm:grid-cols-[1fr_auto_auto]">
          <div>
            <Label class="mb-1.5" for="category-code">Code</Label>
            <Input
              id="category-code"
              bind:value={code}
              placeholder="carrozzine"
              class="font-mono"
              aria-invalid={fields.code ? 'true' : undefined}
            />
            <p class="mt-1 text-xs text-muted-foreground">
              Internal identifier. Stable — products reference it.
            </p>
            {#if fields.code}
              <p class="mt-1 text-xs text-destructive" role="alert">{fields.code}</p>
            {/if}
          </div>

          <IconPicker label="Icon" bind:value={icon} compact />

          <div>
            <Label class="mb-1.5" for="category-active">Active</Label>
            <div class="flex h-9 items-center gap-2">
              <Switch
                id="category-active"
                checked={isActive}
                onCheckedChange={(checked) => (isActive = checked)}
              />
              <span class="text-sm text-muted-foreground">
                {isActive ? 'Visible on the storefront' : 'Hidden'}
              </span>
            </div>
          </div>

          <div>
            <Label class="mb-1.5" for="category-deposit">Security deposit</Label>
            <div class="flex h-9 items-center gap-2">
              <Switch
                id="category-deposit"
                checked={requiresDeposit}
                onCheckedChange={(checked) => (requiresDeposit = checked)}
              />
              <span class="text-sm text-muted-foreground">
                {requiresDeposit
                  ? 'Rentals sign the deposit contract'
                  : 'Rentals sign the standard contract'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section class="space-y-3 p-6">
        <div>
          <h3 class="text-sm font-medium">Spec fields</h3>
          <p class="mt-0.5 text-sm text-muted-foreground">
            Order matters — it is the order they appear in on the storefront.
          </p>
        </div>
        <SpecFieldList bind:specs disabled={saving} />
      </section>
    </div>

    <!-- Cancel far left, Save far right: the two are not peers, and putting a
         destructive-ish action next to the confirming one invites misfires. -->
    <Sheet.Footer class="flex-row items-center justify-between border-t bg-muted/50">
      <Button variant="ghost" disabled={saving} onclick={onClose}>Cancel</Button>
      <BusyButton busy={saving} busyLabel="Saving…" onclick={save}>
        {isEdit ? 'Save changes' : 'Create category'}
      </BusyButton>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>

<TranslateDialog
  bind:open={translateOpen}
  fields={translationFields}
  onApply={onTranslated}
  commit="apply"
/>
