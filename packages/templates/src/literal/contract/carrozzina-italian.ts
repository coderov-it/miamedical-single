import { articlesItGeneral } from './component/articles-it.ts';
import { bankDetailsIt } from './component/bank-details.ts';
import { customerInfoIt } from './component/customer-info.ts';
import { contractHeader } from './component/header.ts';
import { itemsTableIt } from './component/items-table.ts';
import { contractLayout } from './component/layout.ts';
import { signatureBlockIt } from './component/signature.ts';
import { importantNoticeIt } from './component/warning.ts';
import type { ContractData } from './component/types.ts';

export function carrozzInaItalian(data: ContractData): string {
  const title = 'Contratto di locazione per dispositivi medicali';
  return contractLayout({
    title,
    lang: 'it',
    body: `${contractHeader({ contractNumber: data.contractNumber, title, date: data.generatedAt })}
${customerInfoIt(data.customer)}
${itemsTableIt(data.items, data.subtotal, data.shippingTotal, data.total)}
${bankDetailsIt()}
${importantNoticeIt()}
${articlesItGeneral(data.damages)}
${signatureBlockIt(data.signature)}`,
  });
}
