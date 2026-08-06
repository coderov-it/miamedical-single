<script lang="ts">
  import '~/styles/app.css';

  import { session } from '~/lib/session.svelte';

  let { children } = $props();

  // One `/me` request for the life of the app. Everything below renders off
  // `session.loading` / `session.isAuthenticated` until it resolves.
  void session.ensureLoaded();
</script>

{@render children()}
