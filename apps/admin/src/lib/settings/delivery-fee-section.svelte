<!--
  Settings -> General -> "Consegna": the fallback home-delivery fee, used for every
  product without its own. Empty = none, so such a delivery stays "to agree".
  docs/code/delivery-fee.md.
-->
<script lang="ts">
  import TruckIcon from '@lucide/svelte/icons/truck';
  import { P } from '@mia/permissions';

  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { api } from '~/lib/api';
  import BusyButton from '~/lib/components/busy-button.svelte';
  import MoneyInput from '~/lib/components/money-input.svelte';
  import { ApiError, errorFields, unwrap } from '~/lib/request';
  import { session } from '~/lib/session.svelte';
  import { t } from '~/lib/ui-text';
  import SettingsSection from './settings-section.svelte';

  interface DeliveryFeeSettings {
    fallback: string | null;
  }

  let fallback = $state('');
  let loading = $state(true);
  let saving = $state(false);
  let fieldError = $state<string | undefined>(undefined);
  let feedback = $state<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const canEdit = $derived(session.can(P.SETTING_UPDATE));

  async function load() {
    loading = true;
    try {
      const data = await unwrap<DeliveryFeeSettings>(await api.api.admin.settings.delivery.$get());
      fallback = data.fallback ?? '';
    } catch (error) {
      feedback = {
        tone: 'error',
        text: error instanceof ApiError ? error.message : t('settings.loadFailed'),
      };
    } finally {
      loading = false;
    }
  }

  async function save() {
    saving = true;
    feedback = null;
    fieldError = undefined;
    try {
      const data = await unwrap<DeliveryFeeSettings>(
        await api.api.admin.settings.delivery.$put({
          json: { fallback: fallback.trim() ? fallback : null },
        }),
      );
      fallback = data.fallback ?? '';
      feedback = { tone: 'ok', text: t('settings.deliverySaved') };
    } catch (error) {
      fieldError = errorFields(error).fallback;
      feedback = {
        tone: 'error',
        text: error instanceof ApiError ? error.message : t('settings.saveFailed'),
      };
    } finally {
      saving = false;
    }
  }

  void load();
</script>

<SettingsSection
  icon={TruckIcon}
  title={t('settings.deliveryTitle')}
  description={t('settings.deliveryDescription')}
>
  {#if loading}
    <Skeleton class="h-10 w-full max-w-xs" />
  {:else}
    <MoneyInput
      label={t('settings.deliveryFallback')}
      bind:value={fallback}
      error={fieldError}
      suffix="EUR"
      disabled={!canEdit || saving}
      optional
    />

    {#if feedback}
      <p
        class="mt-3 text-sm {feedback.tone === 'error'
          ? 'text-destructive'
          : 'text-muted-foreground'}"
      >
        {feedback.text}
      </p>
    {/if}

    <div class="mt-4">
      {#if canEdit}
        <BusyButton busy={saving} busyLabel={t('common.saving')} onclick={save}>
          {t('common.save')}
        </BusyButton>
      {:else}
        <p class="text-sm text-muted-foreground">{t('settings.readOnly')}</p>
      {/if}
    </div>
  {/if}
</SettingsSection>
