<!-- The lines as compact rows: thumbnail, title, package and period, quoted price. -->
<script lang="ts">
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import ImageOffIcon from '@lucide/svelte/icons/image-off';

  import { mediaUrl } from '~/lib/api';
  import { formatDate, formatMoney } from '~/lib/format';
  import type { LineDraft } from './line-draft';
  import type { OrderForm } from './order-form.svelte';

  let { form }: { form: OrderForm } = $props();

  /** "Sponda × 2" for each add-on taken. */
  function addonNames(line: LineDraft): string[] {
    return line.product.addons
      .filter((addon) => (line.addons[addon.id] ?? 0) > 0)
      .map((addon) => `${addon.name} × ${line.addons[addon.id]}`);
  }
</script>

<ul class="divide-y">
  {#each form.lines as line (line.key)}
    {@const quoted = form.quoteLine(line)}
    {@const extras = addonNames(line)}
    <li class="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
      <span
        class="grid size-10 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted"
      >
        {#if line.product.image}
          <img src={mediaUrl(line.product.image)} alt="" class="size-full object-contain" />
        {:else}
          <ImageOffIcon class="size-4 text-muted-foreground" />
        {/if}
      </span>
      <div class="min-w-0 flex-1 text-sm">
        <p class="truncate font-medium">{line.quantity} × {line.product.title}</p>
        <p class="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          {#if quoted?.packageLabel}<span>{quoted.packageLabel}</span>{/if}
          {#if quoted?.startDate && quoted.endDate}
            <span class="inline-flex items-center gap-1">
              · {formatDate(quoted.startDate)}
              {#if line.startTime}{line.startTime}{/if}
              <ArrowRightIcon class="size-3" />
              {formatDate(quoted.endDate)}
            </span>
          {/if}
          {#if extras.length > 0}<span>· {extras.join(', ')}</span>{/if}
        </p>
      </div>
      <span class="text-sm font-semibold tabular-nums">
        {quoted ? formatMoney(quoted.total, 'EUR') : '—'}
      </span>
    </li>
  {/each}
</ul>
