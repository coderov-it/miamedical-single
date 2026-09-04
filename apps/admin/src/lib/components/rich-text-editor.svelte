<!--
  The product description editor: Tiptap 3 (ProseMirror) with a toolbar built
  from this app's own buttons, so it inherits the tokens and the 40/32/24 control
  scale instead of shipping a second design system.

  **The extension list is the allowlist.** ProseMirror parses pasted HTML against
  the schema and silently drops anything it has no node or mark for — so no
  images, no video, no tables, no `style` attributes, no `<h1>` (the page already
  has one), whatever the operator pastes from Word or a competitor's site. That
  is a stronger guarantee than stripping tags after the fact, and it is why the
  toolbar and the schema are configured in one place.

  It is NOT the security boundary: the server sanitises on write with the same
  allowlist (`packages/validators/src/rich-text.ts`), because a client is a
  client. Both lists have to move together — see docs/code/admin-rich-text.md.
-->
<script lang="ts">
  import BoldIcon from '@lucide/svelte/icons/bold';
  import IndentDecreaseIcon from '@lucide/svelte/icons/indent-decrease';
  import IndentIncreaseIcon from '@lucide/svelte/icons/indent-increase';
  import ItalicIcon from '@lucide/svelte/icons/italic';
  import LinkIcon from '@lucide/svelte/icons/link';
  import ListIcon from '@lucide/svelte/icons/list';
  import ListOrderedIcon from '@lucide/svelte/icons/list-ordered';
  import MinusIcon from '@lucide/svelte/icons/minus';
  import QuoteIcon from '@lucide/svelte/icons/quote';
  import RedoIcon from '@lucide/svelte/icons/redo-2';
  import RemoveFormattingIcon from '@lucide/svelte/icons/remove-formatting';
  import StrikethroughIcon from '@lucide/svelte/icons/strikethrough';
  import UnderlineIcon from '@lucide/svelte/icons/underline';
  import UndoIcon from '@lucide/svelte/icons/undo-2';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import { untrack } from 'svelte';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { cn } from '$lib/utils.js';

  interface Props {
    /** Sanitised HTML. Empty string for "nothing written yet". */
    value: string;
    onChange: (html: string) => void;
    /**
     * Changes when the *document* changes identity — the content language, in
     * practice. The editor reloads its content on a new key and otherwise leaves
     * it alone, because pushing `value` back in on every keystroke would fight
     * the cursor.
     */
    key?: string;
    ariaLabel?: string;
  }

  let { value, onChange, key = 'default', ariaLabel = 'Description' }: Props = $props();

  const BLOCKS = [
    { value: 'p', label: 'Paragraph' },
    { value: '2', label: 'Heading 2' },
    { value: '3', label: 'Heading 3' },
    { value: '4', label: 'Heading 4' },
    { value: '5', label: 'Heading 5' },
    { value: '6', label: 'Heading 6' },
  ] as const;

  let element = $state<HTMLDivElement>();
  /**
   * The editor lives in a wrapper object rather than a bare `$state` binding:
   * Tiptap mutates the instance in place, so reassigning the wrapper on every
   * transaction is what makes `isActive()` in the toolbar re-derive.
   *
   * Named `box`, not `state`: a variable called `state` turns every `$state(…)`
   * in this file into a store subscription (`$store` syntax) and the runes stop
   * compiling.
   */
  let box = $state<{ editor: Editor | null }>({ editor: null });
  const editor = $derived(box.editor);

  /** `<p></p>` is what an emptied editor serialises to — store nothing instead. */
  const htmlOf = (instance: Editor) => (instance.isEmpty ? '' : instance.getHTML());

  $effect(() => {
    const target = element;
    if (!target) return;

    /**
     * `element` is the ONLY dependency this effect may have. Reading `value`
     * here untracked is what makes that true — read it normally and every
     * keystroke re-runs the effect, destroying and rebuilding the editor mid-word
     * (the first character lands, the rest go nowhere, because the DOM node the
     * caret was in no longer exists). Content only ever comes back in through the
     * `key` effect below.
     */
    const { html: initial, label } = untrack(() => ({ html: value, label: ariaLabel }));

    const instance = new Editor({
      element: target,
      // h1 is the page title's, never the copy's; the code block and inline code
      // buy nothing in a product description and give the operator two ways to
      // produce monospace by accident.
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3, 4, 5, 6] },
          code: false,
          codeBlock: false,
          link: { openOnClick: false, autolink: true },
        }),
      ],
      content: initial || '',
      editorProps: {
        attributes: {
          class: 'prose-editor min-h-64 w-full px-3 py-2.5 text-base leading-relaxed outline-none',
          'aria-label': label,
        },
      },
      onUpdate: ({ editor: current }) => onChange(htmlOf(current)),
      onTransaction: ({ editor: current }) => {
        // Re-wrap so the toolbar's `isActive`/`can()` reads re-run. Cheap: the
        // wrapper is one object, and Svelte compares by identity.
        box = { editor: current };
      },
    });

    box = { editor: instance };
    return () => {
      instance.destroy();
      box = { editor: null };
    };
  });

  // Language switch: reload the document, but only when the text really differs,
  // so a save that hands back identical HTML does not reset the cursor.
  let loadedKey = $state(untrack(() => key));
  $effect(() => {
    const instance = box.editor;
    if (!instance) return;
    if (key === loadedKey) return;
    loadedKey = key;
    if (htmlOf(instance) !== value)
      instance.commands.setContent(value || '', { emitUpdate: false });
  });

  const activeBlock = $derived.by(() => {
    if (!editor) return 'p';
    const level = [2, 3, 4, 5, 6].find((n) => editor.isActive('heading', { level: n }));
    return level ? String(level) : 'p';
  });

  function setBlock(next: string) {
    if (!editor) return;
    const chain = editor.chain().focus();
    if (next === 'p') chain.setParagraph().run();
    else chain.setHeading({ level: Number(next) as 2 | 3 | 4 | 5 | 6 }).run();
  }

  function promptLink() {
    if (!editor) return;
    const current = editor.getAttributes('link').href as string | undefined;
    const href = window.prompt('Link URL (empty to remove)', current ?? 'https://');
    if (href === null) return;
    const chain = editor.chain().focus().extendMarkRange('link');
    if (!href.trim()) chain.unsetLink().run();
    else chain.setLink({ href: href.trim() }).run();
  }
