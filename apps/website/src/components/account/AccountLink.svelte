<!--
  An internal link the router claims.

  Always a REAL anchor with a working href: middle-click, ⌘-click and "copy
  link address" are not ours to take away, and `intercept` yields to every one
  of them. It only claims the plain left click the browser would otherwise
  turn into a document load.

  `data-astro-prefetch="false"` because astro.config.ts sets `prefetchAll` with
  a viewport strategy and Astro's MutationObserver picks up links an island
  renders. Left on, every order card in view would trigger a full SSR fetch of
  a private, no-store document that the intercept then throws away.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  import { accountContext } from '~/lib/account-context';
  import type { AccountScreen } from '~/lib/account-routes';

  interface Props {
    to: AccountScreen;
    class?: string;
    children: Snippet;
  }

  const { to, class: className = '', children }: Props = $props();

  const { router } = accountContext();
</script>

<a
  class={className}
  href={router.href(to)}
  data-astro-prefetch="false"
  onclick={(event) => router.intercept(event, to)}
>
  {@render children()}
</a>
