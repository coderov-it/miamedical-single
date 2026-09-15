<!--
  One notification, rendered once for both places that show one: the bell's
  dropdown and the inbox. `compact` tightens it for the dropdown rather than
  forking the markup — two copies of a row is how a dropdown ends up disagreeing
  with the list it summarises.

  The whole row is the link, and following it marks it read: an operator who has
  opened the order has read the notice about it, and asking them to tick it off
  as well is busywork.
-->
<script lang="ts">
  import type { NotificationView } from '@mia/validators';

  import { cn } from '$lib/utils.js';
  import { relativeTime } from '~/lib/format';
  import { uiLang } from '~/lib/ui-lang.svelte';

  import { notificationFeed } from './feed.svelte';
  import { renderNotification } from './render';

  interface Props {
    row: NotificationView;
    /** The dropdown's density: one line of body, tighter padding. */
    compact?: boolean;
    /** Closes the popover the row sits in, if any. */
    onnavigate?: () => void;
  }

  let { row, compact = false, onnavigate }: Props = $props();

  const rendered = $derived(renderNotification(row, uiLang.current));
  const unread = $derived(row.readAt === null);

  function open() {
    void notificationFeed.markRead([row.id]);
    onnavigate?.();
  }
</script>

<svelte:element
  this={rendered.href ? 'a' : 'div'}
  href={rendered.href ?? undefined}
  onclick={open}
  role={rendered.href ? undefined : 'article'}
  class={cn(
    'group relative flex w-full items-start gap-3 text-left transition-colors',
    compact ? 'px-3 py-2.5' : 'px-4 py-3.5',
    rendered.href && 'hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none',
    unread && 'bg-primary/[0.035]',
  )}
>
  <!-- The category dot doubles as the unread marker: filled when unread, hollow
       once read, so one element carries both facts and the row never reflows. -->
  <span
    class={cn(
      'mt-1.5 size-2 shrink-0 rounded-full',
      unread ? rendered.accent : 'bg-transparent ring-1 ring-border',
    )}
    aria-hidden="true"
  ></span>

  <!--
    The row fills the panel; the TEXT does not. A sentence set across 1,300px is
    hard to track back to the start of the next line, so the measure is capped
    and the row keeps its full width for the hover target and the divider.
  -->
  <span class={cn('min-w-0 flex-1', !compact && 'max-w-3xl')}>
    <!--
      The time sits immediately after the title, not pinned to the right edge.
      Right-aligning it looks orderly in a mock-up and terrible in use: a short
      title beside a wide row leaves the timestamp stranded several hundred
      pixels from the sentence it dates, and the eye has to travel the gap to
      pair them up. Inline, they read as one line.
    -->
    <span class="flex flex-wrap items-baseline gap-x-2">
      <span
        class={cn(
          'text-sm',
          unread ? 'font-semibold text-foreground' : 'font-medium text-foreground/80',
        )}
      >
        {rendered.title}
      </span>
      <time
        class="text-xs whitespace-nowrap text-muted-foreground"
        datetime={row.createdAt}
        title={new Date(row.createdAt).toLocaleString(uiLang.current)}
      >
        {relativeTime(row.createdAt)}
      </time>
    </span>

    <span
      class={cn(
        'mt-0.5 block text-sm text-muted-foreground',
        compact ? 'line-clamp-1' : 'line-clamp-2',
      )}
    >
      {rendered.body}
    </span>
  </span>
</svelte:element>
