<!--
  What a list shows instead of cards: the standard loading state on the first
  load, a retry card when the load failed, or the empty state. Never the empty
  state while loading.
-->
<script lang="ts">
  import type { Component } from 'svelte';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Empty from '$lib/components/ui/empty/index.js';
  import LoadingState from '~/lib/components/loading-state.svelte';
  import type { ListStatus } from '~/lib/returns/list-status';
  import { t } from '~/lib/ui-text';

  interface Props {
    status: ListStatus;
    error: string | null;
    /** What is loading, as a sentence: the list's own loading line. */
    loadingLabel: string;
    /** Tab icon and the "nothing here" line. */
    icon: Component<{ class?: string }>;
    emptyText: string;
    onRetry: () => void;
  }

  let { status, error, loadingLabel, icon: Icon, emptyText, onRetry }: Props = $props();
</script>

{#if status === 'loading'}
  <LoadingState label={loadingLabel} framed />
{:else if status === 'error'}
  <Empty.Root class="rounded-xl border bg-card py-12" role="alert">
    <Empty.Header>
      <Empty.Description class="text-sm text-destructive">{error}</Empty.Description>
    </Empty.Header>
    <Button variant="outline" size="sm" onclick={onRetry}>{t('returns.retry')}</Button>
  </Empty.Root>
{:else}
  <Empty.Root class="rounded-xl border bg-card py-16">
    <Empty.Header>
      <Empty.Media class="size-14 rounded-full bg-muted">
        <Icon class="size-7 text-muted-foreground" />
      </Empty.Media>
      <Empty.Description class="text-sm">{emptyText}</Empty.Description>
    </Empty.Header>
  </Empty.Root>
{/if}
