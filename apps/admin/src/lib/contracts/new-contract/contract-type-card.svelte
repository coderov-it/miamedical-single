<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import { variantLabel } from '~/lib/contracts/status';
  import { t } from '~/lib/ui-text';
  import type { ContractForm } from './contract-form.svelte';

  let { form }: { form: ContractForm } = $props();
</script>

<!-- Contract type -->
<Card.Root class="gap-0 py-0">
  <div class="border-b px-4 py-2.5 text-sm font-medium">
    {t('contracts.typeCardTitle')}
  </div>
  <div class="space-y-3 p-4">
    <label class="flex items-start gap-2.5">
      <Checkbox bind:checked={form.hasDepositProduct} class="mt-0.5" />
      <span class="text-sm">
        {t('contracts.depositToggle')}
        <span class="block text-xs text-muted-foreground">
          {t('contracts.depositHint')}
        </span>
      </span>
    </label>
    <div class="rounded-md bg-muted px-3 py-2 text-sm">
      {t('contracts.willIssue')}
      <span class="font-medium">{variantLabel(form.previewVariant)}</span>
      <span class="block text-xs text-muted-foreground">
        {t('contracts.issueSummary', {
          language: t(
            form.customerType === 'tourist'
              ? 'contracts.issueLanguageEnglish'
              : 'contracts.issueLanguageItalian',
          ),
          deposit: t(
            form.hasDepositProduct ? 'contracts.issueDepositClause' : 'contracts.issueNoDeposit',
          ),
        })}
      </span>
    </div>
  </div>
</Card.Root>
