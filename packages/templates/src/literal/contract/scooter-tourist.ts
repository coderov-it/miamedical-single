import { articlesEn } from './component/articles.ts';
import { customerInfoEn } from './component/customer-info.ts';
import { depositClauseEn } from './component/deposit.ts';
import { contractHeader } from './component/header.ts';
import { itemsTableEn } from './component/items-table.ts';
import { contractLayout } from './component/layout.ts';
import { signatureBlockEn } from './component/signature.ts';
import type { ContractData } from './component/types.ts';

export function scooterTourist(data: ContractData): string {
  const title = 'Rental Agreement – Electric Scooter';
  return contractLayout({
    title,
    lang: 'en',
    body: `${contractHeader({ contractNumber: data.contractNumber, title, date: data.generatedAt })}
${customerInfoEn(data.customer)}
${itemsTableEn(data.items, data.subtotal, data.shippingTotal, data.total)}
${depositClauseEn(data.depositAmount ?? '300.00')}
${articlesEn(data.damages)}
${signatureBlockEn()}`,
  });
}
