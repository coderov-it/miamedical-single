<!--
  The admin's navigation rail.

  Sections come from `nav.ts` already filtered by ROUTE_ACCESS, so anything
  rendered here is something the visitor can actually open. Sign-out is behind
  an AlertDialog rather than a bare button — it is a one-click way to lose an
  unsaved product edit.
-->
<script lang="ts">
  import HeartPulseIcon from '@lucide/svelte/icons/heart-pulse';
  import LogOutIcon from '@lucide/svelte/icons/log-out';

  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { isNavItemActive, visibleNavigation } from '~/lib/nav';
  import { routes } from '~/lib/routes';
  import { session } from '~/lib/session.svelte';

  const sections = $derived(visibleNavigation((code) => session.can(code)));

  const identity = $derived(session.user?.fullName ?? session.user?.email ?? '');
  const role = $derived(session.user?.isSuperAdmin ? 'Super admin' : (session.user?.role ?? ''));
  const initials = $derived(
    (session.user?.fullName ?? session.user?.email ?? '?').slice(0, 2).toUpperCase(),
  );

  async function signOut() {
    await session.logout();
    await goto(routes.login);
  }
</script>

<Sidebar.Root collapsible="icon">
  <Sidebar.Header>
    <div class="flex items-center gap-2 px-1 py-1.5">
      <div
        class="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
      >
        <HeartPulseIcon class="size-4" />
      </div>
      <div class="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
        <span class="truncate text-sm font-semibold">Mia Medical</span>
        <span class="truncate text-xs text-muted-foreground">Back office</span>
      </div>
    </div>
  </Sidebar.Header>

  <Sidebar.Content>
    {#each sections as section (section.title)}
      <Sidebar.Group>
        <Sidebar.GroupLabel>{section.title}</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            {#each section.items as item (item.url)}
              {@const Icon = item.icon}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton
                  isActive={isNavItemActive(page.url.pathname, item.url)}
                  tooltipContent={item.title}
                >
                  {#snippet child({ props })}
                    <a href={item.url} {...props}>
                      <Icon />
                      <span>{item.title}</span>
                    </a>
                  {/snippet}
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            {/each}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    {/each}
  </Sidebar.Content>

  <Sidebar.Footer>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <div
          class="flex items-center gap-2 rounded-md px-2 py-1.5 group-data-[collapsible=icon]:px-0"
        >
          <span
            class="flex size-7 shrink-0 items-center justify-center rounded-md bg-foreground text-[0.6875rem] font-medium text-background"
          >
            {initials}
          </span>
          <div class="grid flex-1 leading-tight group-data-[collapsible=icon]:hidden">
            <span class="truncate text-xs font-medium">{identity}</span>
            <span class="truncate text-xs text-muted-foreground">{role}</span>
          </div>

          <AlertDialog.Root>
            <AlertDialog.Trigger
              class="rounded-md p-1.5 text-muted-foreground transition-colors group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label="Sign out"
            >
              <LogOutIcon class="size-4" />
            </AlertDialog.Trigger>
            <AlertDialog.Content>
              <AlertDialog.Header>
                <AlertDialog.Title>Sign out?</AlertDialog.Title>
                <AlertDialog.Description>
                  Any unsaved changes on the current page will be lost.
                </AlertDialog.Description>
              </AlertDialog.Header>
              <AlertDialog.Footer>
                <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
                <AlertDialog.Action onclick={signOut}>Sign out</AlertDialog.Action>
              </AlertDialog.Footer>
            </AlertDialog.Content>
          </AlertDialog.Root>
        </div>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>

  <Sidebar.Rail />
</Sidebar.Root>
