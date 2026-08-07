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
-->
<script lang="ts">
  import type { InferResponseType } from 'hono/client';
  import { toast } from 'svelte-sonner';

  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import * as Sheet from '$lib/components/ui/sheet/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';
  import { api } from '~/lib/api';
  import ContentLangTabs from '~/lib/components/content-lang-tabs.svelte';
  import IconPicker from '~/lib/components/icon-picker.svelte';
  import TranslatedInput from '~/lib/components/translated-input.svelte';
  import { provideContentLang } from '~/lib/content-lang.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import OptionListEditor from './option-list-editor.svelte';
  import SpecFieldList from './spec-field-list.svelte';
  import {
    isSelectType,
    localizedOrNull,
    toLocalized,
    type Localized,
    type SpecEdit,
  } from './spec-edit';

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
  let icon = $state<string | null>(null);
  let name = $state<Localized>({ it: '' });
  let description = $state<Localized>({ it: '' });
  let slug = $state<Localized>({ it: '' });
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
      icon = null;
      name = { it: '' };
      description = { it: '' };
      slug = { it: '' };
      specs = [];
      return;
    }

    code = open.code;
    isActive = open.isActive;
    icon = open.icon;
    name = toLocalized(open.translations.it?.name, open.translations.en?.name);
    description = toLocalized(open.translations.it?.description, open.translations.en?.description);
    slug = toLocalized(open.translations.it?.slug, open.translations.en?.slug);
    specs = open.specs.map((spec) => ({
      uid: spec.id,
      id: spec.id,
      key: spec.key,
      label: toLocalized(spec.label.it, spec.label.en),
      helpText: spec.helpText ? toLocalized(spec.helpText.it, spec.helpText.en) : { it: '' },
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
        label: toLocalized(option.label.it, option.label.en),
      })),
    }));
  });

  /** Mirrors translationsPayload's completeness rule: EN needs name + slug. */
  const enMissing = $derived(!name.en?.trim() || !slug.en?.trim());

  /** English is only sent when it is actually complete — a half row is worse
      than none, because the storefront would fall back per-field instead of
      per-language. */
  function translationsPayload() {
    const forLang = (lang: 'it' | 'en') => {
      const pick = (value: Localized) => (lang === 'it' ? value.it : (value.en ?? ''));
      const row = {
        name: pick(name).trim(),
        slug: pick(slug).trim(),
        description: pick(description).trim() || null,
      };
      if (lang === 'en' && (!row.name || !row.slug)) return undefined;
      return row;
    };

    const en = forLang('en');
    return { it: forLang('it')!, ...(en ? { en } : {}) };
  }

  function specsPayload() {
    return specs.map((spec, position) => ({
      ...(spec.id ? { id: spec.id } : {}),
      key: spec.key,
      label: localizedOrNull(spec.label) ?? { it: '' },
      helpText: localizedOrNull(spec.helpText),
      valueType: spec.valueType as 'string',
      unit: spec.unit.trim() || null,
      isRequired: spec.isRequired,
      isFilterable: spec.isFilterable,
      isComparable: spec.isComparable,
      icon: spec.icon,
      position,
      // A type that is not a select has no options, and sending stale ones
      // would resurrect choices the operator thought they had removed.
      options: isSelectType(spec.valueType)
        ? spec.options.map((option, optionPosition) => ({
            ...(option.id ? { id: option.id } : {}),
            value: option.value,
            label: localizedOrNull(option.label) ?? { it: '' },
            position: optionPosition,
          }))
        : [],
    }));
  }

  async function save() {
    saving = true;
    error = null;
    fields = {};

    try {
      const body = { code, isActive, icon, translations: translationsPayload() };

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
          json: specsPayload(),
        }),
      );

      toast.success(`Saved "${name.it || code}".`);
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

    <div class="flex border-b px-6">
      <ContentLangTabs lang={contentLang} {enMissing} />
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
            error={fields['translations.it.name']}
            placeholder="Carrozzine"
          />
          <TranslatedInput
            label="Slug"
            bind:value={slug}
            error={fields['translations.it.slug']}
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
      <Button disabled={saving} onclick={save}>
        {#if saving}<Spinner />{/if}
        {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create category'}
      </Button>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>
