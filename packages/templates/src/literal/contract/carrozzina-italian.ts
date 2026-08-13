import { articlesIt } from './component/articles.ts';
import { customerInfoIt } from './component/customer-info.ts';
import { contractHeader } from './component/header.ts';
import { itemsTableIt } from './component/items-table.ts';
import { contractLayout } from './component/layout.ts';
import { signatureBlockIt } from './component/signature.ts';
import type { ContractData } from './component/types.ts';

export function carrozzInaItalian(data: ContractData): string {
  const title = 'Contratto di Noleggio – Carrozzina';
  return contractLayout({
    title,
    lang: 'it',
    body: `${contractHeader({ contractNumber: data.contractNumber, title, date: data.generatedAt })}
${customerInfoIt(data.customer)}
${itemsTableIt(data.items, data.subtotal, data.shippingTotal, data.total)}
${articlesIt(data.damages)}
${signatureBlockIt()}`,
  });
}
