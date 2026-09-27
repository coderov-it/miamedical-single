<!--
  Button that knows it is waiting on a request: disabled against a double
  submit, `aria-busy` for assistive tech, and the label handed to BusyLabel.
  Replaces the `disabled={saving}` + `{#if saving}<Spinner />{/if}` +
  `{saving ? 'Saving…' : …}` triple every form used to spell out.
-->
<script lang="ts">
  import { Button, type ButtonProps } from '$lib/components/ui/button/index.js';
  import BusyLabel from '~/lib/components/busy-label.svelte';

  let {
    busy = false,
    busyLabel,
    disabled,
    children,
    ...rest
  }: ButtonProps & { busy?: boolean; busyLabel?: string } = $props();
</script>

<Button {...rest} disabled={disabled || busy} aria-busy={busy}>
  <BusyLabel {busy} label={busyLabel}>{@render children?.()}</BusyLabel>
</Button>
