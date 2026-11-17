/**
 * The branches a customer can collect from. One source for the storefront's
 * contact page and checkout and for the back office's phone-order wizard, and the
 * list `delivery.pickupCity` is checked against: an order never names a branch
 * the company does not have.
 */
export const BRANCHES = [
  { city: 'Roma', street: 'Via Gian Pietro Talamini 44' },
  { city: 'Firenze', street: 'Viale Guidoni 129' },
] as const;

export const BRANCH_CITIES = BRANCHES.map((branch) => branch.city) as [
  (typeof BRANCHES)[number]['city'],
  ...(typeof BRANCHES)[number]['city'][],
];

export type BranchCity = (typeof BRANCHES)[number]['city'];
