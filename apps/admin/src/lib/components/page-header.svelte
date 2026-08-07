<!--
  The band at the top of every screen. Having one component rather than one
  copy of the markup per page is what keeps the eyebrow, the title size and
  the action alignment from drifting apart across twenty screens.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** The section this page belongs to — matches the sidebar group. */
    eyebrow?: string;
    title: string;
    description?: string;
    /** Primary actions, right-aligned; wraps below the title on small screens. */
    actions?: Snippet;
  }

  let { eyebrow, title, description, actions }: Props = $props();
</script>

<div class="admin-page-header">
  <div>
    {#if eyebrow}<p class="admin-page-eyebrow">{eyebrow}</p>{/if}
    <h1 class="admin-page-title">{title}</h1>
    {#if description}<p class="admin-page-description">{description}</p>{/if}
  </div>

  {#if actions}
    <div class="flex shrink-0 items-center gap-2">{@render actions()}</div>
  {/if}
</div>
