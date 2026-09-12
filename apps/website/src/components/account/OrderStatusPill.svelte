<!--
  One order's state, as a pill.

  The word comes from `copy.status`, which the server resolved from
  `account.status.<key>` — the storefront's softer wording, not the back
  office's ("In lavorazione", not "pending"). This component adds the tone and
  nothing else: a status that is spelled out does not need a colour to be
  understood, so the pill is decoration on top of a label, never the label.

  Colour is the SECOND channel here, which is why an unrecognised state falls
  through to the neutral pill rather than to an invented colour: the server can
  add a state before this file knows about it, and a new word in a grey pill
  reads correctly while a new word in the wrong colour does not.
-->
<script lang="ts">
  import { accountContext } from '~/lib/account-context';

  interface Props {
    status: string;
  }

  const { status }: Props = $props();

  const { copy } = accountContext();

  function tone(state: string): string {
    if (state === 'pending') return 'bg-accent-tint text-accent';
    if (state === 'paid' || state === 'fulfilled') return 'bg-ok/10 text-ok';
    if (state === 'cancelled') return 'bg-danger-tint text-danger';
    return 'bg-tint text-ink-2';
  }

  const label = $derived(copy.status[status] ?? status);
</script>

<span
  class="inline-flex items-center rounded-full px-3 py-1 text-[13px] font-semibold whitespace-nowrap {tone(
    status,
  )}"
>
  {label}
</span>
