<!--
  A one-of-N switch built on Tabs, for filters that are not tab panels: the
  caller reads `value` and renders whatever it likes.
-->
<script lang="ts" generics="T extends string">
  import type { Component } from 'svelte';

  import * as Tabs from '$lib/components/ui/tabs/index.js';

  interface Props {
    value: T;
    options: { id: T; label: string; icon?: Component }[];
    label: string;
    onChange: (value: T) => void;
    /** Pointer or keyboard focus arrives on an option — a cue to warm its data. */
    onHint?: (value: T) => void;
  }

  let { value, options, label, onChange, onHint }: Props = $props();
</script>

<Tabs.Root {value} onValueChange={(next) => onChange(next as T)}>
  <Tabs.List aria-label={label}>
    {#each options as option (option.id)}
      <Tabs.Trigger
        value={option.id}
        onpointerenter={() => onHint?.(option.id)}
        onfocus={() => onHint?.(option.id)}>{option.label}</Tabs.Trigger
      >
    {/each}
  </Tabs.List>
</Tabs.Root>
