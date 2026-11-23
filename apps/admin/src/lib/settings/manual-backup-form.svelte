<!--
  Name field + "Back up now". The button is never disabled: a click on an empty or
  invalid name marks the field, says why under it and moves focus there.
-->
<script lang="ts">
  import { Input } from '$lib/components/ui/input/index.js';
  import { api } from '~/lib/api';
  import BusyButton from '~/lib/components/busy-button.svelte';
  import { ApiError, unwrap } from '~/lib/request';
  import { t } from '~/lib/ui-text';
  import { BACKUP_NAME_PATTERN, type BackupRun } from './backup-types';

  let { onStarted }: { onStarted: (run: BackupRun) => void } = $props();

  let name = $state('');
  let busy = $state(false);
  let message = $state<string | null>(null);
  let input = $state<HTMLInputElement | null>(null);

  async function start() {
    const value = name.trim().toLowerCase();
    if (!BACKUP_NAME_PATTERN.test(value)) {
      message = t('settings.backupNameInvalid');
      input?.focus();
      return;
    }
    busy = true;
    message = null;
    try {
      const run = await unwrap<BackupRun>(
        await api.api.admin.backups.$post({ json: { name: value } }),
      );
      name = '';
      onStarted(run);
    } catch (error) {
      message = error instanceof ApiError ? error.message : t('settings.backupStartFailed');
    } finally {
      busy = false;
    }
  }
</script>

<div class="flex flex-wrap items-start gap-2">
  <div class="w-full max-w-xs">
    <Input
      bind:ref={input}
      bind:value={name}
      placeholder="before-price-update"
      aria-label={t('settings.backupNameLabel')}
      aria-invalid={message ? true : undefined}
      autocomplete="off"
      onkeydown={(event) => event.key === 'Enter' && void start()}
    />
    {#if message}
      <p class="mt-1.5 text-sm text-destructive">{message}</p>
    {/if}
  </div>
  <BusyButton {busy} busyLabel={t('settings.backupRunning')} onclick={start}>
    {t('settings.backupNow')}
  </BusyButton>
</div>
