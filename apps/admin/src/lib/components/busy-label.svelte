<!--
  A button's label while its request is in flight: a spinner in front, and
  optionally different words ("Saving…"). Small on purpose — the operator
  clicked this exact control, so the feedback belongs on it, not on the page.

  Use it directly inside controls that are not our Button (AlertDialog.Action);
  everywhere else reach for BusyButton, which also disables the click.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  import { Spinner } from '$lib/components/ui/spinner/index.js';

  interface Props {
    busy: boolean;
    /** Words to show while busy. Pass it when the idle label has a leading icon — the spinner replaces both. */
    label?: string;
    children?: Snippet;
  }

  let { busy, label, children }: Props = $props();
</script>

{#if busy}
  <Spinner />
  {#if label}{label}{:else}{@render children?.()}{/if}
{:else}
  {@render children?.()}
{/if}
