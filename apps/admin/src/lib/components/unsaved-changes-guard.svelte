<!--
  Blocks navigation away from a page holding unsaved edits.

  `beforeNavigate` is synchronous, so it cannot await an answer: we cancel the
  navigation, ask, and re-issue it on Discard. `bypass` is a plain `let` rather
  than `$state` because the re-issued `goto` has to see the new value in the
  same tick, before any reactive update could land.

  Query-only changes on the same path are allowed through — `?tab=` and
  `?order=` are page state, not departures, and prompting for them would train
  people to dismiss the dialog without reading it.
-->
<script lang="ts">
  import { beforeNavigate, goto } from '$app/navigation';

  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import type { DirtyState } from '~/lib/dirty.svelte';

  interface Props {
    dirty: DirtyState;
    /** Names the sections at risk, e.g. `(section) => TAB_LABELS[section]`. */
    label?: (section: string) => string;
  }

  let { dirty, label }: Props = $props();

  let pending = $state<URL | null>(null);
  let bypass = false;

  const at = $derived(
    dirty.sections.map((section) => label?.(section) ?? section).join(', ') || 'this page',
  );

  beforeNavigate((navigation) => {
    if (bypass || !dirty.any) return;

    // Closing the tab or a hard reload: we cannot render anything in time, so
    // hand off to the browser's own prompt, which is what `cancel()` triggers.
    if (navigation.type === 'leave') {
      navigation.cancel();
      return;
    }

    if (!navigation.to) return;
    if (navigation.to.url.pathname === navigation.from?.url.pathname) return;

    navigation.cancel();
    pending = navigation.to.url;
  });

  function discard() {
    const url = pending;
    pending = null;
    if (!url) return;

    bypass = true;
    dirty.clearAll();
    void goto(url).finally(() => {
      bypass = false;
    });
  }
</script>

<AlertDialog.Root
  open={pending !== null}
  onOpenChange={(open) => {
    if (!open) pending = null;
  }}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Leave with unsaved changes?</AlertDialog.Title>
      <AlertDialog.Description>
        You have unsaved changes in {at}. Leaving now discards them.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Stay on this page</AlertDialog.Cancel>
      <AlertDialog.Action onclick={discard}>Discard changes</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
