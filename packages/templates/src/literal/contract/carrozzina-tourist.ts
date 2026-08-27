import { articlesEnWheelchair } from './component/articles-en.ts';
import { customerInfoEn } from './component/customer-info.ts';
import { contractHeader } from './component/header.ts';
import { itemsTableEn } from './component/items-table.ts';
import { contractLayout } from './component/layout.ts';
import { signatureBlockEn } from './component/signature.ts';
import { importantNoticeEn } from './component/warning.ts';
import type { ContractData } from './component/types.ts';

export function carrozzinaTourist(data: ContractData): string {
  const title = 'Lease Agreement for Wheelchair and Walker';
  return contractLayout({
    title,
    lang: 'en',
    body: `${contractHeader({ contractNumber: data.contractNumber, title, date: data.generatedAt })}
${customerInfoEn(data.customer)}
${itemsTableEn(data.items, data.subtotal, data.shippingTotal, data.total)}
${importantNoticeEn()}
${articlesEnWheelchair(data.damages)}
${signatureBlockEn(data.signature)}`,
  });
}
