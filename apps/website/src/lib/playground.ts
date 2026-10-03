/**
 * The component playground: every variant of a shared piece on one page, so it
 * can be judged without coaxing the real page into that state.
 *
 *   /playground/?token=…                  → the index of demos
 *   /playground/<category>/<part>/?token=… → one demo
 *
 * Gated by PLAYGROUND_TOKEN, read once at boot. Unset, the playground does not
 * exist: every URL renders the site's 404, the same answer a wrong token gets,
 * so a probe cannot tell "off" from "locked".
 *
 * Adding a demo: write a view under `views/playground/`, add one entry to
 * `PLAYGROUND_DEMOS` below, and map it in `views/playground/PlaygroundDemo.astro`
 * (the views are .astro, which this plain-TS module cannot import).
 */
import { createHash, timingSafeEqual } from 'node:crypto';

import { PLAYGROUND_TOKEN } from 'astro:env/server';

export interface PlaygroundDemo {
  category: string;
  part: string;
  title: string;
  summary: string;
}

export const PLAYGROUND_DEMOS: PlaygroundDemo[] = [
  {
    category: 'loading',
    part: 'states',
    title: 'Loading states',
    summary: 'LoadingState — block and inline, bare and framed, on both grounds.',
  },
];

/* Hashed so `timingSafeEqual` always compares equal lengths. */
const digest = (value: string): Buffer => createHash('sha256').update(value).digest();

const EXPECTED = PLAYGROUND_TOKEN ? digest(PLAYGROUND_TOKEN) : null;

export function playgroundAllows(url: URL): boolean {
  if (!EXPECTED) return false;
  return timingSafeEqual(digest(url.searchParams.get('token') ?? ''), EXPECTED);
}

export function findDemo(category: string, part: string): PlaygroundDemo | undefined {
  return PLAYGROUND_DEMOS.find((demo) => demo.category === category && demo.part === part);
}

/** A playground link that keeps the token, so moving between demos stays signed in. */
export function playgroundHref(url: URL, path: string): string {
  const token = url.searchParams.get('token') ?? '';
  return `/playground/${path}?token=${encodeURIComponent(token)}`;
}