</script>

{#snippet tool(
  label: string,
  icon: typeof BoldIcon,
  run: () => void,
  active = false,
  disabled = false,
)}
  <Button
    type="button"
    variant="ghost"
    size="icon-sm"
    aria-label={label}
    aria-pressed={active}
    {disabled}
    class={cn('text-muted-foreground', active && 'bg-muted text-foreground')}
    onclick={run}
  >
    {@const Icon = icon}
    <Icon />
  </Button>
{/snippet}

<div
  class="overflow-hidden rounded-lg border border-input bg-input/25 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30"
>
  <!-- The toolbar is a well on top of the writing surface, so the surface reads
       as the paper and the controls as chrome. -->
  <div
    class="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/40 px-1.5 py-1"
    role="toolbar"
    aria-label="Formatting"
  >
    <Select.Root type="single" value={activeBlock} onValueChange={setBlock}>
      <Select.Trigger size="sm" class="w-33 border-transparent bg-transparent">
        {BLOCKS.find((block) => block.value === activeBlock)?.label ?? 'Paragraph'}
      </Select.Trigger>
      <Select.Content>
        {#each BLOCKS as block (block.value)}
          <Select.Item value={block.value}>{block.label}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>

    <Separator orientation="vertical" class="mx-1 h-5" />

    {#if editor}
      {@render tool(
        'Bold',
        BoldIcon,
        () => editor.chain().focus().toggleBold().run(),
        editor.isActive('bold'),
      )}
      {@render tool(
        'Italic',
        ItalicIcon,
        () => editor.chain().focus().toggleItalic().run(),
        editor.isActive('italic'),
      )}
      {@render tool(
        'Underline',
        UnderlineIcon,
        () => editor.chain().focus().toggleUnderline().run(),
        editor.isActive('underline'),
      )}
      {@render tool(
        'Strikethrough',
        StrikethroughIcon,
        () => editor.chain().focus().toggleStrike().run(),
        editor.isActive('strike'),
      )}

      <Separator orientation="vertical" class="mx-1 h-5" />

      {@render tool(
        'Bullet list',
        ListIcon,
        () => editor.chain().focus().toggleBulletList().run(),
        editor.isActive('bulletList'),
      )}
      {@render tool(
        'Numbered list',
        ListOrderedIcon,
        () => editor.chain().focus().toggleOrderedList().run(),
        editor.isActive('orderedList'),
      )}
      {@render tool(
        'Indent',
        IndentIncreaseIcon,
        () => editor.chain().focus().sinkListItem('listItem').run(),
        false,
        !editor.can().sinkListItem('listItem'),
      )}
      {@render tool(
        'Outdent',
        IndentDecreaseIcon,
        () => editor.chain().focus().liftListItem('listItem').run(),
        false,
        !editor.can().liftListItem('listItem'),
      )}

      <Separator orientation="vertical" class="mx-1 h-5" />

      {@render tool(
        'Quote',
        QuoteIcon,
        () => editor.chain().focus().toggleBlockquote().run(),
        editor.isActive('blockquote'),
      )}
      {@render tool('Link', LinkIcon, promptLink, editor.isActive('link'))}
      {@render tool('Divider', MinusIcon, () => editor.chain().focus().setHorizontalRule().run())}
      {@render tool('Clear formatting', RemoveFormattingIcon, () =>
        editor.chain().focus().unsetAllMarks().clearNodes().run(),
      )}

      <ButtonGroup.Root class="ml-auto">
        {@render tool(
          'Undo',
          UndoIcon,
          () => editor.chain().focus().undo().run(),
          false,
          !editor.can().undo(),
        )}
        {@render tool(
          'Redo',
          RedoIcon,
          () => editor.chain().focus().redo().run(),
          false,
          !editor.can().redo(),
        )}
      </ButtonGroup.Root>
    {/if}
  </div>

  <div class="bg-card" bind:this={element}></div>
</div>

<style>
  /*
    Editor typography. Scoped with :global because the DOM inside belongs to
    ProseMirror, not to this component's markup, so Svelte's scoping classes
    never reach it. Kept close to the storefront's prose so what the operator
    writes looks like what a customer will read — the storefront owns the exact
    values (docs/code/storefront-design-system.md).
  */
  :global(.prose-editor) {
    white-space: pre-wrap;
  }
  :global(.prose-editor > * + *) {
    margin-top: 0.75em;
  }
  :global(.prose-editor h2) {
    font-size: 1.3em;
    font-weight: 700;
    line-height: 1.25;
  }
  :global(.prose-editor h3) {
    font-size: 1.15em;
    font-weight: 700;
    line-height: 1.3;
  }
  :global(.prose-editor h4),
  :global(.prose-editor h5),
  :global(.prose-editor h6) {
    font-size: 1em;
    font-weight: 600;
  }
  :global(.prose-editor ul),
  :global(.prose-editor ol) {
    padding-left: 1.5em;
  }
  :global(.prose-editor ul) {
    list-style: disc;
  }
  :global(.prose-editor ol) {
    list-style: decimal;
  }
  :global(.prose-editor li > ul),
  :global(.prose-editor li > ol) {
    margin-top: 0.25em;
  }
  :global(.prose-editor li p) {
    margin: 0;
  }
  :global(.prose-editor blockquote) {
    border-left: 2px solid var(--border);
    padding-left: 0.9em;
    color: var(--muted-foreground);
  }
  :global(.prose-editor hr) {
    border: 0;
    border-top: 1px solid var(--border);
    margin: 1.25em 0;
  }
  :global(.prose-editor a) {
    color: var(--primary);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
</style>
