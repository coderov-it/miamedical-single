<script lang="ts">
  import { P } from '@mia/permissions';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import MoreHorizontalIcon from '@lucide/svelte/icons/more-horizontal';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import PlusIcon from '@lucide/svelte/icons/plus';
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
  import * as Sheet from '$lib/components/ui/sheet/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { api } from '~/lib/api';
  import type { Localized } from '~/lib/categories/spec-edit';
  import ContentLangTabs from '~/lib/components/content-lang-tabs.svelte';
  import ListCard from '~/lib/components/list-card.svelte';
  import PageHeader from '~/lib/components/page-header.svelte';
  import TranslatedInput from '~/lib/components/translated-input.svelte';
  import { provideContentLang } from '~/lib/content-lang.svelte';
  import { formatDate, orDash } from '~/lib/format';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';
  import { session } from '~/lib/session.svelte';
  import { uiLang } from '~/lib/ui-lang.svelte';

  type Terms = InferResponseType<typeof api.api.admin.terms.$get, 200>['data'][number];

  interface TermsEdit {
    id?: string | undefined;
    code: string;
    title: Localized;
    body: Localized;
    slug: Localized;
  }

  const documents = new Resource(
    () => null,
    async (_key, signal) =>
      unwrap<Terms[]>(await api.api.admin.terms.$get(undefined, { init: { signal } })),
    { enabled: () => session.can(P.TERMS_READ) },
  );

  const rows = $derived(documents.data ?? []);

  // Editing language for the document sheet — the IT/EN tabs under its header.
  const contentLang = provideContentLang();

  let editing = $state<TermsEdit | null>(null);
  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});
  let deleting = $state<Terms | null>(null);
  let deleteBusy = $state(false);

  // List display follows the interface language, not any editing state.
  const titleOf = (doc: Terms) =>
    (uiLang.current === 'en' ? doc.translations.en?.title : undefined) ??
    doc.translations.it?.title ??
    doc.code;

  /** Mirrors translationsPayload: EN counts once title, body and slug exist. */
  const enMissing = $derived(
    !editing?.title.en?.trim() || !editing?.body.en?.trim() || !editing?.slug.en?.trim(),
  );

  function startEdit(doc?: Terms) {
    error = null;
    fields = {};
    contentLang.reset();
    editing = doc
      ? {
          id: doc.id,
          code: doc.code,
          title: { it: doc.translations.it?.title ?? '', en: doc.translations.en?.title },
          body: { it: doc.translations.it?.body ?? '', en: doc.translations.en?.body },
          slug: { it: doc.translations.it?.slug ?? '', en: doc.translations.en?.slug },
        }
      : { code: '', title: { it: '' }, body: { it: '' }, slug: { it: '' } };
  }

  /**
   * A terms document is a legal text. English is only sent when title, body
   * and slug are all present — a document that is half translated must fall
   * back to Italian entirely rather than serve a mix of the two.
   */
  function translationsPayload(edit: TermsEdit) {
    const forLang = (lang: 'it' | 'en') => {
      const pick = (value: Localized) => (lang === 'it' ? value.it : (value.en ?? ''));
      const row = {
        title: pick(edit.title).trim(),
        body: pick(edit.body).trim(),
        slug: pick(edit.slug).trim(),
      };
      if (lang === 'en' && (!row.title || !row.body || !row.slug)) return undefined;
      return row;
    };

    const en = forLang('en');
    return { it: forLang('it')!, ...(en ? { en } : {}) };
  }

  async function save() {
    if (!editing) return;

    saving = true;
    error = null;
    fields = {};

    const payload = { code: editing.code, translations: translationsPayload(editing) };

    try {
      if (editing.id) {
        await unwrap(
          await api.api.admin.terms[':id'].$patch({ param: { id: editing.id }, json: payload }),
        );
      } else {
        await unwrap(await api.api.admin.terms.$post({ json: payload }));
      }
      toast.success(`Saved "${editing.title.it || editing.code}".`);
      editing = null;
      documents.refresh();
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
      await unwrap(await api.api.admin.terms[':id'].$delete({ param: { id: target.id } }));
      toast.success(`Deleted "${titleOf(target)}".`);
      deleting = null;
      documents.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      deleteBusy = false;
    }
  }
</script>

