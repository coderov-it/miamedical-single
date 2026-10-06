<!--
  Button that knows it is waiting on a request: `aria-busy` for assistive tech,
  the label handed to BusyLabel, and a guard against a double submit.
  Replaces the `disabled={saving}` + `{#if saving}<Spinner />{/if}` +
  `{saving ? 'Saving…' : …}` triple every form used to spell out.

  NEVER `disabled` while busy. Disabling the focused button blurs it, so focus
  fell to <body> and a keyboard user was dropped at the top of the page after
  every request — a failed sign-in most of all. The button stays focusable and
  a click (or Enter in the form) while busy is swallowed instead: the visible
  "Saving…" label and `aria-busy` already say why nothing happens.
-->
<script lang="ts">
  import { Button, type ButtonProps } from '$lib/components/ui/button/index.js';
  import BusyLabel from '~/lib/components/busy-label.svelte';

  let {
    busy = false,
    busyLabel,
    onclick,
    children,
    ...rest
  }: ButtonProps & { busy?: boolean; busyLabel?: string } = $props();

  /* `preventDefault` also cancels the form submission a submit button's click
     would start, including the implicit one from Enter in a field. */
  type Handler = (this: EventTarget, event: MouseEvent) => void;
  function guard(event: MouseEvent & { currentTarget: EventTarget & HTMLElement }) {
    if (busy) {
      event.preventDefault();
      return;
    }
    (onclick as Handler | null | undefined)?.call(event.currentTarget, event);
  }
</script>

<Button {...rest} aria-busy={busy} aria-disabled={busy || undefined} onclick={guard}>
  <BusyLabel {busy} label={busyLabel}>{@render children?.()}</BusyLabel>
</Button>
