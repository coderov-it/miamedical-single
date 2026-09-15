import type { Database } from '@mia/db';
import { and, count, desc, eq, inArray, isNull, sql } from '@mia/db';
import { notifications } from '@mia/db/schema';
import {
  NOTIFICATION_CATEGORIES,
  type NotificationAudience,
  type NotificationCategory,
  type NotificationCategoryCount,
  type NotificationData,
  type NotificationView,
} from '@mia/validators';

/**
 * Reads over the feed table. One set of queries for both audiences: the only
 * difference is which recipient column is matched, so it is a parameter rather
 * than a second file.
 *
 * Everything here is scoped to one recipient by construction — there is no
 * "list all notifications" read, because there is no caller for one and its
 * existence would be one forgotten `WHERE` away from showing an operator
 * somebody else's feed.
 */

export interface Recipient {
  audience: NotificationAudience;
  /** `customer_accounts.id` or `admin_users.id`, per the audience. */
  id: string;
}

function ownedBy(recipient: Recipient) {
  if (recipient.audience === 'admin') return eq(notifications.adminUserId, recipient.id);
  return eq(notifications.customerAccountId, recipient.id);
}

/**
 * The category, taken from the type's own prefix — the same rule
 * `notificationCategory()` applies in the browser, expressed in SQL so the rail
 * can filter and count without a second column to keep in step.
 *
 * `split_part` rather than `LIKE 'order.%'`: it is exact about the separator, so
 * a future `orders.something` cannot be swept into `order` by a prefix match.
 */
const categoryOf = sql<string>`split_part(${notifications.type}, '.', 1)`;

export interface FeedFilter {
  category?: NotificationCategory | undefined;
  /** Hide anything already read. The rail's own toggle. */
  unreadOnly?: boolean | undefined;
}

function matching(recipient: Recipient, filter: FeedFilter) {
  const clauses = [ownedBy(recipient)];
  if (filter.category) clauses.push(sql`${categoryOf} = ${filter.category}`);
  if (filter.unreadOnly) clauses.push(isNull(notifications.readAt));
  return and(...clauses);
}

const FEED_COLUMNS = {
  id: notifications.id,
  type: notifications.type,
  data: notifications.data,
  orderId: notifications.orderId,
  readAt: notifications.readAt,
  createdAt: notifications.createdAt,
};

type FeedRow = {
  id: string;
  type: string;
  data: NotificationData;
  orderId: string | null;
  readAt: Date | null;
  createdAt: Date;
};

/** Wire shape. `type` stays a plain string — see the column's own comment. */
export function toView(row: FeedRow): NotificationView {
  return {
    id: row.id,
    type: row.type,
    data: row.data,
    orderId: row.orderId,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  } as NotificationView;
}

/**
 * Newest first, and always the newest page on a reconnect.
 *
 * The obvious alternative is a monotonic `bigserial` and `WHERE seq > :lastSeen`
 * driven by SSE's `Last-Event-ID`. It has a hole: a sequence value is taken when
 * the INSERT runs but the row becomes visible at COMMIT, and commits do not
 * finish in sequence order — a client that has already advanced past 42 would
 * never see the 41 that committed after it. Re-reading the newest page has no
 * such hole and costs one indexed query per reconnect.
 */
export async function findFeed(
  db: Database,
  recipient: Recipient,
  page: number,
  perPage: number,
  filter: FeedFilter = {},
): Promise<{
  rows: NotificationView[];
  total: number;
  unread: number;
  counts: Record<NotificationCategory | 'all', NotificationCategoryCount>;
}> {
  const where = matching(recipient, filter);

  const [rows, totals, counts] = await Promise.all([
    db
      .select(FEED_COLUMNS)
      .from(notifications)
      .where(where)
      .orderBy(desc(notifications.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ value: count() }).from(notifications).where(where),
    countByCategory(db, recipient),
  ]);

  return {
    rows: (rows as FeedRow[]).map(toView),
    total: totals[0]?.value ?? 0,
    // Across every category, whatever the filter — this is what the bell shows,
    // and a filtered count there would hide the work waiting on another tab.
    unread: counts.all.unread,
    counts,
  };
}

/**
 * Every category's totals in one grouped pass, unfiltered.
 *
 * Deliberately not one query per tab: the rail renders four numbers and would
 * otherwise cost four round trips on every page of every feed, to answer a
 * question one `GROUP BY` answers exactly.
 *
 * Categories with no rows are absent from the result, so the zeroed shape is
 * built first and filled in — a rail that dropped its empty tabs would rearrange
 * itself as notifications arrived.
 */
export async function countByCategory(
  db: Database,
  recipient: Recipient,
): Promise<Record<NotificationCategory | 'all', NotificationCategoryCount>> {
  const rows = await db
    .select({
      category: categoryOf,
      total: count(),
      unread: sql<number>`count(*) FILTER (WHERE ${notifications.readAt} IS NULL)::int`,
    })
    .from(notifications)
    .where(ownedBy(recipient))
    .groupBy(categoryOf);

  const counts = { all: { total: 0, unread: 0 } } as Record<
    NotificationCategory | 'all',
    NotificationCategoryCount
  >;
  for (const category of NOTIFICATION_CATEGORIES) counts[category] = { total: 0, unread: 0 };

  for (const row of rows) {
    counts.all.total += row.total;
    counts.all.unread += Number(row.unread);
    // A type written by a newer process belongs to no rail tab yet. It still
    // counts under "All", which is why that total is summed rather than filtered.
    const bucket = counts[row.category as NotificationCategory];
    if (bucket) {
      bucket.total = row.total;
      bucket.unread = Number(row.unread);
    }
  }

  return counts;
}

export async function countUnread(db: Database, recipient: Recipient): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(notifications)
    .where(and(ownedBy(recipient), isNull(notifications.readAt)));
  return row?.value ?? 0;
}

/**
 * One row, scoped to its recipient.
 *
 * The scope is not belt-and-braces: the hub reads by the id it was handed over
 * `pg_notify`, and a bug that routed an envelope to the wrong subscriber map
 * would otherwise deliver somebody else's notification in full.
 */
export async function findById(
  db: Database,
  recipient: Recipient,
  id: string,
): Promise<NotificationView | undefined> {
  const [row] = await db
    .select(FEED_COLUMNS)
    .from(notifications)
    .where(and(ownedBy(recipient), eq(notifications.id, id)))
    .limit(1);

  return row ? toView(row as FeedRow) : undefined;
}

/** Idempotent: marking a read notification read again writes nothing new. */
export async function markRead(db: Database, recipient: Recipient, ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;

  const rows = await db
    .update(notifications)
    .set({ readAt: sql`now()` })
    .where(and(ownedBy(recipient), inArray(notifications.id, ids), isNull(notifications.readAt)))
    .returning({ id: notifications.id });

  return rows.length;
}

export async function markAllRead(db: Database, recipient: Recipient): Promise<number> {
  const rows = await db
    .update(notifications)
    .set({ readAt: sql`now()` })
    .where(and(ownedBy(recipient), isNull(notifications.readAt)))
    .returning({ id: notifications.id });

  return rows.length;
}
