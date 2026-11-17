import type { BlogPostStatus } from '@mia/validators';

import { NEUTRAL_TONE, type StatusMeta, type StatusTone } from '~/lib/orders/status';
import { type MessageKey, t } from '~/lib/ui-text';

export const BLOG_STATUS_TONE: Record<BlogPostStatus, StatusTone & { labelKey: MessageKey }> = {
  draft: {
    labelKey: 'status.blogDraft',
    tone: 'border-border text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
  published: {
    labelKey: 'status.blogPublished',
    tone: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  archived: {
    labelKey: 'status.blogArchived',
    tone: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
};

export function blogStatusMeta(status: string): StatusMeta {
  const entry = BLOG_STATUS_TONE[status as BlogPostStatus];
  if (!entry) return { ...NEUTRAL_TONE, label: status };
  return { tone: entry.tone, dot: entry.dot, label: t(entry.labelKey) };
}

export const BLOG_STATUS_ORDER: readonly BlogPostStatus[] = ['draft', 'published', 'archived'];
