<!-- One backup file: name, time, size, status, R2 mark and download. Columns are fixed so rows align. -->
<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
  import CircleXIcon from '@lucide/svelte/icons/circle-x';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import FileArchiveIcon from '@lucide/svelte/icons/file-archive';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import * as Tooltip from '$lib/components/ui/tooltip/index.js';
  import { t } from '~/lib/ui-text';
  import { displayState, type BackupRun } from './backup-types';
  import { downloadBackup } from './download-backup';

  let { run }: { run: BackupRun } = $props();

  const BLUE = 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
  const GREEN =
    'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
  const AMBER =
    'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';

  let downloading = $state(false);

  const phase = $derived(displayState(run));
  const inFlightKey = $derived(phase === 'dumping' ? 'statusRunning' : 'statusUploading');
  const time = $derived(`${run.startedAt.slice(11, 16)} UTC`);
  const size = $derived(
    run.sizeBytes === null ? '—' : `${(run.sizeBytes / 1_048_576).toFixed(1)} MB`,
  );

  async function download() {
    if (downloading) return;
    downloading = true;
    await downloadBackup(run);
    downloading = false;
  }
</script>

<!-- Fixed widths on every column after the name, so rows line up across tree depths. -->
<div
  class="grid grid-cols-[minmax(0,1fr)_5.5rem_4rem_6rem_1rem_2.25rem] items-center gap-4 py-1 text-sm"
>
  <span class="flex min-w-0 items-center gap-2">
    <FileArchiveIcon class="size-4 shrink-0 text-muted-foreground" />
    <span class="truncate font-mono text-xs" title={run.fileName}>{run.fileName}</span>
  </span>
  <span class="text-right whitespace-nowrap text-muted-foreground">{time}</span>
  <span class="w-16 text-right whitespace-nowrap">{size}</span>
  {#if run.error}
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <span {...props}>{@render status()}</span>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content class="max-w-sm break-words">{run.error}</Tooltip.Content>
    </Tooltip.Root>
  {:else}
    {@render status()}
  {/if}
  <span class="w-4">
    {#if run.uploadedAt}
      <CheckIcon class="size-4" />
      <span class="sr-only">{t('settings.inBucket')}</span>
    {:else}
      —
    {/if}
  </span>
  <span class="w-9">
    {#if run.downloadable}
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('settings.download')}
        aria-busy={downloading}
        onclick={download}
      >
        {#if downloading}
          <Spinner class="size-4" />
        {:else}
          <DownloadIcon class="size-4" />
        {/if}
      </Button>
    {/if}
  </span>
</div>

{#snippet status()}
  {#if phase === 'dumping' || phase === 'uploading'}
    <Badge variant="secondary" class={BLUE}>
      <Spinner class="size-3" />{t(`settings.${inFlightKey}`)}
    </Badge>
  {:else if phase === 'done'}
    <Badge variant="secondary" class={GREEN}>
      <CircleCheckIcon class="size-3" />{t('settings.statusSucceeded')}
    </Badge>
  {:else if phase === 'notInBucket'}
    <Badge variant="secondary" class={AMBER}>
      <TriangleAlertIcon class="size-3" />{t('settings.statusNotInBucket')}
    </Badge>
  {:else}
    <Badge variant="destructive"><CircleXIcon class="size-3" />{t('settings.statusFailed')}</Badge>
  {/if}
{/snippet}
