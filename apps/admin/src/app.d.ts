/// <reference types="@sveltejs/kit" />

declare global {
  namespace App {
    /** Shape of the payload passed to `error()` and read by `+error.svelte`. */
    interface Error {
      message: string;
    }
    // Locals / PageData / PageState / Platform stay empty: this is a static SPA
    // with no server hooks and no `+page.server.ts`.
  }
}

export {};
