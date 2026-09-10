<!--
  One gated field's error message.

  ⚠️ `hidden` IS A LITERAL AND MUST STAY ONE. The form gate
  (lib/form-validation.ts, reached through `use:formGate`) owns `hidden` and
  `id` on this element and `aria-invalid` / `aria-describedby` on the controls
  beside it. Svelte only re-asserts attributes it renders reactively, so a
  literal leaves the gate as the sole writer — but give `hidden` an expression,
  or wrap this in `{#if}`, and there are two writers: the message flickers, or
  never appears, and nothing type-checks it.

  The element has to EXIST while hidden. `enforce()` looks it up by
  `[data-field-error]`; with nothing to find it still blocks the customer and
  simply cannot say why, which is the failure the gate exists to prevent.

  Class string matches components/checkout/CheckoutField.astro, so an error
  here looks like an error there.
-->
<script lang="ts">
  interface Props {
    /** Matches the `data-gate` of the block this sits in. */
    key: string;
    message: string;
  }

  const { key, message }: Props = $props();
</script>

<p
  class="text-danger m-0 flex items-start gap-1.5 text-[13px] font-medium before:flex-none before:not-italic before:content-['⚠']"
  data-field-error={key}
  hidden
>
  {message}
</p>
