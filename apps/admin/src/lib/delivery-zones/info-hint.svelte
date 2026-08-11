<!--
  An (i) that stays quiet until asked.

  This screen has a lot it *could* explain — inheritance, why a CAP is not a
  level, which code each level matches on. Printed inline it becomes wallpaper the
  operator stops reading. So the rule for this screen is: the interface shows
  values, and every sentence about how it works lives either behind one of these
  or in the Help dialog.

  Use one only where getting it wrong costs money. Everything else goes in Help.
-->
<script lang="ts">
  import InfoIcon from '@lucide/svelte/icons/info';
  import type { Snippet } from 'svelte';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Popover from '$lib/components/ui/popover/index.js';

  interface Props {
    /** Names what is being explained, for screen readers. */
    label: string;
    children: Snippet;
  }

  let { label, children }: Props = $props();
</script>

<Popover.Root>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="ghost"
        size="icon-xs"
        class="text-muted-foreground hover:text-foreground"
        aria-label="About {label}"
      >
        <InfoIcon />
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="w-72 text-xs leading-relaxed" align="start">
    {@render children()}
  </Popover.Content>
</Popover.Root>
