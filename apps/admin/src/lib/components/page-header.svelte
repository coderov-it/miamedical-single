<!--
  The band at the top of every screen. Having one component rather than one
  copy of the markup per page is what keeps the eyebrow, the title size and
  the action alignment from drifting apart across twenty screens.

  Side by side only when the *content column* has room (a container query, not
  a viewport breakpoint — the sidebar eats 256px the viewport cannot see).
  Narrower, the actions drop below the title and wrap instead of running off
  the edge.
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

<div class="@container">
  <div class="admin-page-header">
    <div class="min-w-0">
      {#if eyebrow}<p class="admin-page-eyebrow">{eyebrow}</p>{/if}
      <h1 class="admin-page-title">{title}</h1>
      {#if description}<p class="admin-page-description">{description}</p>{/if}
    </div>

    {#if actions}
      <div class="flex flex-wrap items-center gap-2 @3xl:shrink-0 @3xl:justify-end">
        {@render actions()}
      </div>
    {/if}
  </div>
</div>
