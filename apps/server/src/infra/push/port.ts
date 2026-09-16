/**
 * Outbound push port. Feature code depends on `PushSender`; the concrete
 * transport is chosen once in ./index.ts and imported as a singleton, exactly as
 * `infra/mail/` does.
 *
 * Never feature policy. Which events may reach a phone, whose phone, and in what
 * language are decisions for `modules/push`; a transport only knows how to hand
 * one message to one token.
 */

/**
 * What the OS is asked to draw. Two shapes, and which one is used is decided per
 * device rather than per message — see `modules/push/message.ts`.
 *
 * `localized` carries a key the OS resolves against the app's own string
 * resources, so no translated prose crosses the wire and the phone's locale
 * picks the language. `rendered` carries the finished sentence, for a build that
 * predates the key.
 */
export type PushAlert =
  | {
      kind: 'localized';
      /** A `strings.xml` / `Localizable.strings` name, e.g. `order_status_changed_paid_title`. */
      titleKey: string;
      bodyKey: string;
      /**
       * Positional, and printed verbatim by the OS formatter. Never a status,
       * never a formatted date — anything that needs translating belongs in the
       * key. All strings, because both platforms' formatters expect strings even
       * where the placeholder looks numeric.
       */
      bodyArgs: string[];
    }
  | { kind: 'rendered'; title: string; body: string };

export interface PushMessage {
  token: string;
  alert: PushAlert;
  /**
   * The tap payload. Every value is a string because FCM permits nothing else in
   * `data`, so numbers and dates are stringified by the caller rather than
   * silently coerced here.
   */
  data: Record<string, string>;
}

/**
 * Why a send failed, in the only two categories a caller acts on differently.
 *
 * A result rather than an exception because the dispatcher sends to every device
 * an account holds: one dead handset must not abort the fan-out to the other
 * three, and `Promise.allSettled` over throwing adapters would turn every
 * ordinary outcome into a rejection to unwrap.
 */
export type PushResult =
  | { ok: true }
  | {
      ok: false;
      /**
       * The token is gone for good — app uninstalled, or the OS retired it. The
       * dispatcher deletes the row on this, which is the only way `push_devices`
       * stays clean: nothing else ever tells us an app was removed.
       */
      deadToken: boolean;
      reason: string;
    };

export interface PushSender {
  send(message: PushMessage): Promise<PushResult>;
}
