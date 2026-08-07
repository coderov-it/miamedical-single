<script lang="ts">
  import type { Snippet } from 'svelte';

  import Forbidden from './Forbidden.svelte';
  import { session } from '../session.svelte';

  /** Renders children only when the session holds the permission; 403 view otherwise. */
  let { permission, children }: { permission: number; children: Snippet } = $props();

  const allowed = $derived(session.can(permission));
</script>

{#if allowed}
  {@render children()}
{:else}
  <Forbidden />
{/if}
