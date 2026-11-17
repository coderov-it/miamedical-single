<!-- The signing link is emailed to the customer as soon as the contract is created,
  the same flow an order-generated contract follows. -->
<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js';
  import BusyButton from '~/lib/components/busy-button.svelte';
  import { t } from '~/lib/ui-text';
  import type { ContractForm } from './contract-form.svelte';

  let { form }: { form: ContractForm } = $props();
</script>

<!-- Create -->
<Card.Root class="gap-0 py-0">
  <div class="space-y-3 p-4">
    <BusyButton
      class="w-full"
      busy={form.busy}
      disabled={!form.formValid}
      onclick={() => form.create()}
    >
      {t('contracts.createAndSend')}
    </BusyButton>
    <p class="text-xs text-muted-foreground">
      {t('contracts.createHint')}
    </p>
  </div>
</Card.Root>
