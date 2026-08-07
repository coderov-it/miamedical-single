<script lang="ts">
  import { page } from '$app/state';

  import { Button } from '$lib/components/ui/button/index.js';
  import { routes } from '~/lib/routes';
</script>

<div class="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
  <p class="text-4xl font-semibold tracking-tight tabular-nums">{page.status}</p>
  <p class="max-w-sm text-sm text-muted-foreground">
    {page.error?.message ?? 'Something went wrong.'}
  </p>
  <Button href={routes.dashboard} variant="outline" class="mt-3">Back to dashboard</Button>
</div>
