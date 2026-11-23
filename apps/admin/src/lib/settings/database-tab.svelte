<!--
  The Database tab: the next scheduled backup, the backup log, the manual backup form and downloads.
  While any run is dumping or uploading the log is refetched every 3 s; the
  interval is cleared when none is left and when the tab unmounts.
-->
<script lang="ts">
  import { P } from '@mia/permissions';
  import ClockIcon from '@lucide/svelte/icons/clock';

  import * as Card from '$lib/components/ui/card/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { api } from '~/lib/api';
  import { ApiError, unwrap } from '~/lib/request';
  import { session } from '~/lib/session.svelte';
  import { t } from '~/lib/ui-text';
  import BackupTree from './backup-tree.svelte';
  import { isInFlight, type BackupOverview, type BackupRun } from './backup-types';
  import ManualBackupForm from './manual-backup-form.svelte';
  import { formatUtc, minutesUntil, relativeUntil } from './next-backup';

  const POLL_MS = 3000;
  const IMMINENT_MINUTES = 10;

  const TONES = {
    blue: {
      box: 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40',
      chip: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
      title: 'text-blue-900 dark:text-blue-100',
      sub: 'text-blue-800/80 dark:text-blue-200/80',
    },
    amber: {
      box: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40',
      chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200',
      title: 'text-amber-900 dark:text-amber-100',
      sub: 'text-amber-800/80 dark:text-amber-200/80',
    },
  };

  let overview = $state<BackupOverview | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let now = $state(Date.now());

  const canCreate = $derived(session.can(P.BACKUP_CREATE));
  const anyInFlight = $derived(overview?.runs.some(isInFlight) ?? false);
  const scheduledInFlight = $derived(
    overview?.runs.some((run) => run.kind === 'scheduled' && isInFlight(run)) ?? false,
  );
  const imminent = $derived(
    overview?.nextScheduledAt
      ? minutesUntil(overview.nextScheduledAt, now) < IMMINENT_MINUTES
      : false,
  );
  const tone = $derived(imminent && !scheduledInFlight ? TONES.amber : TONES.blue);

  async function load() {
    try {
      overview = await unwrap<BackupOverview>(await api.api.admin.backups.$get());
      error = null;
    } catch (cause) {
      error = cause instanceof ApiError ? cause.message : t('settings.loadFailed');
    } finally {
      loading = false;
    }
  }

  function onStarted(run: BackupRun) {
    if (overview) overview = { ...overview, runs: [run, ...overview.runs] };
  }

  void load();

  $effect(() => {
    if (!anyInFlight) return;
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  });

  /* Refreshes the "Next backup in X min" text every 30 s; once the slot has passed, refetches for the new one. */
  $effect(() => {
    const timer = setInterval(() => {
      now = Date.now();
      const next = overview?.nextScheduledAt;
      if (next && new Date(next).getTime() <= now) void load();
    }, 30_000);
    return () => clearInterval(timer);
  });
</script>

<Card.Root class="gap-0 py-0">
  <div class="space-y-4 p-6">
    <div>
      <h2 class="text-base font-semibold">{t('settings.backupsTitle')}</h2>
      <p class="mt-1 text-sm text-muted-foreground">{t('settings.backupsDescription')}</p>
    </div>

    {#if loading}
      <Skeleton class="h-10 w-full" />
    {:else if error && !overview}
      <p class="text-sm text-destructive">{error}</p>
    {:else if overview}
      {#if !overview.enabled}
        <p class="text-sm text-muted-foreground">{t('settings.backupsOff')}</p>
      {:else}
        {#if overview.nextScheduledAt}
          <div class={['flex items-center gap-3 rounded-lg border p-4', tone.box]}>
            <span
              class={['flex size-8 shrink-0 items-center justify-center rounded-full', tone.chip]}
            >
              {#if scheduledInFlight}
                <Spinner class="size-4" />
              {:else}
                <ClockIcon class="size-4" />
              {/if}
            </span>
            <div>
              {#if scheduledInFlight}
                <p class={['text-base font-semibold', tone.title]}>
                  {t('settings.backupInProgress')}
                </p>
              {:else}
                <p class={['text-base font-semibold', tone.title]}>
                  {t('settings.nextBackupIn', {
                    when: relativeUntil(overview.nextScheduledAt, now),
                  })}
                </p>
                <p class={['text-sm', tone.sub]}>{formatUtc(overview.nextScheduledAt)}</p>
              {/if}
            </div>
          </div>
        {/if}
        {#if canCreate}<ManualBackupForm {onStarted} />{/if}
      {/if}

      {#if overview.runs.length === 0}
        {#if overview.enabled}
          <p class="text-sm text-muted-foreground">{t('settings.noBackups')}</p>
        {/if}
      {:else}
        <BackupTree runs={overview.runs} folder={overview.folder ?? ''} />
      {/if}
    {/if}
  </div>
</Card.Root>
