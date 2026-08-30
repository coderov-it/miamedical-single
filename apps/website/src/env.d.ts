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

declare namespace App {
  interface Locals {
    /** Locale resolved by the strict public route map in middleware. */
    locale?: import('./lib/i18n.ts').SiteLocale;
    /** The public URL before an English route is internally rewritten. */
    publicPath?: string;
  }
}
