/**
 * Pressoterapia, assembled — one line per product file.
 */

import { pressotherapyHire } from './category.ts';
import { powerpress4 } from './powerpress-4.ts';
import { powerpress4Alt } from './powerpress-4-alt.ts';

export default pressotherapyHire.withProducts([
  powerpress4,
  powerpress4Alt,
]);
