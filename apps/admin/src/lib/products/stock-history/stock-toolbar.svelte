<!-- Range for the stock history: 30 / 90 / 365 days, or custom dates. Reports changes only. -->
<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { addDays, type DayRange, type RangeProblem, rangeProblem } from '~/lib/analytics/range';
  import { type MessageKey, t } from '~/lib/ui-text';

  interface Props {
    range: DayRange;
    today: string;
    loading: boolean;
    onRange: (range: DayRange) => void;
  }

  let { range, today, loading, onRange }: Props = $props();

  const PRESETS: { days: number; key: MessageKey }[] = [
    { days: 30, key: 'stock.preset30' },
    { days: 90, key: 'stock.preset90' },
    { days: 365, key: 'stock.preset365' },
  ];
  const PROBLEM_KEYS: Record<RangeProblem, MessageKey> = {
    incomplete: 'analytics.rangeIncomplete',
    order: 'analytics.rangeOrder',
    tooLong: 'analytics.rangeTooLong',
  };

  let problem = $state<RangeProblem | null>(null);
  let badField = $state<'from' | 'to' | null>(null);

  function activeDays(days: number): boolean {
    return range.to === today && range.from === addDays(today, -(days - 1));
  }

  function commit(next: DayRange, field: 'from' | 'to', input: HTMLInputElement) {
    problem = rangeProblem(next);
    badField = problem ? field : null;
    if (problem) input.focus();
    else onRange(next);
  }
</script>

<div class="space-y-2">
  <div class="flex flex-wrap items-center gap-2">
    {#each PRESETS as preset (preset.days)}
      <Button
        variant={activeDays(preset.days) ? 'secondary' : 'outline'}
        size="sm"
        aria-pressed={activeDays(preset.days)}
        onclick={() => {
          problem = null;
          badField = null;
          onRange({ from: addDays(today, -(preset.days - 1)), to: today });
        }}
      >
        {t(preset.key)}
      </Button>
    {/each}
    <label class="flex items-center gap-2 text-sm text-muted-foreground">
      {t('analytics.from')}
      <Input
        type="date"
        class="w-40"
        value={range.from}
        max={today}
        aria-invalid={badField === 'from'}
        aria-describedby={badField === 'from' ? 'stock-range-problem' : undefined}
        onchange={(e) =>
          commit({ from: e.currentTarget.value, to: range.to }, 'from', e.currentTarget)}
      />
    </label>
    <label class="flex items-center gap-2 text-sm text-muted-foreground">
      {t('analytics.to')}
      <Input
        type="date"
        class="w-40"
        value={range.to}
        aria-invalid={badField === 'to'}
        aria-describedby={badField === 'to' ? 'stock-range-problem' : undefined}
        onchange={(e) =>
          commit({ from: range.from, to: e.currentTarget.value }, 'to', e.currentTarget)}
      />
    </label>
    <span class="flex size-4 items-center justify-center">
      {#if loading}<Spinner class="size-3.5" />{/if}
    </span>
  </div>
  {#if problem}
    <p id="stock-range-problem" class="text-sm text-destructive">{t(PROBLEM_KEYS[problem])}</p>
  {/if}
</div>
