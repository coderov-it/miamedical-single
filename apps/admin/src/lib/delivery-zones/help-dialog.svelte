<!--
  Everything this screen used to say inline, in one place nobody has to read
  twice.

  It leads with a worked example on real values rather than a description, because
  the one thing an operator has to trust is which row a given address ends up
  paying — and that is a walk, not a paragraph.

  The numbers here are measured from the seeded reference data, not illustrative:
  4,735 CAPs, 860 of them shared, 45 comuni on the worst one.
-->
<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';

  interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }

  let { open, onOpenChange }: Props = $props();

  /** Read top to bottom: the first row that has a fee of its own answers. */
  const LADDER = [
    { level: 'CAP', row: 'Roma + 00121', value: '25,00 €', wins: true },
    { level: 'Comune', row: 'Roma', value: '15,00 €', wins: false },
    { level: 'Province', row: 'Roma (RM)', value: 'inherits', wins: false },
    { level: 'Region', row: 'Lazio', value: '50,00 €', wins: false },
  ] as const;

  const STATES = [
    {
      label: 'Inherit',
      meaning: 'Nobody has set a fee here. The nearest row above with one answers.',
    },
    { label: 'Fixed fee', meaning: 'The customer sees this amount at checkout and pays it.' },
    {
      label: 'Needs call',
      meaning:
        'We serve the area but will not quote it online. Checkout shows “+ consegna” and the fee is agreed by phone. This is a decision, which is why it is not the same as leaving a row empty.',
    },
  ] as const;

  const CODES = [
    { level: 'Region', code: '12', from: 'ISTAT region code' },
    { level: 'Province', code: 'RM', from: 'the two letters that appear in an address' },
    { level: 'Comune', code: '058091', from: 'the ISTAT comune list' },
    { level: 'CAP', code: '00121', from: 'the postal code alone — the comune is the parent row' },
    { level: 'Frazione', code: 'ostia-antica', from: 'a stable slug you choose' },
  ] as const;
</script>

<Dialog.Root {open} {onOpenChange}>
  <!--
    The `sm:` prefix is required: the base Content carries `sm:max-w-sm`, which an
    unprefixed max-width cannot override.

    The explicit width replaces the base `w-full`, which — once the max-width is
    raised — let the box run edge to edge on a viewport narrower than 4xl.
  -->
  <Dialog.Content class="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-4xl">
    <Dialog.Header>
      <Dialog.Title>How delivery zones work</Dialog.Title>
      <Dialog.Description>
        Set a fee at any level. Everything below inherits it until a deeper row overrides — so
        coverage is complete from the first row you enter, and gets more precise as you add rows.
      </Dialog.Description>
    </Dialog.Header>

    <!-- Two independent columns, not a grid of sections: as grid children the
         sections align row by row and open a hole under the shorter one. Each
         column flows on its own instead. -->
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-6">
        <section>
          <h3 class="text-sm font-semibold">A customer in Ostia types 00121</h3>
          <p class="mt-1 text-xs text-muted-foreground">
            We look for the narrowest row that has a fee of its own. The first hit wins and the rest
            are never read.
          </p>
          <ol class="mt-3 overflow-hidden rounded-lg border">
            {#each LADDER as step, index (step.level)}
              <li
                class="flex items-center gap-3 px-3 py-2 text-sm {index > 0
                  ? 'border-t'
                  : ''} {step.wins ? 'bg-primary/5' : ''}"
              >
                <span
                  class="w-16 shrink-0 text-[11px] tracking-wide text-muted-foreground uppercase"
                >
                  {step.level}
                </span>
                <span class="min-w-0 flex-1 truncate">{step.row}</span>
                <span
                  class="tabular-nums {step.value === 'inherits' ? 'text-muted-foreground' : ''}"
                >
                  {step.value}
                </span>
                <!-- Fixed-width cell so the amounts stay in one column whether or
                     not the row is the winner. -->
                <span class="w-17 shrink-0 text-right text-xs font-medium text-primary">
                  {step.wins ? 'pays this' : ''}
                </span>
              </li>
            {/each}
          </ol>
          <p class="mt-2 text-xs leading-relaxed text-muted-foreground">
            Delete the 00121 row and the same address pays 15,00 € from Roma. Delete Roma too and it
            pays 50,00 € from Lazio. There is always an answer — which is what makes coverage
            complete rather than nearly complete.
          </p>
        </section>

        <section>
          <h3 class="text-sm font-semibold">Why a CAP sits under a comune, never on its own</h3>
          <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
            A CAP is drawn by the post office and lines up with nothing. Rome alone holds 79 of
            them, so there a CAP is <em>finer</em> than the comune. But CAP 00060 covers 17 whole
            comuni north of Rome, and 24060 covers 45 in the Bergamo hills — there a CAP is far
            <em>coarser</em>. 860 of Italy's 4,735 CAPs are shared this way.
          </p>
          <p class="mt-2 text-xs leading-relaxed text-muted-foreground">
            So a CAP row always means the pair
            <span class="font-medium text-foreground">comune + CAP</span>. Riano + 00060 and
            Formello + 00060 are two different rows and can carry two different fees. A row keyed on
            00060 alone would push one comune's fee onto 16 neighbours.
          </p>
        </section>
      </div>

      <div class="space-y-6">
        <section>
          <h3 class="text-sm font-semibold">The three states</h3>
          <dl class="mt-2 space-y-2">
            {#each STATES as state (state.label)}
              <div class="flex gap-3 text-sm">
                <dt class="w-20 shrink-0 font-medium">{state.label}</dt>
                <dd class="min-w-0 text-xs leading-relaxed text-muted-foreground">
                  {state.meaning}
                </dd>
              </div>
            {/each}
          </dl>
        </section>

        <section>
          <h3 class="text-sm font-semibold">What each level matches on</h3>
          <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
            A row's name is for your eye only — rename it freely, nothing an address matches
            changes. The code is the identity, and each row stores only its own.
          </p>
          <ul class="mt-2 space-y-1">
            {#each CODES as entry (entry.level)}
              <li class="flex items-baseline gap-3 text-xs">
                <span class="w-16 shrink-0 text-muted-foreground">{entry.level}</span>
                <code class="w-24 shrink-0 font-mono text-foreground">{entry.code}</code>
                <span class="min-w-0 text-muted-foreground">{entry.from}</span>
              </li>
            {/each}
          </ul>
        </section>

        <section>
          <h3 class="text-sm font-semibold">Reading the tree</h3>
          <ul class="mt-2 space-y-1 text-xs leading-relaxed text-muted-foreground">
            <li>
              <span class="font-medium text-foreground">OWN</span> — the fee is set on that row, and
              the amount is shown in full black.
            </li>
            <li>
              <span class="font-medium text-foreground">INHERITED</span> — the row has no fee of its
              own and is showing what it takes from above, in grey.
            </li>
            <li>
              Deleting a row deletes everything nested under it. Addresses there fall back to the
              nearest row above, so they keep a price.
            </li>
          </ul>
        </section>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
