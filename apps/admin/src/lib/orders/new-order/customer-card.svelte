<!--
  The customer as the order will carry them: the account's loaded details, or what
  was typed. `onChange` shows the "Change" action on step 3; the review passes none.
-->
<script lang="ts">
  import MailIcon from '@lucide/svelte/icons/mail';
  import MapPinIcon from '@lucide/svelte/icons/map-pin';
  import PhoneIcon from '@lucide/svelte/icons/phone';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { t } from '~/lib/ui-text';
  import type { OrderForm } from './order-form.svelte';
  import { CUSTOMER_TYPES } from './types';

  interface Props {
    form: OrderForm;
    onChange?: () => void;
  }

  let { form, onChange }: Props = $props();

  const name = $derived(`${form.firstName} ${form.lastName}`.trim());
  const typeKey = $derived(
    CUSTOMER_TYPES.find((type) => type.value === form.customerType)?.labelKey,
  );
  const address = $derived(form.picked?.prefill?.address ?? '');
  const codes = $derived(
    [
      form.codiceFiscale && `${t('newOrder.fieldCodiceFiscale')} ${form.codiceFiscale}`,
      form.partitaIva && `${t('newOrder.fieldPartitaIva')} ${form.partitaIva}`,
    ].filter(Boolean),
  );
</script>

<div class="flex items-start gap-3 rounded-xl border bg-card p-4">
  <span
    class="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-base font-semibold text-primary"
  >
    {(name || form.email).slice(0, 1).toUpperCase()}
  </span>
  <div class="min-w-0 flex-1 space-y-1.5 text-sm">
    <div class="flex flex-wrap items-center gap-2">
      <span class="font-medium">{name || form.email}</span>
      {#if typeKey}<Badge variant="secondary">{t(typeKey)}</Badge>{/if}
      {#if form.accountId}<Badge variant="outline">{t('newOrder.existingAccount')}</Badge>{/if}
    </div>
    <p class="flex items-center gap-1.5 text-muted-foreground">
      <MailIcon class="size-3.5 shrink-0" />
      <span class="truncate">{form.email}</span>
    </p>
    {#if form.phone}
      <p class="flex items-center gap-1.5 text-muted-foreground">
        <PhoneIcon class="size-3.5 shrink-0" />{form.phone}
      </p>
    {/if}
    {#if codes.length > 0}
      <p class="text-xs text-muted-foreground">{codes.join(' · ')}</p>
    {/if}
    {#if address}
      <p class="flex items-start gap-1.5 text-muted-foreground">
        <MapPinIcon class="mt-0.5 size-3.5 shrink-0" />{address}
      </p>
    {/if}
  </div>
  {#if onChange}
    <Button variant="outline" size="sm" onclick={onChange}>{t('newOrder.changeCustomer')}</Button>
  {/if}
</div>
