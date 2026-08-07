<script lang="ts">
  import { P } from '@mia/permissions';
  import type { InferResponseType } from 'hono/client';

  import { api } from '~/lib/api';
  import PermissionGate from '~/lib/components/PermissionGate.svelte';
  import TranslatedInput from '~/lib/components/TranslatedInput.svelte';
  import TranslatedTextarea from '~/lib/components/TranslatedTextarea.svelte';
  import { editorLang } from '~/lib/editor-lang.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { session } from '~/lib/session.svelte';

  type Terms = InferResponseType<typeof api.api.admin.terms.$get, 200>['data'][number];
  type Localized = { it: string; en?: string | undefined };

  interface TermsEdit {
    id?: string | undefined;
    code: string;
    title: Localized;
    body: Localized;
    slug: Localized;
  }

  let documents = $state<Terms[]>([]);
  let editing = $state<TermsEdit | null>(null);
  let loading = $state(true);
  let saving = $state(false);
  let error = $state<string | null>(null);
  let fields = $state<Record<string, string>>({});

  async function load() {
    loading = true;
    try {
      documents = await unwrap<Terms[]>(await api.api.admin.terms.$get());
    } catch (err) {
      error = errorMessage(err);
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    void load();
  });

  function startEdit(doc?: Terms) {
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

  function translationsPayload(edit: TermsEdit) {
    const forLang = (lang: 'it' | 'en') => {
      const pick = (value: Localized) => (lang === 'it' ? value.it : (value.en ?? ''));
      const t = { title: pick(edit.title).trim(), body: pick(edit.body).trim(), slug: pick(edit.slug).trim() };
      if (lang === 'en' && (!t.title || !t.body || !t.slug)) return undefined;
      return t;
    };
    const en = forLang('en');
    return { it: forLang('it')!, ...(en ? { en } : {}) };
  }

  async function save() {
    if (!editing) return;
    saving = true;
    error = null;
    fields = {};
    try {
      const json = { code: editing.code, translations: translationsPayload(editing) };
      if (editing.id) {
        await unwrap(
          await api.api.admin.terms[':id'].$patch({ param: { id: editing.id }, json }),
        );
      } else {
        await unwrap(await api.api.admin.terms.$post({ json }));
      }
      editing = null;
      await load();
    } catch (err) {
      error = errorMessage(err);
      fields = errorFields(err);
    } finally {
      saving = false;
    }
  }

  async function setStatus(doc: Terms, status: 'draft' | 'published' | 'archived') {
    error = null;
    try {
      await unwrap(
        await api.api.admin.terms[':id'].status.$post({
          param: { id: doc.id },
          json: { status },
        }),
      );
      await load();
    } catch (err) {
      error = errorMessage(err);
    }
  }

  async function remove(doc: Terms) {
    if (!confirm(`Delete "${doc.translations.it?.title ?? doc.code}"?`)) return;
    error = null;
    try {
      await unwrap(await api.api.admin.terms[':id'].$delete({ param: { id: doc.id } }));
      await load();
    } catch (err) {
      error = errorMessage(err);
    }
  }
</script>

<PermissionGate permission={P.TERMS_READ}>
  <div class="flex items-center justify-between gap-4">
    <h1 class="text-2xl font-semibold tracking-tight">Terms &amp; conditions</h1>
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-1 rounded-lg border border-neutral-300 p-1 dark:border-neutral-700">
        {#each ['it', 'en'] as const as lang (lang)}
          <button
            type="button"
            class="rounded-md px-2 py-1 text-xs font-semibold uppercase transition"
            class:bg-brand-600={editorLang.current === lang}
            class:text-white={editorLang.current === lang}
            onclick={() => editorLang.set(lang)}
          >
            {lang}
          </button>
        {/each}
      </div>
      {#if session.can(P.TERMS_CREATE)}
        <button
          type="button"
          onclick={() => startEdit()}
          class="bg-brand-600 hover:bg-brand-700 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
        >
          New document
        </button>
      {/if}
    </div>
  </div>

  {#if error && !editing}
    <p class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>
  {/if}

  {#if editing}
    <form
      class="mt-6 flex max-w-3xl flex-col gap-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
      onsubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <label class="block text-sm">
        <span class="mb-1 block font-medium">Code</span>
        <input
          type="text"
          bind:value={editing.code}
          required
          class="w-60 rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        {#if fields['code']}<span class="text-xs text-red-600">{fields['code']}</span>{/if}
      </label>

      <TranslatedInput label="Title" bind:value={editing.title} error={fields['translations.it.title']} />
      <TranslatedInput label="Slug" bind:value={editing.slug} error={fields['translations.it.slug']} />
      <TranslatedTextarea label="Body" bind:value={editing.body} rows={14} required />

      {#if error}
        <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>
      {/if}

      <div class="flex justify-end gap-2">
        <button
          type="button"
          onclick={() => (editing = null)}
          class="rounded-lg border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          class="bg-brand-600 hover:bg-brand-700 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save document'}
        </button>
      </div>
    </form>
  {/if}

  {#if loading}
    <p class="mt-6 text-sm text-neutral-500">Loading…</p>
  {:else}
    <div class="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <table class="w-full text-sm">
        <thead class="bg-neutral-50 text-left dark:bg-neutral-800/50">
          <tr>
            <th class="px-4 py-3 font-medium">Title</th>
            <th class="px-4 py-3 font-medium">Code</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium">Version</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {#each documents as doc (doc.id)}
            <tr class="border-t border-neutral-100 dark:border-neutral-800">
              <td class="px-4 py-3 font-medium">{doc.translations.it?.title ?? doc.code}</td>
              <td class="px-4 py-3 font-mono text-xs text-neutral-500">{doc.code}</td>
              <td
                class="px-4 py-3"
                class:text-green-600={doc.status === 'published'}
                class:text-amber-600={doc.status === 'draft'}
                class:text-neutral-400={doc.status === 'archived'}
              >
                {doc.status}
              </td>
              <td class="px-4 py-3 text-neutral-500">v{doc.version}</td>
              <td class="px-4 py-3 text-right text-xs">
                {#if session.can(P.TERMS_UPDATE)}
                  <button type="button" class="text-brand-600 hover:underline" onclick={() => startEdit(doc)}>Edit</button>
                {/if}
                {#if session.can(P.TERMS_PUBLISH)}
                  {#if doc.status !== 'published'}
                    <button type="button" class="ml-2 text-green-600 hover:underline" onclick={() => void setStatus(doc, 'published')}>
                      Publish
                    </button>
                  {:else}
                    <button type="button" class="ml-2 text-neutral-500 hover:underline" onclick={() => void setStatus(doc, 'archived')}>
                      Archive
                    </button>
                  {/if}
                {/if}
                {#if session.can(P.TERMS_DELETE)}
                  <button type="button" class="ml-2 text-red-600 hover:underline" onclick={() => void remove(doc)}>Delete</button>
                {/if}
              </td>
            </tr>
          {:else}
            <tr><td class="px-4 py-8 text-center text-neutral-500" colspan="5">No documents yet.</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</PermissionGate>
