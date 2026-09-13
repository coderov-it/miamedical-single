<!--
  Review step. What the run produced, grouped the way the record is, with a
  toggle per language.

  Collapsed by section rather than listed flat: a product with five FAQs, three
  add-ons and ten specs produces forty fields per language, and a wall of one
  hundred and twenty previews is a screen nobody reads. The counts are visible
  without expanding, which is the part an operator actually checks.

  Fields the server would reject are shown struck through with the reason — a
  translated chip that came back at 23 characters against a cap of 20 is
  reported, not truncated and not silently dropped.
-->
<script lang="ts">
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import { languageOf, type PlanField, type TargetLanguageCode } from '~/lib/i18n';

  interface Props {
    fields: PlanField[];
    /** Accepted text, per language, keyed by field key. */
    rows: Partial<Record<TargetLanguageCode, Record<string, string>>>;
    /** Rejected text with its reason, per language. */
    refused: Partial<Record<TargetLanguageCode, Record<string, string>>>;
    /** Keys written from another field rather than translated. */
    derivedKeys: Partial<Record<TargetLanguageCode, string[]>>;
    included: TargetLanguageCode[];
    onToggle: (code: TargetLanguageCode) => void;
  }

  let { fields, rows, refused, derivedKeys, included, onToggle }: Props = $props();

  /** Rich text previews show the words, not the tags. */
  function preview(field: PlanField, text: string): string {
    const plain = field.format === 'html' ? text.replaceAll(/<[^>]*>/g, ' ') : text;
    return plain.replaceAll(/\s+/g, ' ').trim().slice(0, 160);
  }

  function sectionsFor(code: TargetLanguageCode) {
    const row = rows[code] ?? {};
    const bad = refused[code] ?? {};
    const from = derivedKeys[code] ?? [];
    const order: string[] = [];
    const bySection = new Map<
      string,
      Array<{ field: PlanField; text: string; reason?: string; derived: boolean }>
    >();

    for (const field of fields) {
      const text = row[field.key];
      const reason = bad[field.key];
      if (text === undefined && reason === undefined) continue;
      if (!bySection.has(field.section)) {
        bySection.set(field.section, []);
        order.push(field.section);
      }
      bySection.get(field.section)!.push({
        field,
        text: text ?? '',
        derived: from.includes(field.key),
        ...(reason ? { reason } : {}),
      });
    }
    return order.map((name) => ({ name, items: bySection.get(name)! }));
  }

  const acceptedCount = (code: TargetLanguageCode) => Object.keys(rows[code] ?? {}).length;
  const refusedCount = (code: TargetLanguageCode) => Object.keys(refused[code] ?? {}).length;
</script>

<div class="space-y-3">
  {#each included as code (code)}
    <div class="rounded-lg border">
      <div class="flex items-center gap-2 border-b bg-muted/40 px-3 py-2 text-sm">
        <Checkbox checked onCheckedChange={() => onToggle(code)} />
        <button
          type="button"
          class="flex items-center gap-2 text-left"
          onclick={() => onToggle(code)}
        >
          <span class="font-medium">{languageOf(code).label}</span>
          <span class="text-xs text-muted-foreground uppercase">{code}</span>
        </button>
        <span class="ml-auto text-xs text-muted-foreground">
          {acceptedCount(code)} fields
          {#if refusedCount(code) > 0}
            · <span class="text-amber-600 dark:text-amber-400">{refusedCount(code)} too long</span>
          {/if}
        </span>
      </div>

      <div class="divide-y">
        {#each sectionsFor(code) as section (section.name)}
          <details class="group">
            <summary
              class="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
            >
              <ChevronRightIcon
                class="size-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
              />
              <span>{section.name}</span>
              <span class="ml-auto text-xs text-muted-foreground">{section.items.length}</span>
            </summary>
            <dl class="space-y-2 px-3 pb-3">
              {#each section.items as item (item.field.key)}
                <div class="grid grid-cols-[7rem_1fr] gap-2 text-xs">
                  <dt class="text-muted-foreground">
                    {item.field.groupLabel} · {item.field.label}
                  </dt>
                  {#if item.reason}
                    <dd class="text-amber-600 line-through dark:text-amber-400">
                      {preview(item.field, item.text)}
                      <span class="ml-1 no-underline">({item.reason})</span>
                    </dd>
                  {:else}
                    <dd class="font-mono break-words">
                      {preview(item.field, item.text)}
                      {#if item.derived}
                        <!-- Says where it came from: not translated, because the
                             source had nothing to translate. -->
                        <span
                          class="ml-1 rounded bg-muted px-1 py-0.5 text-[0.625rem] text-muted-foreground"
                        >
                          derived
                        </span>
                      {/if}
                    </dd>
                  {/if}
                </div>
              {/each}
            </dl>
          </details>
        {/each}
      </div>
    </div>
  {/each}
</div>
