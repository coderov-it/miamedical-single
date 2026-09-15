<!--
  Platform settings, one section per thing an operator can decide.

  This page exists to hold the *notification settings* that used to sit at their
  own URL under a sidebar entry called "Notifications" — which collided head-on
  with the notification feed that now carries that name. Who receives alert
  email is a setting; what the back office is telling you is an inbox. Two
  different things that were reading as one.

  Built to take more sections: each is a `SettingsSection`, and adding one is a
  block here rather than a new route and a new nav entry.
-->
<script lang="ts">
  import { P } from '@mia/permissions';
  import MailIcon from '@lucide/svelte/icons/mail';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';

  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import PageHeader from '~/lib/components/page-header.svelte';
  import { SettingsSection } from '~/lib/settings';
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
            ? 'Saved. With no recipients, alerts appear in the panel only.'
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

<section class="admin-page">
  <PageHeader
    eyebrow="Settings"
    title="General"
    description="Platform-wide options. Your own name and password are under your account."
  />

  <div class="max-w-4xl space-y-4">
    <SettingsSection
      icon={MailIcon}
      title="Alert email recipients"
      description="Who receives platform alerts by email. Operators already see these in their notification inbox; this list reaches people who are not in the panel."
    >
      {#if loading}
        <p class="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner class="size-3.5" />
          Loading…
        </p>
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
                class="max-w-sm"
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

        <div class="mt-3 flex flex-wrap items-center gap-2">
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
            class="mt-3 text-sm {feedback.tone === 'error'
              ? 'text-destructive'
              : 'text-muted-foreground'}"
          >
            {feedback.text}
          </p>
        {/if}

        <div class="mt-4">
          {#if canEdit}
            <Button disabled={saving} onclick={save}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          {:else}
            <p class="text-sm text-muted-foreground">You have read-only access to settings.</p>
          {/if}
        </div>
      {/if}
    </SettingsSection>
  </div>
</section>
