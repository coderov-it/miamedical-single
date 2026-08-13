import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { blogPostStatus } from './enums.ts';
import { languageCode, localized, localizedCheck } from './i18n.ts';

export const blogPosts = pgTable(
  'blog_posts',
  {
    id: uuid().primaryKey().defaultRandom(),
    status: blogPostStatus().notNull().default('draft'),
    featuredImage: text(),
    publishedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('blog_posts_status_idx').on(t.status),
    index('blog_posts_published_at_idx').on(t.publishedAt),
  ],
);

export const blogPostTranslations = pgTable(
  'blog_post_translations',
  {
    postId: uuid()
      .notNull()
      .references(() => blogPosts.id, { onDelete: 'cascade' }),
    languageCode: languageCode().notNull(),
    title: text().notNull(),
    slug: text().notNull(),
    body: text().notNull(),
    excerpt: text(),
    metaTitle: text(),
    metaDescription: text(),
  },
  (t) => [
    primaryKey({ columns: [t.postId, t.languageCode] }),
    uniqueIndex('blog_post_trans_lang_slug_key').on(t.languageCode, t.slug),
  ],
);

export const blogCategories = pgTable(
  'blog_categories',
  {
    id: uuid().primaryKey().defaultRandom(),
    code: text().notNull(),
    name: localized().notNull(),
    slug: text().notNull(),
    position: integer().notNull().default(0),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('blog_categories_code_key').on(t.code),
    uniqueIndex('blog_categories_slug_key').on(t.slug),
    localizedCheck('blog_categories_name_it_check', t.name),
  ],
);

export const blogPostCategories = pgTable(
  'blog_post_categories',
  {
    postId: uuid()
      .notNull()
      .references(() => blogPosts.id, { onDelete: 'cascade' }),
    categoryId: uuid()
      .notNull()
      .references(() => blogCategories.id, { onDelete: 'restrict' }),
  },
  (t) => [
    primaryKey({ columns: [t.postId, t.categoryId] }),
    index('blog_post_categories_cat_idx').on(t.categoryId),
  ],
);

export const blogPostsRelations = relations(blogPosts, ({ many }) => ({
  translations: many(blogPostTranslations),
  postCategories: many(blogPostCategories),
}));

export const blogPostTranslationsRelations = relations(blogPostTranslations, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogPostTranslations.postId],
    references: [blogPosts.id],
  }),
}));

export const blogCategoriesRelations = relations(blogCategories, ({ many }) => ({
  postCategories: many(blogPostCategories),
}));

export const blogPostCategoriesRelations = relations(blogPostCategories, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogPostCategories.postId],
    references: [blogPosts.id],
  }),
  category: one(blogCategories, {
    fields: [blogPostCategories.categoryId],
    references: [blogCategories.id],
  }),
}));
