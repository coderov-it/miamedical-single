<script lang="ts">
  import { P } from '@mia/permissions';

  import Forbidden from '~/lib/Forbidden.svelte';
  import { session } from '~/lib/session.svelte';

  const stats = [
    { label: 'Revenue (30d)', value: '—' },
    { label: 'Orders (30d)', value: '—' },
    { label: 'Active products', value: '—' },
    { label: 'Low stock', value: '—' },
  ];
</script>

{#if !session.can(P.DASHBOARD_READ)}
  <Forbidden />
{:else}
  <h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>

  <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {#each stats as stat (stat.label)}
      <div
        class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div class="text-sm text-neutral-500">{stat.label}</div>
        <div class="mt-2 text-2xl font-semibold">{stat.value}</div>
      </div>
    {/each}
  </div>

  <p class="mt-8 text-sm text-neutral-500">
    Wire these up to <code>/api/reports</code> once the reporting routes exist.
  </p>
{/if}
