<!--
  The trail above a screen. The last crumb is where you are, so it is text
  rather than a link, and the root screen has no trail at all — the shell
  renders nothing rather than a trail of one.

  Restyled from the island's first pass: it was `text-sm text-neutral-500`, a
  palette the rest of the storefront does not have. It now reads in the
  editorial theme's secondary ink, at the size the site's own breadcrumbs use.
-->
<script lang="ts">
  import { accountContext, say } from '~/lib/account-context';

  import AccountLink from './AccountLink.svelte';
  import type { Crumb } from './titles';

  interface Props {
    trail: Crumb[];
  }

  const { trail }: Props = $props();

  const { copy } = accountContext();
</script>

<nav class="text-ink-2 mb-2 text-[14px]" aria-label={say(copy, 'breadcrumbs.label')}>
  <ol class="flex flex-wrap items-center gap-2">
    {#each trail as crumb, index (crumb.label)}
      <li class="flex items-center gap-2">
        {#if index > 0}
          <span class="text-ink-decorative" aria-hidden="true">›</span>
        {/if}
        {#if crumb.to}
          <AccountLink to={crumb.to} class="no-underline hover:text-accent hover:underline">
            {crumb.label}
          </AccountLink>
        {:else}
          <span aria-current="page">{crumb.label}</span>
        {/if}
      </li>
    {/each}
  </ol>
</nav>
