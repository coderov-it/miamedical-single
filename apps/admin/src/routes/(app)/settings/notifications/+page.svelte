<!--
  Who receives platform-level alerts. Today that is the "I did not place this
  order" reports; the setting is deliberately generic so the next notification
  needs no new field.

  An empty list is a legitimate state, not an error — the server logs a warning and
  skips the send, because a dispute is already stored and visible in the panel. The
  page says so rather than leaving the operator to wonder whether saving nothing
  broke something.
-->
<script lang="ts">
  import { P } from '@mia/permissions';
  import BellIcon from '@lucide/svelte/icons/bell';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import PageHeader from '~/lib/components/page-header.svelte';
  import { api } from '~/lib/api';
  import { ApiError, unwrap } from '~/lib/request';
  import { session } from '~/lib/session.svelte';

  interface Recipients {
    emails: string[];
  }

  const MAX_RECIPIENTS = 10;

  let emails = $state<string[]>([]);
  let loading = $state(true);
  let saving = $state(false);
  let feedback = $state<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const canEdit = $derived(session.can(P.SETTING_UPDATE));

  async function load() {
    loading = true;
    try {
      const data = await unwrap<Recipients>(await api.api.admin.settings.notifications.$get());
      // Always leave one empty row to type into, so adding the first recipient
      // does not require finding the "add" button first.
      emails = data.emails.length > 0 ? [...data.emails] : [''];
    } catch (error) {
      feedback = {
        tone: 'error',
        text: error instanceof ApiError ? error.message : 'Load failed.',
      };
    } finally {
      loading = false;
    }
  }

  async function save() {
    saving = true;
    feedback = null;
    try {
      const cleaned = emails.map((value) => value.trim()).filter((value) => value.length > 0);
      const data = await unwrap<Recipients>(
        await api.api.admin.settings.notifications.$put({ json: { emails: cleaned } }),
      );
      // Read the saved value back rather than keeping the draft: the server
      // deduplicates and lowercases, so the draft is not what was stored.
      emails = data.emails.length > 0 ? [...data.emails] : [''];
      feedback = {
        tone: 'ok',
        text:
          data.emails.length === 0
            ? 'Saved. With no recipients, alerts are only visible in the panel.'
            : `Saved ${data.emails.length} recipient${data.emails.length === 1 ? '' : 's'}.`,
      };
    } catch (error) {
      feedback = {
        tone: 'error',
        text: error instanceof ApiError ? error.message : 'Could not save.',
      };
    } finally {
      saving = false;
    }
  }

  void load();
</script>

<PageHeader title="Notifications" />

<Card.Root class="py-0">
  <div class="max-w-xl space-y-5 p-5">
    <div class="flex items-start gap-3">
      <BellIcon class="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      <p class="text-sm text-muted-foreground">
        These addresses receive platform alerts, including reports from customers who say they did
        not place an order. Leave the list empty to rely on the panel alone.
      </p>
    </div>

    {#if loading}
      <p class="text-sm text-muted-foreground">Loading…</p>
    {:else}
      <div class="space-y-2">
        {#each emails as _, index (index)}
          <div class="flex items-center gap-2">
            <Input
              type="email"
              placeholder="ops@example.com"
              bind:value={emails[index]}
              disabled={!canEdit || saving}
              autocomplete="off"
            />
            <Button
              variant="ghost"
              size="icon"
              disabled={!canEdit || saving || emails.length === 1}
              onclick={() => (emails = emails.filter((__, i) => i !== index))}
              aria-label="Remove recipient"
            >
              <Trash2Icon class="size-4" />
            </Button>
          </div>
        {/each}
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canEdit || saving || emails.length >= MAX_RECIPIENTS}
          onclick={() => (emails = [...emails, ''])}
        >
          <PlusIcon class="size-4" />
          Add address
        </Button>
        {#if emails.length >= MAX_RECIPIENTS}
          <span class="text-xs text-muted-foreground">
            Ten is the maximum — use a distribution group beyond that.
          </span>
        {/if}
      </div>

      {#if feedback}
        <p
          class="text-sm {feedback.tone === 'error' ? 'text-destructive' : 'text-muted-foreground'}"
        >
          {feedback.text}
        </p>
      {/if}

      {#if canEdit}
        <Button disabled={saving} onclick={save}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      {:else}
        <p class="text-sm text-muted-foreground">You have read-only access to settings.</p>
      {/if}
    {/if}
  </div>
</Card.Root>
