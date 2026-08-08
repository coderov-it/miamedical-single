<script lang="ts">
  import { P } from '@mia/permissions';
  import ImageIcon from '@lucide/svelte/icons/image';
  import MoreHorizontalIcon from '@lucide/svelte/icons/more-horizontal';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import type { InferResponseType } from 'hono/client';
  import { toast } from 'svelte-sonner';

  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import * as Sheet from '$lib/components/ui/sheet/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';
  import { api, mediaUrl } from '~/lib/api';
  import { isSelectType, VALUE_TYPES, type Localized } from '~/lib/categories/spec-edit';
  import ContentLangTabs from '~/lib/components/content-lang-tabs.svelte';
  import IconPicker from '~/lib/components/icon-picker.svelte';
  import ListCard from '~/lib/components/list-card.svelte';
  import PageHeader from '~/lib/components/page-header.svelte';
  import TranslatedInput from '~/lib/components/translated-input.svelte';
  import { provideContentLang } from '~/lib/content-lang.svelte';
  import { pluralize } from '~/lib/format';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { session } from '~/lib/session.svelte';
  import { uiLang } from '~/lib/ui-lang.svelte';

  type Preset = InferResponseType<typeof api.api.admin.attributes.$get, 200>['data'][number];

  interface OptionEdit {
    uid: string;
    id?: string | undefined;
    value: string;
    label: Localized;
    /** Goes into the generated SKU code, so it is short and uppercase. */
    skuCode: string;
  }

  interface PresetEdit {
    id?: string | undefined;
    key: string;
    label: Localized;
    valueType: string;
    unit: string;
    isActive: boolean;
    icon: string | null;
    options: OptionEdit[];
  }

  const presets = new Resource(
    () => null,
    async (_key, signal) =>
      unwrap<Preset[]>(await api.api.admin.attributes.$get(undefined, { init: { signal } })),
    { enabled: () => session.can(P.ATTRIBUTE_READ) },
  );

  const rows = $derived(presets.data ?? []);

  // Editing language for the preset sheet — the IT/EN tabs under its header.
  const contentLang = provideContentLang();

  let editing = $state<PresetEdit | null>(null);
  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});
  let deleting = $state<Preset | null>(null);
  let deleteBusy = $state(false);

  // List display follows the interface language, not any editing state.
  const labelOf = (preset: Preset) =>
    (uiLang.current === 'en' ? preset.label.en : undefined) ?? preset.label.it ?? preset.key;

  function startEdit(preset?: Preset) {
    error = null;
    fields = {};
    contentLang.reset();
    editing = preset
      ? {
          id: preset.id,
          key: preset.key,
          label: { it: preset.label.it, en: preset.label.en },
          valueType: preset.valueType,
          unit: preset.unit ?? '',
          isActive: preset.isActive,
          icon: preset.icon,
          options: preset.options.map((option) => ({
            uid: option.id,
            id: option.id,
            value: option.value,
            label: { it: option.label.it, en: option.label.en },
            skuCode: option.skuCode ?? '',
          })),
        }
      : {
          key: '',
          label: { it: '' },
          valueType: 'single_select',
          unit: '',
          isActive: true,
          icon: null,
          options: [],
        };
  }

  async function save() {
    if (!editing) return;

    saving = true;
    error = null;
    fields = {};

    const localized = (value: Localized) =>
      value.en?.trim() ? { it: value.it, en: value.en } : { it: value.it };

    const payload = {
      key: editing.key,
      label: localized(editing.label),
      valueType: editing.valueType as 'string',
      unit: editing.unit.trim() || null,
      isActive: editing.isActive,
      icon: editing.icon,
      options: isSelectType(editing.valueType)
        ? editing.options.map((option, position) => ({
            ...(option.id ? { id: option.id } : {}),
            value: option.value,
            label: localized(option.label),
            skuCode: option.skuCode.trim() || null,
            position,
          }))
        : [],
    };

    try {
      if (editing.id) {
        await unwrap(
          await api.api.admin.attributes[':id'].$patch({
            param: { id: editing.id },
            json: payload,
          }),
        );
      } else {
        await unwrap(await api.api.admin.attributes.$post({ json: payload }));
      }
      toast.success(`Saved "${editing.label.it || editing.key}".`);
      editing = null;
      presets.refresh();
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
      toast.error(error);
    } finally {
      saving = false;
    }
  }

  async function confirmDelete() {
    const target = deleting;
    if (!target) return;

    deleteBusy = true;
    try {
      await unwrap(await api.api.admin.attributes[':id'].$delete({ param: { id: target.id } }));
      toast.success(`Deleted "${labelOf(target)}".`);
      deleting = null;
      presets.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      deleteBusy = false;
    }
  }

  function addOption() {
    editing?.options.push({ uid: crypto.randomUUID(), value: '', label: { it: '' }, skuCode: '' });
  }
