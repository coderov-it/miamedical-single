<!--
  The topbar's bell: the unread count, a dropdown of the newest few, and the way
  into the inbox.

  It owns the live connection rather than the inbox screen does, because the
  operator is almost never on that screen — the point of a live feed is that it
  reaches them while they are looking at something else. The topbar is mounted
  for the whole authenticated session, so the stream's lifetime is the session's.

  The dropdown is unfiltered on purpose. The inbox has a category rail; this
  does not, and must not — a bell that obeyed a filter set on another screen
  would hide the arrival it exists to announce.
-->
<script lang="ts">
  import { notificationUiLabel } from '@mia/i18n';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import BellIcon from '@lucide/svelte/icons/bell';
  import CheckCheckIcon from '@lucide/svelte/icons/check-check';

  import { buttonVariants } from '$lib/components/ui/button/index.js';
  import * as Popover from '$lib/components/ui/popover/index.js';
  import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { notificationFeed, NotificationRow } from '~/lib/notifications';
  import { routes } from '~/lib/routes';
  import { uiLang } from '~/lib/ui-lang.svelte';

  let open = $state(false);

  $effect(() => {
    notificationFeed.connect();
    return () => notificationFeed.disconnect();
  });

  const t = $derived((key: Parameters<typeof notificationUiLabel>[0]) =>
    notificationUiLabel(key, uiLang.current),
  );
  const unread = $derived(notificationFeed.unread);
  // Past 99 the exact number stops being information and starts being a layout
  // problem. The inbox still shows the real total.
  const badge = $derived(unread > 99 ? '99+' : String(unread));
  const label = $derived(
    unread > 0
      ? notificationUiLabel('unreadCount', uiLang.current, { count: unread })
      : t('heading'),
  );
</script>

<Popover.Root bind:open>
  <Popover.Trigger
    class={buttonVariants({ variant: 'ghost', size: 'icon' }) + ' relative size-8'}
    aria-label={label}
  >
    <BellIcon class="size-4" />
    {#if unread > 0}
      <span
        class="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none font-medium text-white tabular-nums"
        aria-hidden="true"
      >
        {badge}
      </span>
    {/if}
  </Popover.Trigger>

  <!-- `p-0` because the rows run edge to edge; the padding belongs to each
       section, not to the panel. -->
  <Popover.Content align="end" sideOffset={8} class="w-[22rem] gap-0 p-0 sm:w-[24rem]">
    <div class="flex items-center justify-between gap-2 px-3 py-2.5">
      <p class="text-sm font-semibold">{t('heading')}</p>
      {#if unread > 0}
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onclick={() => notificationFeed.markAllRead()}
        >
          <CheckCheckIcon class="size-3.5" />
          {t('markAllRead')}
        </button>
      {/if}
    </div>

    <Separator />

    {#if notificationFeed.latest.length === 0}
      <div class="flex flex-col items-center gap-1 px-6 py-10 text-center">
        <BellIcon class="size-5 text-muted-foreground/60" />
        <p class="text-sm font-medium">{t('empty')}</p>
        <p class="text-xs text-muted-foreground">{t('emptyHint')}</p>
      </div>
    {:else}
      <!-- Capped by height rather than by count so ten short rows and ten long
           ones both land on a panel the same size. -->
      <ScrollArea class="max-h-[22rem]">
        <ul class="divide-y">
          {#each notificationFeed.latest as row (row.id)}
            <li>
              <NotificationRow {row} compact onnavigate={() => (open = false)} />
            </li>
          {/each}
        </ul>
      </ScrollArea>
    {/if}

    <Separator />

    <a
      href={routes.notifications}
      onclick={() => (open = false)}
      class="flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-accent"
    >
      {t('seeInInbox')}
      <ArrowRightIcon class="size-3.5" />
    </a>
  </Popover.Content>
</Popover.Root>
