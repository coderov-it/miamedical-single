/// <reference types="svelte" />
/**
 * The three push toggles, for the lifetime of the account island.
 *
 * A class instantiated per island rather than a module singleton, for the same
 * reason `NotificationStore` is one: this island is server-rendered on every
 * request inside one long-lived Node process, so module state would be one
 * customer's settings shown to the next.
 *
 * ── Optimistic, and why that is safe here ───────────────────────────────────
 * The switch moves on click and the request follows. A toggle that waited for a
 * round trip would feel broken on a phone, and the cost of being wrong is small
 * and self-correcting: the response carries the full effective state and
 * replaces whatever was assumed, and a failure puts the switch back and says so.
 *
 * What is NOT optimistic is the shape. The server answers with every category
 * resolved, so this never reconstructs "on unless turned off" locally — that
 * rule lives in `@mia/validators/push-preferences` and nowhere else.
 */
import {
  getNotificationPreferences,
  type NotificationCategoryKey,
  type NotificationPreferences,
  saveNotificationPreferences,
} from './customer-session.ts';

export const PREFERENCE_CATEGORIES: readonly NotificationCategoryKey[] = [
  'order',
  'rental',
  'contract',
];

export class NotificationPreferenceStore {
  #values = $state<NotificationPreferences | null>(null);
  #loading = $state(false);
  #saving = $state<NotificationCategoryKey | null>(null);
  #error = $state<unknown>(null);

  #pending: Promise<void> | null = null;

  get values(): NotificationPreferences | null {
    return this.#values;
  }

  get loading(): boolean {
    return this.#loading;
  }

  /** Which switch is in flight, so only that row shows it. */
  get saving(): NotificationCategoryKey | null {
    return this.#saving;
  }

  get error(): unknown {
    return this.#error;
  }

  /** At most one load, however many effects call it. */
  ensureLoaded(): Promise<void> {
    if (this.#values || this.#pending) return this.#pending ?? Promise.resolve();

    this.#loading = true;
    this.#pending = getNotificationPreferences()
      .then((values) => {
        this.#values = values;
        this.#error = null;
      })
      .catch((error: unknown) => {
        this.#error = error;
      })
      .finally(() => {
        this.#loading = false;
        this.#pending = null;
      });

    return this.#pending;
  }

  async toggle(category: NotificationCategoryKey): Promise<void> {
    const current = this.#values;
    if (!current) return;

    const next = !current[category].push;
    /* Move first. The replace below is what makes this safe — the server's
       answer is the state, not this guess. */
    this.#values = { ...current, [category]: { push: next } };
    this.#saving = category;
    this.#error = null;

    try {
      this.#values = await saveNotificationPreferences({ [category]: { push: next } });
    } catch (error) {
      // Put it back. A switch that stayed moved would claim a setting we failed
      // to store, which is worse than the toggle appearing not to work.
      this.#values = current;
      this.#error = error;
    } finally {
      this.#saving = null;
    }
  }
}
