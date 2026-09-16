import { type Env, env } from '../../config/env.ts';
import { ConsolePushSender } from './console.ts';
import { FcmPushSender } from './fcm.ts';
import type { PushSender } from './port.ts';

/**
 * The one place a push transport is chosen. Feature code imports `pushSender`
 * and never learns which one it got.
 *
 * A `Record` over the union rather than a ternary or a switch, matching
 * `infra/mail/index.ts`: adding a transport to `PUSH_TRANSPORT` without wiring it
 * here is then a type error rather than a runtime surprise.
 *
 * Unlike mail there is no production guard in `config/env.ts` refusing the
 * console transport. Mail carries magic links, so a console transport in
 * production locks every customer out; push carries a nudge about a fact the feed
 * already records, so the same misconfiguration costs a notification rather than
 * an account. It is reported by `logFeatureSummary()` at boot instead.
 */
const TRANSPORTS: Record<Env['PUSH_TRANSPORT'], () => PushSender> = {
  console: () => new ConsolePushSender(),
  fcm: () => new FcmPushSender(),
};

export const pushSender: PushSender = TRANSPORTS[env.PUSH_TRANSPORT]();

export type { PushAlert, PushMessage, PushResult, PushSender } from './port.ts';
