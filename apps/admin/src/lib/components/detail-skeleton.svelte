<!--
  The first-load placeholder for a detail screen: the badge row every detail
  page opens with, then the body card. Shaped like the page it stands in for,
  so the real content lands where the eye already is instead of popping in.
-->
<script lang="ts">
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { cn } from '$lib/utils.js';

  let { class: className }: { class?: string } = $props();
</script>

<div class={cn('space-y-4', className)} aria-busy="true">
  <div class="flex gap-2">
    <Skeleton class="h-5 w-20 rounded-full" />
    <Skeleton class="h-5 w-24 rounded-full" />
  </div>
  <Skeleton class="h-72 w-full rounded-xl" />
</div>
