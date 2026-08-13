/**
 * Who a message is for. It decides three things, in three different pieces:
 * the document's `lang`, whether the contact footer is rendered, and whether the
 * plain-text body gets the same footer.
 *
 * It lives in its own file because `header` and `footer` both need it and neither
 * should have to import the other.
 */
export type Audience = 'customer' | 'internal';