<section class="admin-page">
  <PageHeader
    eyebrow="Catalog"
    title="Terms documents"
    description="Rental conditions, warranty and returns. Products link to these rather than restating them."
  >
    {#snippet actions()}
      {#if session.can(P.TERMS_CREATE)}
        <Button onclick={() => startEdit()}>
          <PlusIcon />
          New document
        </Button>
      {/if}
    {/snippet}
  </PageHeader>

  <ListCard
    noun="document"
    meta={documents.data
      ? { page: 1, perPage: rows.length || 1, total: rows.length, pageCount: 1 }
      : undefined}
    loading={documents.loading}
    error={documents.error}
    isEmpty={rows.length === 0}
    onPage={() => {}}
    onRetry={() => documents.refresh()}
    skeletonColumns={4}
  >
    {#snippet table()}
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head class="w-[45%]">Document</Table.Head>
            <Table.Head>Code</Table.Head>
            <Table.Head>English</Table.Head>
            <Table.Head>Updated</Table.Head>
            <Table.Head class="w-10"></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each rows as doc (doc.id)}
            <Table.Row>
              <Table.Cell>
                <button
                  type="button"
                  class="block text-left font-medium hover:underline"
                  onclick={() => startEdit(doc)}
                >
                  {titleOf(doc)}
                </button>
                <p class="text-xs text-muted-foreground">
                  {orDash(doc.translations.it?.slug)}
                </p>
              </Table.Cell>
              <Table.Cell><code class="font-mono text-xs">{doc.code}</code></Table.Cell>
              <Table.Cell>
                {#if doc.translations.en?.body}
                  <Badge variant="outline" class="border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                    complete
                  </Badge>
                {:else}
                  <Badge variant="outline" class="border-amber-500/40 text-amber-600 dark:text-amber-400">
                    missing
                  </Badge>
                {/if}
              </Table.Cell>
              <Table.Cell class="text-muted-foreground">{formatDate(doc.updatedAt)}</Table.Cell>
              <Table.Cell>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger
                    class={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                    aria-label="Row actions"
                  >
                    <MoreHorizontalIcon />
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end">
                    <DropdownMenu.Item onSelect={() => startEdit(doc)}>
                      <PencilIcon />
                      Edit
                    </DropdownMenu.Item>
                    {#if session.can(P.TERMS_DELETE)}
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item variant="destructive" onSelect={() => (deleting = doc)}>
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
          <Empty.Media variant="icon"><FileTextIcon /></Empty.Media>
          <Empty.Title>No terms documents yet</Empty.Title>
          <Empty.Description>
            Rental products need conditions to link to before they can be published.
          </Empty.Description>
        </Empty.Header>
        {#if session.can(P.TERMS_CREATE)}
          <Empty.Content>
            <Button onclick={() => startEdit()}>
              <PlusIcon />
              New document
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
    class="gap-0 p-0 data-[side=right]:sm:max-w-3xl"
    showCloseButton={false}
  >
    <Sheet.Header class="border-b bg-muted/50">
      <Sheet.Title>{editing?.id ? 'Edit document' : 'New document'}</Sheet.Title>
      <Sheet.Description>
        Published as-is on the storefront. English is only used when the whole document is
        translated.
      </Sheet.Description>
    </Sheet.Header>

    <div class="flex border-b px-6">
      <ContentLangTabs lang={contentLang} {enMissing} />
    </div>

    {#if editing}
      <div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
        {#if error}
          <p class="rounded-md bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        {/if}

        <div class="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <TranslatedInput
            label="Title"
            bind:value={editing.title}
            error={fields['translations.it.title']}
            placeholder="Condizioni di noleggio"
          />
          <div>
            <Label class="mb-1.5" for="terms-code">Code</Label>
            <Input
              id="terms-code"
              bind:value={editing.code}
              placeholder="rental-terms"
              class="font-mono"
              aria-invalid={fields.code ? 'true' : undefined}
            />
            {#if fields.code}
              <p class="mt-1 text-xs text-destructive" role="alert">{fields.code}</p>
            {/if}
          </div>
        </div>

        <TranslatedInput
          label="Slug"
          bind:value={editing.slug}
          error={fields['translations.it.slug']}
          placeholder="condizioni-di-noleggio"
          hint="The URL segment on the storefront."
        />

        <TranslatedInput
          label="Body"
          bind:value={editing.body}
          error={fields['translations.it.body']}
          multiline
          rows={18}
          placeholder="The full text of the document."
        />
      </div>
    {/if}

    <Sheet.Footer class="flex-row items-center justify-between border-t bg-muted/50">
      <Button variant="ghost" disabled={saving} onclick={() => (editing = null)}>Cancel</Button>
      <Button disabled={saving} onclick={save}>
        {#if saving}<Spinner />{/if}
        {saving ? 'Saving…' : editing?.id ? 'Save changes' : 'Create document'}
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
      <AlertDialog.Title>Delete this document?</AlertDialog.Title>
      <AlertDialog.Description>
        "{deleting ? titleOf(deleting) : ''}" is removed. Products linking to it lose the link, and
        rental products may no longer be publishable.
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
        {deleteBusy ? 'Deleting…' : 'Delete document'}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
