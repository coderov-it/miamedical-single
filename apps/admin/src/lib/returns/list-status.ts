/**
 * Where a list is in its life, told from a `Resource`:
 *  - `loading`: first load, nothing to show yet (LoadingState, spinner pill)
 *  - `error`: the last load failed (retry card, "–" pill)
 *  - `refreshing`: a reload with the previous cards still on screen
 *  - `ready`: settled
 * Before the first request starts, `loading` is still false and `data` is
 * undefined, so "no data and no error" counts as the first load.
 */
export type ListStatus = 'loading' | 'error' | 'refreshing' | 'ready';

export function listStatus(resource: {
  data: unknown;
  error: string | null;
  loading: boolean;
}): ListStatus {
  if (resource.error) return 'error';
  if (resource.data === undefined) return 'loading';
  return resource.loading ? 'refreshing' : 'ready';
}
