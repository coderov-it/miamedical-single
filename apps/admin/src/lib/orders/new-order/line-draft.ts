import type { MessageKey } from '~/lib/ui-text';
import type { LineProduct } from './types';

/**
 * One line of the order being drawn up: a catalogue product and the choices the
 * product asks about. There is no price anywhere here — the quote supplies it.
 */
export interface LineDraft {
  /** Stable identity for keyed rendering; never the array index. */
  key: number;
  product: LineProduct;
  quantity: number;
  packageCode: string;
  startDate: string;
  startTime: string;
  /** Add-on id → quantity; zero means not taken. */
  addons: Record<string, number>;
  /** Question key → chosen values. */
  answers: Record<string, string[]>;
}

let nextKey = 1;

export function newLine(product: LineProduct): LineDraft {
  return {
    key: nextKey++,
    product,
    quantity: 1,
    packageCode: '',
    startDate: '',
    startTime: '',
    addons: Object.fromEntries(product.addons.map((addon) => [addon.id, 0])),
    answers: {},
  };
}

export const isRental = (line: LineDraft): boolean => line.product.mode === 'rental';

export function packageOf(line: LineDraft) {
  return line.product.packages.find((pkg) => pkg.code === line.packageCode);
}

/** A package quoted in hours also needs a start time. */
export const needsTime = (line: LineDraft): boolean => packageOf(line)?.unit === 'hour';

const filled = (values: string[] | undefined): string[] =>
  (values ?? []).map((value) => value.trim()).filter((value) => value !== '');

/** Keys of the required questions the line has no answer for yet. */
export function missingAnswers(line: LineDraft): string[] {
  return line.product.questions
    .filter((question) => question.isRequired && filled(line.answers[question.key]).length === 0)
    .map((question) => question.key);
}

/** Whether the line says enough to be priced: package, start and required answers. */
export function isLineReady(line: LineDraft): boolean {
  if (line.quantity < 1 || missingAnswers(line).length > 0) return false;
  if (!isRental(line)) return true;
  if (!line.packageCode || !line.startDate) return false;
  return !needsTime(line) || line.startTime !== '';
}

/** The line as the API takes it: choices only. */
export function toWireItem(line: LineDraft) {
  const addons = Object.entries(line.addons)
    .filter(([, quantity]) => quantity > 0)
    .map(([id, quantity]) => ({ id, quantity }));
  const answers = Object.fromEntries(
    Object.entries(line.answers)
      .map(([key, values]) => [key, filled(values)] as const)
      .filter(([, values]) => values.length > 0),
  );
  return {
    productSlug: line.product.slug,
    productId: line.product.id,
    quantity: line.quantity,
    ...(isRental(line)
      ? {
          rentalPackageCode: line.packageCode,
          startDate: line.startDate,
          ...(needsTime(line) ? { startTime: line.startTime } : {}),
        }
      : {}),
    addons,
    answers,
  };
}

/**
 * What a line still lacks before it can be priced, named precisely: a package picked but
 * no date reads "Choose a start date", a date but no package reads "Choose a package".
 * Null once the line is ready.
 */
export function pendingMessage(line: LineDraft): MessageKey | null {
  if (isRental(line)) {
    if (!line.packageCode && !line.startDate) return 'newOrder.linePending';
    if (!line.packageCode) return 'newOrder.errorPackage';
    if (!line.startDate) return 'newOrder.errorStartDate';
    if (needsTime(line) && line.startTime === '') return 'newOrder.errorStartTime';
  }
  if (missingAnswers(line).length > 0) return 'newOrder.errorAnswer';
  return null;
}
