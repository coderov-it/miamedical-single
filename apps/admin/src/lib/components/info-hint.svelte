<!--
  The (i) beside a field label: click to read the rule behind a limit.

  A popover rather than a tooltip, for the same reason the reorder arrows have
  no tooltip (docs/code/admin-client-layer.md § Shared list chrome): hover text
  is unreachable on touch and vanishes while you read it. This opens on click,
  stays open, and closes on Escape or an outside click.

  It holds guidance the editor needs *once* — why 20 characters, why three
  chips read better than five. Anything they need on every keystroke belongs in
  the visible `hint` under the field instead.
-->
<script lang="ts">
  import InfoIcon from '@lucide/svelte/icons/info';
  import type { Snippet } from 'svelte';

  import * as Popover from '$lib/components/ui/popover/index.js';

  interface Props {
    /** Names what is being explained, for screen readers: "About chips". */
    label: string;
    children: Snippet;
  }

  let { label, children }: Props = $props();
</script>

<Popover.Root>
  <Popover.Trigger
    class="inline-flex size-4.5 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    aria-label={label}
  >
    <InfoIcon class="size-4" />
  </Popover.Trigger>
  <Popover.Content class="text-xs/relaxed text-muted-foreground" align="start">
    {@render children()}
  </Popover.Content>
</Popover.Root>
