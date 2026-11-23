<!--
  The page's two sections as large tabs. Arrow keys, Home and End move between
  them (selection follows focus); the count pill turns amber when the repair
  queue is not empty.
-->
<script lang="ts">
  import ClipboardCheckIcon from '@lucide/svelte/icons/clipboard-check';
  import WrenchIcon from '@lucide/svelte/icons/wrench';

  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { cn } from '$lib/utils.js';
  import type { ListStatus } from '~/lib/returns/list-status';
  import { t } from '~/lib/ui-text';

  export type ReturnsTab = 'pending' | 'attention';

  interface Props {
    tab: ReturnsTab;
    counts: Record<ReturnsTab, number>;
    /** Each tab follows its own list: a pill never shows 0 before that list has loaded. */
    status: Record<ReturnsTab, ListStatus>;
    onSelect: (tab: ReturnsTab) => void;
  }

  let { tab, counts, status, onSelect }: Props = $props();

  const TABS = [
    { value: 'pending', icon: ClipboardCheckIcon },
    { value: 'attention', icon: WrenchIcon },
  ] as const;

  let buttons = $state<HTMLButtonElement[]>([]);

  function move(event: KeyboardEvent, index: number) {
    const last = TABS.length - 1;
    const targets: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    const next = targets[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onSelect(TABS[next]!.value);
    buttons[next]?.focus();
  }
</script>

<div role="tablist" aria-label={t('returns.tabsLabel')} class="grid grid-cols-2 gap-3 sm:flex">
  {#each TABS as item, index (item.value)}
    {@const active = tab === item.value}
    {@const alert = item.value === 'attention' && counts.attention > 0}
    <button
      bind:this={buttons[index]}
      type="button"
      role="tab"
      id="returns-tab-{item.value}"
      aria-selected={active}
      aria-controls="returns-panel-{item.value}"
      tabindex={active ? 0 : -1}
      onclick={() => onSelect(item.value)}
      onkeydown={(event) => move(event, index)}
      class={cn(
        'flex h-13 min-w-0 items-center gap-2.5 rounded-lg border px-3 text-left transition-colors sm:min-w-55',
        'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        active
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'bg-card hover:border-foreground/25 hover:bg-muted/50',
      )}
    >
      <span
        class={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-md',
          active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
        )}
      >
        <item.icon class="size-4" aria-hidden="true" />
      </span>
      <span class="min-w-0 flex-1 truncate text-sm font-medium">
        {t(item.value === 'pending' ? 'returns.tabPending' : 'returns.tabAttention')}
      </span>
      <span
        class={cn(
          'flex min-w-7 shrink-0 items-center justify-center gap-1 rounded-full px-2 py-0.5 text-center text-xs font-semibold tabular-nums',
          alert
            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {#if status[item.value] === 'loading'}
          <Spinner class="size-3" />
        {:else if status[item.value] === 'error'}
          –
        {:else}
          {#if status[item.value] === 'refreshing'}<Spinner class="size-3" />{/if}
          {counts[item.value]}
        {/if}
      </span>
    </button>
  {/each}
</div>
