# Todos

## Cart content flashes on page load

`/carrello/` paints "La tua richiesta è vuota" before the real cart. The server
cannot read `localStorage`, so the empty state is the first paint and the island
replaces it after hydrating and re-pricing. Arriving from a product page does not
flash, because the URL carries the line.

Status: pending.
