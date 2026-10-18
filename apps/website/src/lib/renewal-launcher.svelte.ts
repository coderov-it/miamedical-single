/**
 * Opens the renewal modal from anywhere in the account island.
 *
 * The modal is mounted ONCE, by `AccountApp`, so every "Prolunga" — the order's
 * rental card, an extend-offer notification, an email's `?renew=1` link —
 * opens the same three steps instead of each screen growing its own copy.
 *
 *   rental card "Prolunga il noleggio"   → open('MIA-2026-001042')
 *   modal "Conferma la proroga" succeeds → placed += 1, the card reloads
 *   modal closed                         → orderNumber = null
 */
export class RenewalLauncher {
  /** The order the modal is renewing, or null while it is closed. */
  orderNumber = $state<string | null>(null);
  /** Bumped after each successful renewal, so whatever shows that order reloads. */
  placed = $state(0);

  open(orderNumber: string): void {
    this.orderNumber = orderNumber;
  }

  close(): void {
    this.orderNumber = null;
  }

  markPlaced(): void {
    this.placed += 1;
  }
}
