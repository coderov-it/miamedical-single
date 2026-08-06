<script lang="ts">
  import { page } from '$app/state';
</script>

<div class="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
  <div class="text-4xl font-semibold tracking-tight">{page.status}</div>
  <p class="text-sm text-neutral-500">
    {page.error?.message ?? 'Something went wrong.'}
  </p>
  <a href="/" class="text-brand-600 mt-4 text-sm underline">Back to dashboard</a>
</div>
