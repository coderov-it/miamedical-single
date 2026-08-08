/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Origin the Hono API is reachable at, from the browser and from SSR. */
  readonly PUBLIC_API_URL: string;
  readonly PUBLIC_SITE_URL: string;
  /** CDN/object-storage origin that media paths are resolved against. */
  readonly PUBLIC_MEDIA_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
