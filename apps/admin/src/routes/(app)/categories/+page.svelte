<script lang="ts">
  import { P } from '@mia/permissions';
  import type { InferResponseType } from 'hono/client';

  import { api } from '~/lib/api';
  import PermissionGate from '~/lib/components/PermissionGate.svelte';
  import { errorFields, errorMessage, unwrap } from '~/lib/request';
  import { session } from '~/lib/session.svelte';

  type Category = InferResponseType<typeof api.api.admin.categories.$get, 200>['data'][number];

  let categories = $state<Category[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Inline create form.
  let showCreate = $state(false);
  let code = $state('');
  let nameIt = $state('');
  let slugIt = $state('');
  let creating = $state(false);
  let createError = $state<string | null>(null);
  let createFields = $state<Record<string, string>>({});

  async function load() {
    loading = true;
    error = null;
    try {
      categories = await unwrap<Category[]>(await api.api.admin.categories.$get());
    } catch (err) {
      error = errorMessage(err);
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    void load();
  });

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replaceAll(/[̀-ͯ]/g, '')
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replaceAll(/^-+|-+$/g, '');

  async function create() {
    creating = true;
    createError = null;
    createFields = {};
    try {
      await unwrap(
        await api.api.admin.categories.$post({
          json: {
            code: code || slugify(nameIt),
            translations: { it: { name: nameIt, slug: slugIt || slugify(nameIt) } },
          },
        }),
      );
      showCreate = false;
      code = '';
      nameIt = '';
      slugIt = '';
      await load();
    } catch (err) {
      createError = errorMessage(err);
      createFields = errorFields(err);
    } finally {
      creating = false;
    }
  }
</script>

<PermissionGate permission={P.CATEGORY_READ}>
  <div class="flex items-center justify-between gap-4">
    <h1 class="text-2xl font-semibold tracking-tight">Categories</h1>
    {#if session.can(P.CATEGORY_CREATE)}
      <button
        type="button"
        onclick={() => (showCreate = !showCreate)}
        class="bg-brand-600 hover:bg-brand-700 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
      >
        New category
      </button>
    {/if}
  </div>

  {#if showCreate}
    <form
      class="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
      onsubmit={(event) => {
        event.preventDefault();
        void create();
      }}
    >
      <label class="block text-sm">
        <span class="mb-1 block font-medium">Name (Italian)</span>
        <input type="text" bind:value={nameIt} required class="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900" />
      </label>
      <label class="block text-sm">
        <span class="mb-1 block font-medium">Code</span>
        <input type="text" bind:value={code} placeholder={slugify(nameIt) || 'auto'} class="rounded-lg border border-neutral-300 px-3 py-2 font-mono dark:border-neutral-700 dark:bg-neutral-900" />
      </label>
      <label class="block text-sm">
        <span class="mb-1 block font-medium">Slug (IT)</span>
        <input type="text" bind:value={slugIt} placeholder={slugify(nameIt) || 'auto'} class="rounded-lg border border-neutral-300 px-3 py-2 font-mono dark:border-neutral-700 dark:bg-neutral-900" />
      </label>
      <button type="submit" disabled={creating} class="bg-brand-600 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
        {creating ? 'Creating…' : 'Create'}
      </button>
      {#if createError}
        <p class="w-full text-sm text-red-600" role="alert">
          {createError}
          {#each Object.entries(createFields) as [path, message] (path)}
            <span class="block text-xs">{path}: {message}</span>
          {/each}
        </p>
      {/if}
    </form>
  {/if}

  {#if error}
    <p class="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</p>
  {:else if loading}
    <p class="mt-6 text-sm text-neutral-500">Loading…</p>
  {:else}
    <div class="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <table class="w-full text-sm">
        <thead class="bg-neutral-50 text-left dark:bg-neutral-800/50">
          <tr>
            <th class="px-4 py-3 font-medium">Name</th>
            <th class="px-4 py-3 font-medium">Code</th>
            <th class="px-4 py-3 font-medium">Specs</th>
            <th class="px-4 py-3 font-medium">EN</th>
            <th class="px-4 py-3 font-medium">Active</th>
          </tr>
        </thead>
        <tbody>
          {#each categories as category (category.id)}
            <tr class="border-t border-neutral-100 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/40">
              <td class="px-4 py-3 font-medium">
                <a href={`/categories/${category.id}`} class="hover:underline">
                  {category.translations.it?.name ?? category.code}
                </a>
              </td>
              <td class="px-4 py-3 font-mono text-xs text-neutral-500">{category.code}</td>
              <td class="px-4 py-3 text-neutral-500">{category.specs.length}</td>
              <td class="px-4 py-3">
                {#if category.translations.en}
                  <span class="text-green-600">✓</span>
                {:else}
                  <span class="text-neutral-400">—</span>
                {/if}
              </td>
              <td class="px-4 py-3">{category.isActive ? '✓' : '—'}</td>
            </tr>
          {:else}
            <tr><td class="px-4 py-8 text-center text-neutral-500" colspan="5">No categories yet.</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</PermissionGate>
