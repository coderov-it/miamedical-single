<!--
  The two-crumb trail above a screen. The last crumb is where you are, so it is
  text rather than a link.
-->
<script lang="ts">
  import type { AccountScreen } from '~/lib/account-routes';

  import AccountLink from './AccountLink.svelte';

  interface Crumb {
    label: string;
    /** Absent on the final crumb — you are already there. */
    to?: AccountScreen;
  }

  interface Props {
    trail: Crumb[];
  }

  const { trail }: Props = $props();
</script>

<nav class="mb-6 text-sm text-neutral-500">
  {#each trail as crumb, index (crumb.label)}
    {#if index > 0}<span class="mx-1.5">/</span>{/if}
    {#if crumb.to}
      <AccountLink to={crumb.to} class="underline">{crumb.label}</AccountLink>
    {:else}
      <span>{crumb.label}</span>
    {/if}
  {/each}
</nav>
