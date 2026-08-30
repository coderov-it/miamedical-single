import type { InferResponseType } from 'hono/client';

import { api } from './api.ts';
import { localeForRequest, type SiteLocale } from './i18n.ts';

type BlogListResponse = InferResponseType<typeof api.api.blog.$get, 200>;

export type BlogPostSummary = BlogListResponse['data'][number];
export type BlogPageMeta = BlogListResponse['meta'];

export type BlogPostDetail = InferResponseType<(typeof api.api.blog)[':slug']['$get'], 200>['data'];

export type BlogCategory = InferResponseType<
  typeof api.api.blog.categories.$get,
  200
>['data'][number];

export interface BlogQuery {
  page?: number;
  perPage?: number;
  category?: string;
}

export async function listBlogPosts(
  query: BlogQuery = {},
  locale: SiteLocale = localeForRequest(),
): Promise<BlogListResponse> {
  const response = await api.api.blog.$get({
    query: {
      locale,
      page: String(query.page ?? 1),
      perPage: String(query.perPage ?? 12),
      ...(query.category ? { category: query.category } : {}),
    },
  });
  if (!response.ok) throw new Error(`GET /api/blog failed (${response.status})`);
  return response.json();
}

export async function getBlogPostBySlug(
  slug: string,
  locale: SiteLocale = localeForRequest(),
): Promise<BlogPostDetail | null> {
  const response = await api.api.blog[':slug'].$get({
    param: { slug },
    query: { locale },
  });
  if (!response.ok) return null;
  const { data } = await response.json();
  return data;
}

export async function listBlogCategories(): Promise<BlogCategory[]> {
  const response = await api.api.blog.categories.$get();
  if (!response.ok) throw new Error(`GET /api/blog/categories failed (${response.status})`);
  const { data } = await response.json();
  return data;
}
