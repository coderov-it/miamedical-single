import type { BlogPostStatus } from '@mia/validators';

import type { StatusMeta } from '~/lib/orders/status';

const NEUTRAL: StatusMeta = {
  label: '—',
  tone: 'text-muted-foreground',
  dot: 'bg-muted-foreground',
};

export const BLOG_STATUS_META: Record<BlogPostStatus, StatusMeta> = {
  draft: {
    label: 'Draft',
    tone: 'border-border text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
  published: {
    label: 'Published',
    tone: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  archived: {
    label: 'Archived',
    tone: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
};

export function blogStatusMeta(status: string): StatusMeta {
  return BLOG_STATUS_META[status as BlogPostStatus] ?? { ...NEUTRAL, label: status };
}

export const BLOG_STATUS_ORDER: readonly BlogPostStatus[] = ['draft', 'published', 'archived'];
