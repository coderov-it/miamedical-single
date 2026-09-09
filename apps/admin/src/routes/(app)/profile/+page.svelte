<!--
  Your own account. Reached by clicking your name in the sidebar footer, and
  absent from `nav.ts` on purpose — this is not a section of the back office.

  It is also the only page an operator holding no permission at all can open,
  which is why the two forms it hosts talk to `/api/auth/*` rather than
  `/api/admin/users/*`: your name and your password are yours whatever you were
  granted. What you may *reach* is not, so access is printed here and edited
  only from the access screen, by somebody else.
-->
<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { groupSummary } from '~/lib/access/access';
  import { api } from '~/lib/api';
  import PageHeader from '~/lib/components/page-header.svelte';
  import { orDash, pluralize, relativeTime } from '~/lib/format';
  import DetailsForm from '~/lib/profile/details-form.svelte';
  import PasswordForm from '~/lib/profile/password-form.svelte';
  import type { Profile } from '~/lib/profile/profile';
  import { unwrap } from '~/lib/request';
  import { Resource } from '~/lib/resource.svelte';

  const profile = new Resource<Profile, null>(
    () => null,
    async (_key, signal) =>
      unwrap<Profile>(await api.api.auth.profile.$get({}, { init: { signal } })),
  );

  const current = $derived(profile.data);
</script>

<!-- Centred column, not the layout's full 1600px: this page is one
     narrow form, and stretching its cards across a wide screen leaves the
     fields marooned against the left edge of a mostly empty card. The content
     inside stays flex-start — the column is centred, the form is not. -->
<section class="admin-page mx-auto w-full max-w-2xl">
  <PageHeader
    title="Your account"
    description="Your details and your password. What this account may reach is set by an administrator on the Admin users screen."
  />

  {#if profile.error}
    <p class="rounded-md bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
      {profile.error}
    </p>
  {:else if !current}
    <Card.Root class="py-0">
      <div class="space-y-4 p-5">
        <Skeleton class="h-4 w-32" />
        <Skeleton class="h-9 w-full" />
        <Skeleton class="h-9 w-full" />
      </div>
    </Card.Root>
  {:else}
    <div class="space-y-4">
      <DetailsForm profile={current} onSaved={(next) => profile.set(next)} />

      <PasswordForm isSuperuser={current.isSuperuser} />

      <Card.Root class="py-0">
        <div class="space-y-3 p-5">
          <div>
            <h2 class="text-sm font-semibold">Access</h2>
            <p class="mt-0.5 text-sm text-muted-foreground">
              Read-only here — only an administrator can change what an account reaches.
            </p>
          </div>

          <dl class="grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
            <dt class="text-muted-foreground">Permissions</dt>
            <dd>
              {#if current.isSuperuser}
                <Badge>Superuser</Badge>
                <span class="ml-1.5 text-muted-foreground">Everything, including new areas.</span>
              {:else}
                {pluralize(current.permissions.length, 'permission')}
                <span class="text-muted-foreground">· {groupSummary(current.permissions)}</span>
              {/if}
            </dd>

            <dt class="text-muted-foreground">Phone on file</dt>
            <dd>{orDash(current.phone)}</dd>

            <dt class="text-muted-foreground">Last sign-in</dt>
            <dd>{current.lastLoginAt ? relativeTime(current.lastLoginAt) : 'Never'}</dd>
          </dl>
        </div>
      </Card.Root>
    </div>
  {/if}
</section>
