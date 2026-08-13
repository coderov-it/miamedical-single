<script lang="ts">
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Popover from '$lib/components/ui/popover/index.js';
  import StatusBadge from '~/lib/components/status-badge.svelte';
  import { formatDate } from '~/lib/format';
  import { routes } from '~/lib/routes';

  interface CalendarEvent {
    orderId: string;
    orderNumber: string;
    orderStatus: string;
    type: 'order-placed' | 'rental-start' | 'rental-end';
    date: string;
    productTitle: string | null;
  }

  let {
    events = [],
    month,
    year,
    onNavigate,
    onDayFilter,
  }: {
    events: CalendarEvent[];
    month: number;
    year: number;
    onNavigate: (year: number, month: number) => void;
    onDayFilter?: (date: string) => void;
  } = $props();

  const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ] as const;

  const EVENT_COLORS: Record<CalendarEvent['type'], string> = {
    'order-placed': 'bg-amber-500',
    'rental-start': 'bg-blue-500',
    'rental-end': 'bg-emerald-500',
  };

  const EVENT_LABELS: Record<CalendarEvent['type'], string> = {
    'order-placed': 'Placed',
    'rental-start': 'Rental start',
    'rental-end': 'Rental end',
  };

  const todayString = $derived(
    new Date().toISOString().slice(0, 10),
  );

  interface DayCell {
    date: number;
    dateString: string;
    isCurrentMonth: boolean;
    isToday: boolean;
    events: CalendarEvent[];
  }

  const grid = $derived.by(() => {
    const firstOfMonth = new Date(year, month, 1);
    const startDow = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();

    const eventsByDate = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const list = eventsByDate.get(event.date);
      if (list) list.push(event);
      else eventsByDate.set(event.date, [event]);
    }

    const cells: DayCell[] = [];

    for (let i = startDow - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const ds = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ date: d, dateString: ds, isCurrentMonth: false, isToday: ds === todayString, events: eventsByDate.get(ds) ?? [] });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ date: d, dateString: ds, isCurrentMonth: true, isToday: ds === todayString, events: eventsByDate.get(ds) ?? [] });
    }

    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      for (let d = 1; d <= remaining; d++) {
        const ds = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({ date: d, dateString: ds, isCurrentMonth: false, isToday: ds === todayString, events: eventsByDate.get(ds) ?? [] });
      }
    }

    const rows: DayCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  });

  function prevMonth() {
    if (month === 0) onNavigate(year - 1, 11);
    else onNavigate(year, month - 1);
  }

  function nextMonth() {
    if (month === 11) onNavigate(year + 1, 0);
    else onNavigate(year, month + 1);
  }

  function goToday() {
    const now = new Date();
    onNavigate(now.getFullYear(), now.getMonth());
  }
</script>

<div class="flex flex-col gap-2">
  <div class="flex items-center justify-between">
    <h3 class="text-sm font-medium">
      {MONTH_NAMES[month]} {year}
    </h3>
    <div class="flex items-center gap-1">
      <Button variant="ghost" size="sm" onclick={goToday}>Today</Button>
      <Button variant="ghost" size="icon-sm" onclick={prevMonth}>
        <ChevronLeftIcon class="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" onclick={nextMonth}>
        <ChevronRightIcon class="size-4" />
      </Button>
    </div>
  </div>

  <div class="flex gap-4 text-xs text-muted-foreground">
    <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-blue-500"></span> Start</span>
    <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-emerald-500"></span> End</span>
    <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-amber-500"></span> Placed</span>
  </div>

  <div class="overflow-x-auto rounded-md border">
    <table class="w-full table-fixed border-collapse text-sm">
      <thead>
        <tr>
          {#each WEEKDAYS as day}
            <th class="border-b px-1 py-1.5 text-center text-xs font-medium text-muted-foreground">{day}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each grid as row}
          <tr>
            {#each row as cell}
              <td
                class="h-20 border-b border-r p-1 align-top last:border-r-0 {cell.isCurrentMonth ? '' : 'bg-muted/30'}"
              >
                <Popover.Root>
                  <Popover.Trigger
                    class="flex size-full cursor-pointer flex-col items-stretch gap-0.5 overflow-hidden rounded-sm text-left hover:bg-muted/60"
                  >
                    <span
                      class="self-start text-xs tabular-nums {cell.isToday ? 'flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold' : cell.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}"
                    >{cell.date}</span>
                    {#each cell.events.slice(0, 2) as event}
                      <span
                        class="flex min-w-0 items-center gap-1 rounded-sm bg-muted px-1 py-px"
                        title="{event.orderNumber} — {EVENT_LABELS[event.type]}"
                      >
                        <span class="size-1.5 shrink-0 rounded-full {EVENT_COLORS[event.type]}"></span>
                        <span class="truncate font-mono text-[10px] leading-tight">{event.orderNumber}</span>
                      </span>
                    {/each}
                    {#if cell.events.length > 2}
                      <span class="px-1 text-[10px] leading-tight text-muted-foreground">
                        +{cell.events.length - 2} more
                      </span>
                    {/if}
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content class="w-72 max-h-64 overflow-y-auto">
                      <Popover.Header>
                        <Popover.Title>{formatDate(cell.dateString)}</Popover.Title>
                      </Popover.Header>
                      {#if cell.events.length > 0}
                        <div class="flex flex-col gap-2 py-2">
                          {#each cell.events as event}
                            <div class="flex items-start gap-2 text-sm">
                              <span class="mt-1.5 size-2 shrink-0 rounded-full {EVENT_COLORS[event.type]}"></span>
                              <div class="min-w-0 flex-1">
                                <a href={routes.orderDetail(event.orderId)} class="font-mono text-xs font-medium hover:underline">{event.orderNumber}</a>
                                <span class="ml-1 text-xs text-muted-foreground">{EVENT_LABELS[event.type]}</span>
                                {#if event.productTitle}
                                  <p class="truncate text-xs text-muted-foreground">{event.productTitle}</p>
                                {/if}
                              </div>
                              <StatusBadge status={event.orderStatus} class="shrink-0" />
                            </div>
                          {/each}
                        </div>
                      {:else}
                        <p class="py-2 text-sm text-muted-foreground">
                          No orders or rentals on this day.
                        </p>
                      {/if}
                      {#if onDayFilter}
                        <div class="border-t pt-2">
                          <Button variant="ghost" size="sm" class="w-full" onclick={() => onDayFilter?.(cell.dateString)}>
                            Filter orders to this day
                          </Button>
                        </div>
                      {/if}
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
