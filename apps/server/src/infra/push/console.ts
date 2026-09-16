import type { PushMessage, PushResult, PushSender } from './port.ts';

/**
 * Prints the message instead of sending it.
 *
 * Not a stub for convenience. Push is the one channel with no local equivalent —
 * there is no inbox to open and no device in a dev environment — so without this
 * the whole dispatcher, the claim query, the preference check and the message
 * builder would be untestable until a Firebase project and a signed app build
 * both existed. With it, every decision this system makes is observable from
 * `pnpm dev` and a placed order.
 *
 * It prints the localization KEY rather than resolving it, because the key is
 * what a real device would receive and resolving it here would hide the one
 * failure this transport is best placed to catch: a key that no string resource
 * defines.
 */
export class ConsolePushSender implements PushSender {
  send(message: PushMessage): Promise<PushResult> {
    const alert =
      message.alert.kind === 'localized'
        ? `${message.alert.titleKey} / ${message.alert.bodyKey} ${JSON.stringify(message.alert.bodyArgs)}`
        : `${message.alert.title} — ${message.alert.body}`;

    console.log(
      [
        '┌─ push ───────────────────────────────────────────────',
        `│ token  ${message.token.slice(0, 12)}…`,
        `│ alert  ${alert}`,
        `│ data   ${JSON.stringify(message.data)}`,
        '└──────────────────────────────────────────────────────',
      ].join('\n'),
    );

    return Promise.resolve({ ok: true });
  }
}