</script>

<section class="admin-page">
  <PageHeader
    eyebrow="Catalog"
    title="Attributes"
    description="The reusable variant library. Adding a preset to a product copies it — later edits here do not reach products already using it."
  >
    {#snippet actions()}
      {#if session.can(P.ATTRIBUTE_CREATE)}
        <Button onclick={() => startEdit()}>
          <PlusIcon />
          New preset
        </Button>
      {/if}
    {/snippet}
  </PageHeader>

  <ListCard
    noun="preset"
    meta={presets.data
      ? { page: 1, perPage: rows.length || 1, total: rows.length, pageCount: 1 }
      : undefined}
    loading={presets.loading}
    error={presets.error}
    isEmpty={rows.length === 0}
    onPage={() => {}}
    onRetry={() => presets.refresh()}
    skeletonColumns={5}
  >
    {#snippet table()}
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head class="w-[35%]">Preset</Table.Head>
            <Table.Head>Key</Table.Head>
            <Table.Head>Type</Table.Head>
            <Table.Head>Options</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head class="w-10"></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each rows as preset (preset.id)}
            <Table.Row>
              <Table.Cell>
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted"
                  >
                    {#if preset.icon}
                      <img src={mediaUrl(preset.icon)} alt="" class="size-full object-cover" />
                    {:else}
                      <ImageIcon class="size-4 text-muted-foreground" />
                    {/if}
                  </div>
                  <button
                    type="button"
                    class="truncate text-left font-medium hover:underline"
                    onclick={() => startEdit(preset)}
                  >
                    {labelOf(preset)}
                  </button>
                </div>
              </Table.Cell>
              <Table.Cell><code class="font-mono text-xs">{preset.key}</code></Table.Cell>
              <Table.Cell class="text-muted-foreground">
                {VALUE_TYPES.find((type) => type.value === preset.valueType)?.label ??
                  preset.valueType}
                {#if preset.unit}<span class="text-xs">· {preset.unit}</span>{/if}
              </Table.Cell>
              <Table.Cell class="text-muted-foreground">
                {isSelectType(preset.valueType) ? pluralize(preset.options.length, 'option') : '—'}
              </Table.Cell>
              <Table.Cell>
                <Badge variant={preset.isActive ? 'default' : 'outline'}>
                  {preset.isActive ? 'active' : 'hidden'}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger
                    class={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                    aria-label="Row actions"
                  >
                    <MoreHorizontalIcon />
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end">
                    <DropdownMenu.Item onSelect={() => startEdit(preset)}>
                      <PencilIcon />
                      Edit
                    </DropdownMenu.Item>
                    {#if session.can(P.ATTRIBUTE_DELETE)}
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item variant="destructive" onSelect={() => (deleting = preset)}>
                        <Trash2Icon />
                        Delete
                      </DropdownMenu.Item>
                    {/if}
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {/snippet}

    {#snippet empty()}
      <Empty.Root class="border-0">
        <Empty.Header>
          <Empty.Media variant="icon"><SlidersHorizontalIcon /></Empty.Media>
          <Empty.Title>No attribute presets yet</Empty.Title>
          <Empty.Description>
            Presets save re-typing the same variant options — colour, size, material — on every
            product.
          </Empty.Description>
        </Empty.Header>
        {#if session.can(P.ATTRIBUTE_CREATE)}
          <Empty.Content>
            <Button onclick={() => startEdit()}>
              <PlusIcon />
              New preset
            </Button>
          </Empty.Content>
        {/if}
      </Empty.Root>
    {/snippet}
  </ListCard>
</section>

<Sheet.Root
  open={editing !== null}
  onOpenChange={(open) => {
    if (!open && !saving) editing = null;
  }}
>
  <Sheet.Content
    side="right"
    class="gap-0 p-0 data-[side=right]:sm:max-w-2xl"
    showCloseButton={false}
  >
    <Sheet.Header class="border-b bg-muted/50">
      <Sheet.Title>{editing?.id ? 'Edit preset' : 'New preset'}</Sheet.Title>
      <Sheet.Description>
        A preset is a template. Products copy it on use, so editing one never rewrites a product
        that already has it.
      </Sheet.Description>
    </Sheet.Header>

    <div class="flex border-b px-6">
      <ContentLangTabs lang={contentLang} enMissing={!editing?.label.en?.trim()} />
    </div>

    {#if editing}
      <div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
        {#if error}
          <p class="rounded-md bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        {/if}

        <div class="grid gap-4 sm:grid-cols-2">
          <TranslatedInput
            label="Label"
            bind:value={editing.label}
            error={fields['label.it']}
            placeholder="Colore"
          />
          <div>
            <Label class="mb-1.5" for="preset-key">Key</Label>
            <Input
              id="preset-key"
              bind:value={editing.key}
              placeholder="colore"
              class="font-mono"
              aria-invalid={fields.key ? 'true' : undefined}
            />
            {#if fields.key}
              <p class="mt-1 text-xs text-destructive" role="alert">{fields.key}</p>
            {/if}
          </div>
        </div>

        <div class="grid items-start gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <Label class="mb-1.5">Value type</Label>
            <Select.Root type="single" bind:value={editing.valueType}>
              <Select.Trigger class="w-full">
                {VALUE_TYPES.find((type) => type.value === editing?.valueType)?.label ??
                  'Choose a type'}
              </Select.Trigger>
              <Select.Content>
                {#each VALUE_TYPES as type (type.value)}
                  <Select.Item value={type.value}>{type.label}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>

          {#if editing.valueType === 'number' || editing.valueType === 'number_range'}
            <div>
              <Label class="mb-1.5" for="preset-unit">Unit</Label>
              <Input id="preset-unit" bind:value={editing.unit} placeholder="cm" />
            </div>
          {:else}
            <div></div>
          {/if}

          <IconPicker label="Icon" bind:value={editing.icon} compact />
        </div>

        <div class="flex items-center gap-2">
          <Switch
            id="preset-active"
            checked={editing.isActive}
            onCheckedChange={(checked) => editing && (editing.isActive = checked)}
          />
          <Label for="preset-active">Available when building a product</Label>
        </div>

        {#if isSelectType(editing.valueType)}
          <div>
            <div class="mb-1.5 flex items-center justify-between">
              <Label>Options</Label>
              <span class="text-xs text-muted-foreground">
                {pluralize(editing.options.length, 'option')}
              </span>
            </div>

            {#if editing.options.length > 0}
              <div
                class="space-y-1.5 rounded-lg border p-1.5 {editing.options.length > 5
                  ? 'max-h-72 overflow-y-auto'
                  : ''}"
              >
                {#each editing.options as option (option.uid)}
                  <div class="flex items-center gap-1.5">
                    <!-- Follows the sheet's IT/EN tabs like the label above. -->
                    <Input
                      value={contentLang.current === 'en'
                        ? (option.label.en ?? '')
                        : option.label.it}
                      oninput={(event) => {
                        const text = event.currentTarget.value;
                        if (contentLang.current === 'en') option.label.en = text || undefined;
                        else option.label.it = text;
                      }}
                      placeholder={contentLang.current === 'en' ? 'Label (EN)' : 'Etichetta (IT)'}
                      aria-label="Option label"
                      class="h-8 flex-1"
                    />
                    <Input
                      bind:value={option.value}
                      placeholder="value"
                      aria-label="Option value"
                      class="h-8 w-32 font-mono text-xs"
                    />
                    <Input
                      bind:value={option.skuCode}
                      placeholder="SKU"
                      aria-label="SKU code fragment"
                      class="h-8 w-20 font-mono text-xs uppercase"
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      class="text-muted-foreground"
                      aria-label="Remove option"
                      onclick={() =>
                        editing &&
                        (editing.options = editing.options.filter(
                          (entry) => entry.uid !== option.uid,
                        ))}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                {/each}
              </div>
            {/if}

            <Button type="button" variant="ghost" size="sm" class="mt-1.5" onclick={addOption}>
              <PlusIcon />
              Add option
            </Button>
            <p class="mt-1.5 text-xs text-muted-foreground">
              The SKU column is the fragment that lands in a generated SKU code — keep it short.
            </p>
          </div>
        {/if}
      </div>
    {/if}

    <Sheet.Footer class="flex-row items-center justify-between border-t bg-muted/50">
      <Button variant="ghost" disabled={saving} onclick={() => (editing = null)}>Cancel</Button>
      <Button disabled={saving} onclick={save}>
        {#if saving}<Spinner />{/if}
        {saving ? 'Saving…' : editing?.id ? 'Save changes' : 'Create preset'}
      </Button>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>

<AlertDialog.Root
  open={deleting !== null}
  onOpenChange={(open) => {
    if (!open) deleting = null;
  }}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete this preset?</AlertDialog.Title>
      <AlertDialog.Description>
        "{deleting ? labelOf(deleting) : ''}" is removed from the library. Products that already
        copied it keep their own groups — nothing on the storefront changes.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel disabled={deleteBusy}>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action
        disabled={deleteBusy}
        class={buttonVariants({ variant: 'destructive' })}
        onclick={(event) => {
          event.preventDefault();
          void confirmDelete();
        }}
      >
        {deleteBusy ? 'Deleting…' : 'Delete preset'}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
