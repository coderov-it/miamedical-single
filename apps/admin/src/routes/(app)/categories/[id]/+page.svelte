<!--
  The category editor moved into a sheet on the list page. This route survives
  only so links and bookmarks that predate the move still land somewhere
  useful — it forwards to the list with that category's editor already open.
-->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { routes } from '~/lib/routes';

  $effect(() => {
    void goto(`${routes.categories}?edit=${page.params.id}`, { replaceState: true });
  });
</script>

<div class="flex items-center gap-2 p-8 text-sm text-muted-foreground">
  <Spinner />
  Opening the category editor…
</div>
