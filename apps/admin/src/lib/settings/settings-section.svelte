<!--
  One band of the settings page: an icon, a title, a line saying what the setting
  actually decides, and the controls on the right.

  A component rather than repeated markup because the page is built to grow.
  Sections added later must line up with this one without anybody re-deriving
  the spacing, and a settings page whose rows drift apart is the usual result of
  copy-pasting the first one.
-->
<script lang="ts">
  import type { Component, Snippet } from 'svelte';

  import * as Card from '$lib/components/ui/card/index.js';

  interface Props {
    icon: Component;
    title: string;
    /** What this setting decides, and what happens if it is left alone. */
    description: string;
    children: Snippet;
  }

  let { icon: Icon, title, description, children }: Props = $props();
</script>

<Card.Root class="gap-0 py-0">
  <div class="grid gap-6 p-6 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-12">
    <div class="flex gap-3">
      <span
        class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
      >
        <Icon class="size-4.5" />
      </span>
      <div class="min-w-0">
        <h2 class="text-sm font-semibold">{title}</h2>
        <p class="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>

    <div class="min-w-0">{@render children()}</div>
  </div>
</Card.Root>
