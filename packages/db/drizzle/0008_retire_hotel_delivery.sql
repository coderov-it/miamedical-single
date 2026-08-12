-- Retires the `hotelDelivery` method. Home delivery covers every kind of address —
-- a house, a hotel, a holiday let, an airport hotel — so the method never named a
-- different way of delivering, only a different building.
--
-- A DATA migration, hand-written, because drizzle-kit generates schema diffs and
-- `orders.delivery` is jsonb: the shape it holds is not in the schema to diff. It
-- runs through the same journal as every other migration, so it applies exactly
-- once per environment.
--
-- The venue and the guest name become the delivery address, which is what they
-- always were in substance ("Hotel Duomo, Via Roma 12" + "Giulia Bianchi"). Nothing
-- is dropped and no total moves: this rewrites how the order describes itself, not
-- what it cost.

UPDATE orders
SET delivery =
      (delivery - 'hotelName' - 'guestName')
      || jsonb_build_object(
           'method',
           'homeDelivery',
           'deliveryAddress',
           NULLIF(
             concat_ws(
               ' · ',
               NULLIF(delivery ->> 'hotelName', ''),
               NULLIF(delivery ->> 'guestName', '')
             ),
             ''
           )
         )
WHERE delivery ->> 'method' = 'hotelDelivery';

-- Any row that carried the fields without the method: same fold, method left alone.
UPDATE orders
SET delivery =
      (delivery - 'hotelName' - 'guestName')
      || jsonb_build_object(
           'deliveryAddress',
           NULLIF(
             concat_ws(
               ' · ',
               COALESCE(NULLIF(delivery ->> 'deliveryAddress', ''), NULL),
               NULLIF(delivery ->> 'hotelName', ''),
               NULLIF(delivery ->> 'guestName', '')
             ),
             ''
           )
         )
WHERE delivery ? 'hotelName'
   OR delivery ? 'guestName';
