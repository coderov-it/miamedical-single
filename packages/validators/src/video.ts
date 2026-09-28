/**
 * A product video is either an uploaded file (a `MediaItem` with a bucket
 * `path`) or an external one: a YouTube or Facebook video shown through the
 * platform's own embed player, or a direct link to a video file hosted
 * elsewhere, played by a plain `<video>`. External videos never touch the
 * bucket, so they carry a `url` instead of a `path` — that key is the
 * discriminator (`isExternalVideo`).
 *
 * Only the canonical watch URL is stored; the embed URL is derived here, so
 * the player's look is decided in one place and can change without a data
 * migration. Details and worked examples: `docs/code/product-videos.md`.
 */

export const VIDEO_PROVIDERS = ['link', 'youtube', 'facebook'] as const;
export type VideoProvider = (typeof VIDEO_PROVIDERS)[number];

export interface ParsedVideo {
  provider: VideoProvider;
  /** Canonical form: what gets stored. */
  url: string;
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(['youtube.com', 'm.youtube.com', 'music.youtube.com']);
const YOUTUBE_PATH_PREFIXES = ['embed', 'shorts', 'live', 'v'];

const FACEBOOK_HOSTS = new Set(['facebook.com', 'm.facebook.com', 'web.facebook.com']);
/** A URL on these that is not a recognised video is rejected, not kept as a link. */
const PLATFORM_HOSTS = new Set([
  ...YOUTUBE_HOSTS,
  ...FACEBOOK_HOSTS,
  'youtu.be',
  'youtube-nocookie.com',
  'fb.watch',
]);
/** Paths that name a video; a page or profile URL does not embed. */
const FACEBOOK_VIDEO_PATH = /^\/(watch\/?$|reel\/|share\/[vr]\/|[^/]+\/videos\/|videos\/)/;

const bareHost = (url: URL) => url.hostname.toLowerCase().replace(/^www\./, '');

/**
 * Accepts a URL or a pasted embed snippet — both platforms' "Embed" buttons
 * hand out `<iframe src="…">`, and an admin will paste exactly that.
 */
function toUrl(input: string): URL | null {
  const trimmed = input.trim();
  const src = /<iframe[^>]*\ssrc=["']([^"']+)["']/i.exec(trimmed)?.[1];
  try {
    return new URL((src ?? trimmed).replaceAll('&amp;', '&'));
  } catch {
    return null;
  }
}

function youtubeId(url: URL): string | null {
  const host = bareHost(url);
  if (host === 'youtu.be') return url.pathname.slice(1).split('/')[0] ?? null;
  if (host === 'youtube-nocookie.com' || YOUTUBE_HOSTS.has(host)) {
    const watched = url.searchParams.get('v');
    if (url.pathname === '/watch' && watched) return watched;
    const [prefix, id] = url.pathname.slice(1).split('/');
    if (prefix && YOUTUBE_PATH_PREFIXES.includes(prefix)) return id ?? null;
  }
  return null;
}

function facebookUrl(url: URL): string | null {
  const host = bareHost(url);
  if (host === 'fb.watch')
    return url.pathname.length > 1 ? `https://fb.watch${url.pathname}` : null;
  if (!FACEBOOK_HOSTS.has(host)) return null;

  // An embed snippet points at the plugin; the video itself is its `href`.
  if (url.pathname.startsWith('/plugins/video.php')) {
    const href = toUrl(url.searchParams.get('href') ?? '');
    if (!href) return null;
    return facebookUrl(href);
  }
  if (!FACEBOOK_VIDEO_PATH.test(url.pathname)) return null;

  // Keep only what identifies the video — share links carry tracking params.
  const watched = url.searchParams.get('v');
  const query = url.pathname.startsWith('/watch') && watched ? `?v=${watched}` : '';
  return `https://www.facebook.com${url.pathname}${query}`;
}

/**
 * Work out what a pasted value is. YouTube and Facebook are recognised by
 * host; anything else that is an https URL is a direct link. Returns null
 * when the value is not a usable URL at all.
 */
export function parseVideoUrl(input: string): ParsedVideo | null {
  const url = toUrl(input);
  if (!url) return null;

  const id = youtubeId(url);
  if (id !== null) {
    return YOUTUBE_ID.test(id)
      ? { provider: 'youtube', url: `https://www.youtube.com/watch?v=${id}` }
      : null;
  }

  const facebook = facebookUrl(url);
  if (facebook) return { provider: 'facebook', url: facebook };
  // A Facebook URL that is not a video (a page, a photo) is not a "link" either.
  if (PLATFORM_HOSTS.has(bareHost(url))) return null;

  // http would be blocked as mixed content on the https storefront.
  if (url.protocol !== 'https:') return null;
  return { provider: 'link', url: url.href };
}

/**
 * The iframe `src` for a platform video, set up as a bare player: no related
 * videos from other channels, no annotations, no post text around a Facebook
 * video. Null for a direct link, which plays in a `<video>` instead.
 */
export function videoEmbedUrl(video: ParsedVideo): string | null {
  if (video.provider === 'youtube') {
    const id = new URL(video.url).searchParams.get('v');
    // youtube-nocookie: no tracking cookie until the viewer presses play.
    return `https://www.youtube-nocookie.com/embed/${id}?rel=0&iv_load_policy=3&playsinline=1`;
  }
  if (video.provider === 'facebook') {
    const href = encodeURIComponent(video.url);
    return `https://www.facebook.com/plugins/video.php?href=${href}&show_text=false&width=560`;
  }
  return null;
}

/** What an embedded player's iframe is allowed to do — shared by every renderer. */
export const VIDEO_IFRAME_ALLOW =
  'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen';

/** Uploaded videos carry a bucket `path`; external ones carry a `url`. */
export function isExternalVideo<T extends object>(item: T): item is Extract<T, { url: string }> {
  return 'url' in item;
}
