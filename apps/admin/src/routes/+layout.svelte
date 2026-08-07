<script lang="ts">
  import { ModeWatcher } from 'mode-watcher';

  import '~/styles/app.css';

  import { Toaster } from '$lib/components/ui/sonner/index.js';
  import { session } from '~/lib/session.svelte';

  let { children } = $props();

  // One `/me` request for the life of the app. Everything below renders off
  // `session.loading` / `session.isAuthenticated` until it resolves.
  void session.ensureLoaded();
</script>

<!-- Owns the `.dark` class and its localStorage persistence, and injects the
     blocking script that applies the stored theme before first paint. -->
<ModeWatcher />

{@render children()}

<Toaster position="bottom-right" richColors closeButton />
