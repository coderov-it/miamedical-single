<!--
  The rental packages of a product as compact chips in one wrapping row:
  "3 giorni · 25,00 €". The group carries the field id, so a missing package
  takes focus here.
-->
<script lang="ts">
  import { cn } from '$lib/utils.js';
  import { formatMoney } from '~/lib/format';
  import { t } from '~/lib/ui-text';
  import type { LineProduct } from './types';

  interface Props {
    id: string;
    packages: LineProduct['packages'];
    value: string;
    invalid: boolean;
    onPick: (code: string) => void;
  }

  let { id, packages, value, invalid, onPick }: Props = $props();
</script>

<div
  {id}
  role="radiogroup"
  tabindex="-1"
  aria-label={t('newOrder.package')}
  aria-invalid={invalid ? 'true' : undefined}
  class={cn(
    'flex flex-wrap gap-2 rounded-lg outline-none',
    invalid && 'ring-2 ring-destructive/40',
  )}
>
  {#each packages as pkg (pkg.code)}
    {@const active = value === pkg.code}
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onclick={() => onPick(pkg.code)}
      class={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm whitespace-nowrap transition-colors outline-none',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'bg-card hover:border-foreground/25 hover:bg-muted',
      )}
    >
      <span class="font-medium">{pkg.name}</span>
      <span class={active ? 'opacity-70' : 'text-muted-foreground'}>·</span>
      <span class="tabular-nums">{formatMoney(pkg.price, 'EUR')}</span>
    </button>
  {/each}
</div>
