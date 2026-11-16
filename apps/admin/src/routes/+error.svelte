<script lang="ts">
  import { page } from '$app/state';

  import { Button } from '$lib/components/ui/button/index.js';
  import { routes } from '~/lib/routes';
  import { t } from '~/lib/ui-text';
</script>

<div class="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
  <p class="text-4xl font-semibold tracking-tight tabular-nums">{page.status}</p>
  <p class="max-w-sm text-sm text-muted-foreground">
    {page.error?.message ?? t('shell.errorFallback')}
  </p>
  <Button href={routes.dashboard} variant="outline" class="mt-3"
    >{t('shell.backToDashboard')}</Button
  >
</div>
