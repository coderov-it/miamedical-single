<!--
  The one global "something is happening" signal: a 2px bar across the top of
  the viewport while the router fetches the next page's code.

  Without it a click on a route whose chunk is not loaded yet does nothing
  visible for up to a second or two — the old page just sits there — and that
  dead time reads as "the app is slow" far more than the wait itself.

  It is deliberately quiet:
  - It waits `DELAY` ms before appearing, so a navigation that is already
    cached never flashes it.
  - It only reacts to a change of *page*. Filter and pager navigations keep the
    pathname and are ListCard's sweep bar's job, not this one's.
  - It never covers anything or blocks input.

  Data loading after the page mounts belongs to the page (skeletons, ListCard,
  ResourceView), not here — two indicators for one wait is the noise we avoid.
-->
<script lang="ts">
  import { navigating } from '$app/state';

  const DELAY = 150;

  let visible = $state(false);
  let width = $state(0);

  const active = $derived(
    navigating.to !== null && navigating.to.url.pathname !== navigating.from?.url.pathname,
  );

  $effect(() => {
    if (active) {
      const timer = setTimeout(() => {
        visible = true;
        width = 15;
      }, DELAY);
      // Creep towards 90% and never reach it: the bar has no idea how long the
      // chunk will take, so it slows down rather than pretending to finish.
      const trickle = setInterval(() => {
        if (visible) width += (90 - width) * 0.12;
      }, 250);
      return () => {
        clearTimeout(timer);
        clearInterval(trickle);
      };
    }

    if (!visible) return;
    width = 100;
    const timer = setTimeout(() => {
      visible = false;
      width = 0;
    }, 250);
    return () => clearTimeout(timer);
  });
</script>

{#if visible}
  <div
    class="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5"
    role="progressbar"
    aria-label="Loading page"
  >
    <div
      class="h-full bg-primary transition-[width,opacity] duration-200 ease-out"
      class:opacity-0={width === 100}
      style:width="{width}%"
    ></div>
  </div>
{/if}
