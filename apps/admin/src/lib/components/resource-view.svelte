<!--
  The detail-screen counterpart of ListCard: it renders one `Resource` through
  its three states, so no page re-types the error / skeleton / content ladder.

  - Nothing loaded yet → a skeleton (DetailSkeleton unless `skeleton` is given).
  - Failed with nothing to show → an error card with Try again.
  - Loaded → the content. It stays mounted while a refetch runs, marked only by
    the same 2px sweep ListCard uses; a refetch that fails keeps the content
    and says so above it rather than throwing the page away.
-->
<script lang="ts" generics="T">
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import type { Snippet } from 'svelte';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import DetailSkeleton from '~/lib/components/detail-skeleton.svelte';

  interface Props {
    resource: {
      readonly data: T | undefined;
      readonly error: string | null;
      readonly loading: boolean;
      refresh(): void;
    };
    /** Singular noun for the error title, e.g. `order` → "This order could not be loaded". */
    noun: string;
    skeleton?: Snippet;
    children: Snippet<[T]>;
  }

  let { resource, noun, skeleton, children }: Props = $props();
</script>

{#if resource.data !== undefined}
  <div class="relative">
    {#if resource.loading}
      <div class="absolute inset-x-0 -top-3"><div class="admin-loading-bar"></div></div>
    {/if}
    {#if resource.error}
      <div
        class="mb-4 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm"
        role="alert"
      >
        <CircleAlertIcon class="size-4 shrink-0 text-destructive" />
        <span class="text-destructive">{resource.error}</span>
        <Button variant="outline" size="sm" class="ml-auto" onclick={() => resource.refresh()}>
          Retry
        </Button>
      </div>
    {/if}
    {@render children(resource.data)}
  </div>
{:else if resource.error}
  <Empty.Root class="border bg-card">
    <Empty.Header>
      <Empty.Title>This {noun} could not be loaded</Empty.Title>
      <Empty.Description>{resource.error}</Empty.Description>
    </Empty.Header>
    <Empty.Content>
      <Button variant="outline" onclick={() => resource.refresh()}>Try again</Button>
    </Empty.Content>
  </Empty.Root>
{:else if skeleton}
  {@render skeleton()}
{:else}
  <DetailSkeleton />
{/if}
