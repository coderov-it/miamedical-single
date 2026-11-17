/**
 * What the client can know is wrong without asking the server, one function per
 * wizard step. Every issue is `path → message`, the same shape as the server's
 * 422 `fields`, so both are marked by the same code (form-errors.ts).
 */

import { t } from '~/lib/ui-text';
import { isRental, missingAnswers, needsTime } from './line-draft';
import type { OrderForm } from './order-form.svelte';
import type { StepId } from './types';

export const ZERO = '0.00';
export const blank = (value: string) => value.trim() === '';
const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

type Issues = Record<string, string>;

function productsIssues(form: OrderForm): Issues {
  return form.lines.length === 0 ? { items: t('newOrder.errorNoLines') } : {};
}

function packagesIssues(form: OrderForm): Issues {
  const issues: Issues = { ...productsIssues(form) };
  form.lines.forEach((line, index) => {
    const at = `items.${index}`;
    if (isRental(line)) {
      if (!line.packageCode) issues[`${at}.rentalPackageCode`] = t('newOrder.errorPackage');
      if (!line.startDate) issues[`${at}.startDate`] = t('newOrder.errorStartDate');
      if (needsTime(line) && !line.startTime) {
        issues[`${at}.startTime`] = t('newOrder.errorStartTime');
      }
    }
    for (const key of missingAnswers(line)) {
      issues[`${at}.answers.${key}`] = t('newOrder.errorAnswer');
    }
  });
  return issues;
}

function customerIssues(form: OrderForm): Issues {
  const issues: Issues = {};
  if (!looksLikeEmail(form.email.trim())) issues.email = t('newOrder.errorEmail');
  if (form.deliveryMethod === 'homeDelivery' && blank(form.address)) {
    issues['delivery.address'] = t('newOrder.errorAddress');
  }
  if (form.deliveryMethod === 'storePickup' && blank(form.pickupCity)) {
    issues['delivery.pickupCity'] = t('newOrder.errorPickup');
  }
  if (!form.returnToSameAddress && blank(form.returnAddress)) {
    issues['delivery.returnAddress'] = t('newOrder.errorReturnAddress');
  }
  return issues;
}

function reviewIssues(form: OrderForm): Issues {
  if (form.discountAmount !== ZERO && blank(form.discountReason)) {
    return { reason: t('newOrder.errorReason') };
  }
  return {};
}

const CHECKS: Record<StepId, (form: OrderForm) => Issues> = {
  products: productsIssues,
  packages: packagesIssues,
  customer: customerIssues,
  review: reviewIssues,
};

export const stepIssues = (form: OrderForm, step: StepId): Issues => CHECKS[step](form);
