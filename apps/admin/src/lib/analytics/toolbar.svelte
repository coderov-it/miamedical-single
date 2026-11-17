<!-- Range presets, custom dates and the bucket switch. State lives in the URL; this only reports changes. -->
<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { type MessageKey, t } from '~/lib/ui-text';

  import {
    BUCKETS,
    type Bucket,
    type DayRange,
    type RangeProblem,
    rangeProblem,
    matchPreset,
    PRESETS,
    type PresetId,
  } from './range';
  import Segmented from './segmented.svelte';

  interface Props {
    range: DayRange;
    bucket: Bucket;
    today: string;
    onPreset: (id: PresetId) => void;
    onRange: (range: DayRange) => void;
    onBucket: (bucket: Bucket) => void;
    onHintPreset: (id: PresetId) => void;
    onHintBucket: (bucket: Bucket) => void;
    loading: boolean;
    /** What the numbers on screen cover, e.g. `17 Nov 2025 – 17 Nov 2026 · updated 10:42`. */
    period: string;
  }

  let {
    range,
    bucket,
    today,
    onPreset,
    onRange,
    onBucket,
    onHintPreset,
    onHintBucket,
    loading,
    period,
  }: Props = $props();

  const active = $derived(matchPreset(range, today));
  let problem = $state<RangeProblem | null>(null);
  let badField = $state<'from' | 'to' | null>(null);

  const PROBLEM_KEYS: Record<RangeProblem, MessageKey> = {
    incomplete: 'analytics.rangeIncomplete',
    order: 'analytics.rangeOrder',
    tooLong: 'analytics.rangeTooLong',
  };

  const PRESET_KEYS: Record<PresetId, MessageKey> = {
    last7: 'analytics.presetLast7',
    last30: 'analytics.presetLast30',
    last90: 'analytics.presetLast90',
    thisMonth: 'analytics.presetThisMonth',
    thisYear: 'analytics.presetThisYear',
    lastYear: 'analytics.presetLastYear',
  };
  const BUCKET_KEYS: Record<Bucket, MessageKey> = {
    day: 'analytics.bucketDay',
    week: 'analytics.bucketWeek',
    month: 'analytics.bucketMonth',
    year: 'analytics.bucketYear',
  };

  function commit(next: DayRange, field: 'from' | 'to', input: HTMLInputElement) {
    problem = rangeProblem(next);
    badField = problem ? field : null;
    if (problem) input.focus();
    else onRange(next);
  }
</script>

<div class="@container flex flex-col gap-3">
  <div class="flex flex-wrap items-center gap-2">
    {#each PRESETS as id (id)}
      <Button
        variant={active === id ? 'secondary' : 'outline'}
        size="sm"
        aria-pressed={active === id}
        onclick={() => onPreset(id)}
        onpointerenter={() => onHintPreset(id)}
        onfocus={() => onHintPreset(id)}
      >
        {t(PRESET_KEYS[id])}
      </Button>
    {/each}
  </div>

  <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
    <label class="flex items-center gap-2 text-sm text-muted-foreground">
      {t('analytics.from')}
      <Input
        type="date"
        class="w-40"
        value={range.from}
        max={today}
        aria-invalid={badField === 'from'}
        aria-describedby={badField === 'from' ? 'range-problem' : undefined}
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
        aria-describedby={badField === 'to' ? 'range-problem' : undefined}
        onchange={(e) =>
          commit({ from: range.from, to: e.currentTarget.value }, 'to', e.currentTarget)}
      />
    </label>
    <Segmented
      value={bucket}
      label={t('analytics.bucketLabel')}
      options={BUCKETS.map((id) => ({
        id,
        label: t(BUCKET_KEYS[id]),
      }))}
      onChange={onBucket}
      onHint={onHintBucket}
    />
  </div>

  <p class="flex h-5 items-center gap-2 text-xs text-muted-foreground">
    <span class="flex size-4 items-center justify-center">
      {#if loading}<Spinner class="size-3.5" />{/if}
    </span>
    <span class="tabular-nums">{period}</span>
  </p>

  {#if problem}
    <p id="range-problem" class="text-sm text-destructive">{t(PROBLEM_KEYS[problem])}</p>
  {/if}
</div>
