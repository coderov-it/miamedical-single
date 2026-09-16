import type { Database } from '@mia/db';
import { listenerClient } from '@mia/db';
import type { SSEStreamingApi } from 'hono/streaming';

import { dispatch } from '../push/dispatch.ts';
import * as repo from './repo.ts';
import { NOTIFY_CHANNEL, type NotificationEnvelope } from './types.ts';

/**
 * The push half: one process-wide `LISTEN`, one map from recipient to open
 * streams, and one heartbeat timer for all of them.
 *
 * `LISTEN` has no backlog — a payload sent while nothing is listening is simply
 * gone. That is tolerable only because the row is already committed and the next
 * snapshot fetch returns it, which is why the snapshot is mandatory rather than
 * an optimisation and why the stream is described throughout as a hint.
 *
 * Under pm2 cluster mode every worker listens independently and Postgres
 * delivers to all of them, so scaling out needs no change here: no router, no
 * Redis, no cross-process bus. An in-process emitter would have needed all three
 * the moment a second worker appeared.
 */

/** `${audience}:${recipientId}` → their open tabs. */
const streams = new Map<string, Set<SSEStreamingApi>>();

/**
 * 25 seconds, chosen against the two timeouts in front of us: nginx's
 * `proxy_read_timeout` default of 60s and Cloudflare's roughly 100s idle limit.
 *
 * It is doing a second job that matters more than either. With no traffic a dead
 * socket looks exactly like a quiet one, so the heartbeat write is the only way
 * the server ever learns that a closed tab is gone.
 */
const HEARTBEAT_MS = 25_000;

/**
 * One timer walking the map, not `stream.sleep()` inside each connection's own
 * loop. At ten thousand streams the per-connection version is ten thousand
 * pending timers and ten thousand pending promises to save a single
 * `setInterval`.
 */
let heartbeat: NodeJS.Timeout | null = null;

function keyOf(recipient: repo.Recipient): string {
  return `${recipient.audience}:${recipient.id}`;
}

/** Registers an open stream. The returned function unregisters it. */
export function subscribe(recipient: repo.Recipient, stream: SSEStreamingApi): () => void {
  const key = keyOf(recipient);
  const open = streams.get(key) ?? new Set<SSEStreamingApi>();
  open.add(stream);
  streams.set(key, open);
  startHeartbeat();

  return () => {
    const current = streams.get(key);
    if (!current) return;
    current.delete(stream);
    // Drop the empty Set rather than leaving it: the map is keyed by recipient,
    // so keeping them would grow it by one entry per customer, forever.
    if (current.size === 0) streams.delete(key);
    if (streams.size === 0) stopHeartbeat();
  };
}

export function openStreamCount(): number {
  let total = 0;
  for (const open of streams.values()) total += open.size;
  return total;
}

/**
 * Opens the listener. Called once at boot; the returned handle unlistens.
 *
 * `onlisten` fires on the first LISTEN *and on every reconnect*, and a reconnect
 * is precisely when a gap may have opened. Telling every open stream to resync
 * on that edge is what closes it — one indexed query per connected recipient,
 * against a connection drop that is rare.
 */
export async function start(db: Database): Promise<{ unlisten: () => Promise<void> }> {
  const sql = listenerClient(db);

  const handle = await sql.listen(
    NOTIFY_CHANNEL,
    (payload) => {
      void deliver(db, payload);
    },
    () => {
      broadcast('resync', {});
    },
  );

  console.log(`[notifications] listening on ${NOTIFY_CHANNEL}`);
  return { unlisten: handle.unlisten };
}

/**
 * One envelope in, zero or more SSE frames out.
 *
 * The row is read only when somebody is watching for it, which is what makes a
 * customer with nothing open cost nothing — not even the query. At ten thousand
 * idle visitors and a handful of orders a minute, that is almost all of them.
 */
async function deliver(db: Database, payload: string): Promise<void> {
  const envelope = parseEnvelope(payload);
  if (!envelope) return;

  const recipient: repo.Recipient = { audience: envelope.audience, id: envelope.recipientId };

  /* Push runs regardless of whether a stream is open, and deliberately not in an
     `else`. An open tab on a laptop says nothing about whether the phone in
     somebody's pocket should stay quiet, and treating the two as alternatives
     would mean the customer most likely to be watching — the one with the app in
     the foreground — is the one whose lock screen never lights up.

     Every worker receives this same payload, which is exactly why `dispatch`
     claims the row before sending rather than trusting that only one of them got
     here. It is fire-and-forget: a push failure must not delay the SSE frame. */
  if (envelope.audience === 'customer') {
    void dispatch(db, envelope.id).catch((error: unknown) => {
      console.error('[push] dispatch failed', envelope.id, error);
    });
  }

  const open = streams.get(keyOf(recipient));
  if (!open?.size) return;

  try {
    const row = await repo.findById(db, recipient, envelope.id);
    // Deleted between COMMIT and this read, or routed to the wrong map: either
    // way there is nothing to push and the next snapshot is still correct.
    if (!row) return;

    for (const stream of open) await write(stream, 'notification', row);
  } catch (error) {
    /* The row is committed and the feed re-reads on reconnect, so a failed push
       costs a delay, not a notification. Failing louder here would mean an
       unreadable database taking the listener down with it. */
    console.error('[notifications] failed to deliver', envelope.id, error);
  }
}

function parseEnvelope(payload: string): NotificationEnvelope | null {
  try {
    const parsed = JSON.parse(payload) as Partial<NotificationEnvelope>;
    if (typeof parsed.id !== 'string' || typeof parsed.recipientId !== 'string') return null;
    if (parsed.audience !== 'customer' && parsed.audience !== 'admin') return null;
    return parsed as NotificationEnvelope;
  } catch {
    // A payload on our channel that is not our envelope: another process, an
    // older version, a psql session. Not ours to act on and not an error.
    return null;
  }
}

/** Tells every open stream to re-read. Used on reconnect. */
function broadcast(event: string, data: unknown): void {
  for (const open of streams.values()) {
    for (const stream of open) void write(stream, event, data);
  }
}

/**
 * A write to a stream the client has already abandoned throws, and there is
 * nothing useful to do about it — the abort handler is what removes it from the
 * map. Swallowing here keeps one dead tab from ending a fan-out midway through
 * and leaving the rest of a recipient's tabs unnotified.
 */
async function write(stream: SSEStreamingApi, event: string, data: unknown): Promise<void> {
  if (stream.closed || stream.aborted) return;
  try {
    await stream.writeSSE({ event, data: JSON.stringify(data) });
  } catch {
    // Gone. The route's `onAbort` unsubscribes it.
  }
}

function startHeartbeat(): void {
  if (heartbeat) return;
  heartbeat = setInterval(() => {
    for (const open of streams.values()) {
      for (const stream of open) void write(stream, 'ping', Date.now());
    }
  }, HEARTBEAT_MS);
  // Never a reason to keep the process alive.
  heartbeat.unref();
}

function stopHeartbeat(): void {
  if (!heartbeat) return;
  clearInterval(heartbeat);
  heartbeat = null;
}
