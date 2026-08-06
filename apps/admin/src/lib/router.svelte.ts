/**
 * Minimal hash router. The admin is a single-origin SPA behind auth, so it
 * doesn't need a full routing library — swap in one later if the surface grows.
 */
class Router {
  #path = $state(location.hash.slice(1) || '/');

  constructor() {
    addEventListener('hashchange', () => {
      this.#path = location.hash.slice(1) || '/';
    });
  }

  get path() {
    return this.#path;
  }

  navigate(to: string) {
    location.hash = to;
  }
}

export const router = new Router();
