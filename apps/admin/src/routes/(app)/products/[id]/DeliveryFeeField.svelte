<!--
  The product's own home-delivery fee. Empty = none, so the platform default from
  Settings applies. Shown for both pricing modes. docs/code/delivery-fee.md.
-->
<script lang="ts">
  import MoneyInput from '~/lib/components/money-input.svelte';
  import { t } from '~/lib/ui-text';

  interface Props {
    value: string;
    error?: string | undefined;
    currency: string;
  }

  let { value = $bindable(), error, currency }: Props = $props();
</script>

<MoneyInput
  label={t('products.deliveryFee')}
  hint={t('products.deliveryFeeHint')}
  bind:value
  {error}
  suffix={currency}
  optional
/>
