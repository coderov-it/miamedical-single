<!--
  What the customer area shows while the session settles: the shell's own
  shape in grey blocks, not a line of text on an empty band.

  GEOMETRY IS AccountShell's — the same container, heading row, 250px sidebar
  and gaps — so the real screen replaces this without moving anything. Change
  one and change the other.
-->
<script lang="ts">
  interface Props {
    /** Spoken once; the blocks themselves are hidden from assistive technology. */
    label: string;
  }

  const { label }: Props = $props();

  /* No radius here: each block names its own, so none has two to fight over. */
  const BLOCK = 'bg-hair animate-pulse motion-reduce:animate-none';
  const CARD = 'border-hair rounded-card border bg-white p-5 mid:p-6';
</script>

<div class="bg-page">
  <div
    class="max-w-page px-gutter mx-auto w-full pt-[clamp(16px,1.8vw,28px)] pb-[clamp(48px,5vw,80px)]"
  >
    <p class="sr-only" role="status">{label}</p>

    <div aria-hidden="true">
      <div class="flex items-center justify-between gap-6">
        <div class="{BLOCK} mid:h-9 mid:w-44 h-8 w-40 rounded-md"></div>
        <div class="{BLOCK} rounded-field h-11 w-28"></div>
      </div>

      <div class="mid:grid mid:grid-cols-[250px_minmax(0,1fr)] mid:items-start mid:gap-8 mt-6">
        <div class="max-mid:mb-5">
          <div class="border-hair rounded-card flex items-center gap-3 border bg-white p-4">
            <div class="{BLOCK} size-11 flex-none rounded-full"></div>
            <div class="min-w-0 flex-1 space-y-2">
              <div class="{BLOCK} h-4 w-3/4 rounded-md"></div>
              <div class="{BLOCK} h-3 w-full rounded-md"></div>
            </div>
          </div>

          <div class="mid:mt-5 mid:flex-col mid:gap-0.5 flex gap-1.5 overflow-hidden">
            {#each [0, 1, 2, 3] as index (index)}
              <div class="mid:w-full flex h-11 w-28 flex-none items-center gap-2.5 px-3">
                <div class="{BLOCK} size-5 flex-none rounded-md"></div>
                <div class="{BLOCK} mid:max-w-32 h-3.5 flex-1 rounded-md"></div>
              </div>
            {/each}
          </div>
        </div>

        <div class="space-y-5">
          <div class="grid grid-cols-2 gap-4">
            {#each [0, 1] as index (index)}
              <div class={CARD}>
                <div class="{BLOCK} h-3 w-20 rounded-md"></div>
                <div class="{BLOCK} mt-3 h-7 w-10 rounded-md"></div>
              </div>
            {/each}
          </div>

          <div class="flex items-center justify-between pt-1">
            <div class="{BLOCK} h-5 w-32 rounded-md"></div>
            <div class="{BLOCK} h-4 w-28 rounded-md"></div>
          </div>
          <div class={CARD}>
            <div class="{BLOCK} h-3.5 w-2/3 rounded-md"></div>
            <div class="{BLOCK} rounded-field mt-5 h-11 w-40"></div>
          </div>

          <div class={CARD}>
            <div class="{BLOCK} h-5 w-28 rounded-md"></div>
            <div class="mid:grid-cols-2 mt-5 grid gap-4">
              {#each [0, 1] as index (index)}
                <div class="space-y-2">
                  <div class="{BLOCK} h-3 w-16 rounded-md"></div>
                  <div class="{BLOCK} rounded-field h-12"></div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
