<!--
  The backup log as folders: this server's folder > day > files, with the day's manual
  runs in a `manual` subfolder. Storage is untouched; the tree is built from
  `r2Key`. Open state is kept by path, so the 3 s polling refresh never
  collapses what the user opened.
-->
<script lang="ts">
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import FolderIcon from '@lucide/svelte/icons/folder';
  import FolderOpenIcon from '@lucide/svelte/icons/folder-open';

  import * as Collapsible from '$lib/components/ui/collapsible/index.js';
  import { t, tn } from '~/lib/ui-text';
  import BackupFileRow from './backup-file-row.svelte';
  import { buildBackupDays, type BackupRun } from './backup-types';

  let { runs, folder }: { runs: BackupRun[]; folder: string } = $props();

  const days = $derived(buildBackupDays(runs));
  let openState = $state<Record<string, boolean>>({});

  const isOpen = (path: string, fallback: boolean) => openState[path] ?? fallback;
  const formatSize = (bytes: number) => `${(bytes / 1_048_576).toFixed(1)} MB`;
</script>

<div class="space-y-1">
  {@render node(folder, true, folderHeader, folderBody)}
</div>

{#snippet folderHeader(open: boolean)}
  {@render label(open, folder, '', 'font-medium')}
{/snippet}

{#snippet folderBody()}
  {#each days as day, index (day.day)}
    {@const dayPath = `${folder}/${day.day}`}
    {@const fileCount = day.scheduled.length + day.manual.length}
    {@render node(dayPath, index === 0, dayHeader, dayBody)}
    {#snippet dayHeader(open: boolean)}
      {@render label(
        open,
        day.day,
        `${tn('settings.fileCount', fileCount)} · ${formatSize(day.totalBytes)}`,
        'font-medium',
      )}
    {/snippet}
    {#snippet dayBody(dayOpen: boolean)}
      {#each day.scheduled as run (run.id)}
        <div class="pl-6"><BackupFileRow {run} /></div>
      {/each}
      {#if day.manual.length > 0}
        {@const manualPath = `${dayPath}/manual`}
        {@render node(manualPath, dayOpen, manualHeader, manualBody)}
        {#snippet manualHeader(open: boolean)}
          {@render label(
            open,
            t('settings.manualFolder'),
            tn('settings.fileCount', day.manual.length),
            '',
          )}
        {/snippet}
        {#snippet manualBody()}
          {#each day.manual as run (run.id)}
            <div class="pl-6"><BackupFileRow {run} /></div>
          {/each}
        {/snippet}
      {/if}
    {/snippet}
  {/each}
{/snippet}

{#snippet node(
  path: string,
  fallback: boolean,
  header: import('svelte').Snippet<[boolean]>,
  body: import('svelte').Snippet<[boolean]>,
)}
  {@const open = isOpen(path, fallback)}
  <Collapsible.Root {open} onOpenChange={(value) => (openState[path] = value)}>
    <Collapsible.Trigger
      class="flex w-full items-center rounded-md px-1 py-1.5 text-left text-sm hover:bg-accent/50"
      aria-expanded={open}
    >
      {@render header(open)}
    </Collapsible.Trigger>
    <Collapsible.Content>
      <div class="ml-3 border-l border-border pl-3">{@render body(open)}</div>
    </Collapsible.Content>
  </Collapsible.Root>
{/snippet}

{#snippet label(open: boolean, name: string, meta: string, nameClass: string)}
  <ChevronRightIcon class={['size-4 shrink-0 transition-transform', open && 'rotate-90']} />
  {#if open}
    <FolderOpenIcon class="mr-2 ml-1 size-4 shrink-0 text-muted-foreground" />
  {:else}
    <FolderIcon class="mr-2 ml-1 size-4 shrink-0 text-muted-foreground" />
  {/if}
  <span class={nameClass}>{name}</span>
  {#if meta}<span class="ml-3 text-muted-foreground">{meta}</span>{/if}
{/snippet}
