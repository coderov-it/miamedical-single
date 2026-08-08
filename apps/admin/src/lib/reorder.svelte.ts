/**
 * Shared motion for every hand-rolled reorderable list in the admin —
 * `sortable-list.svelte`, `spec-field-list.svelte` and `media-dropzone.svelte`.
 *
 * Without it a swap is an instant repaint: two rows exchange content between
 * frames and nothing tells you which one you just moved, or where it landed.
 * The rows are keyed, so `animate:flip` has everything it needs to slide them.
 *
 * See /docs/code/admin-client-layer.md for why the highlight exists alongside
 * the slide rather than instead of it.
 */

import { cubicOut } from 'svelte/easing';
import { prefersReducedMotion } from 'svelte/motion';

/** How long the ring lingers on the row that moved, in ms. */
const HIGHLIGHT_MS = 1100;

export class Reorder {
  #movedKey = $state<string | null>(null);
  #fade: ReturnType<typeof setTimeout> | undefined;

  /**
   * Must be constructed during component initialisation — it owns an
   * `$effect`, which is what ties the pending highlight timer to the
   * component's lifetime.
   */
  constructor() {
    $effect(() => () => clearTimeout(this.#fade));
  }

  /**
   * `animate:flip` params. `duration` scales with the distance travelled
   * because a swap moves each row by its neighbour's height, and these lists
   * range from a 60px media tile to a 250px questions row — one flat duration
   * either crawls on the short lists or reads as a jump-cut on the tall ones.
   */
  get flip() {
    return {
      duration: prefersReducedMotion.current
        ? 0
        : (distance: number) => Math.min(420, 130 + Math.sqrt(distance) * 11),
      easing: cubicOut,
    };
  }

  /** Call with the key of the row that just moved, right after the mutation. */
  mark(key: string) {
    this.#movedKey = key;
    clearTimeout(this.#fade);
    this.#fade = setTimeout(() => (this.#movedKey = null), HIGHLIGHT_MS);
  }

  /**
   * Transient ring for the row that moved. A tall row can travel further than
   * the viewport shows, so the slide alone is not always enough to follow — and
   * being colour rather than motion, this half still works when the reader has
   * asked for reduced motion, which is exactly when it has to.
   *
   * Pair with `transition-shadow duration-500` on the row so it fades out.
   */
  ring(key: string) {
    return this.#movedKey === key ? 'ring-2 ring-primary/40' : '';
  }
}
