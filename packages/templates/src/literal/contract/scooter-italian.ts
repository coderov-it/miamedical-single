import { articlesIt } from './component/articles.ts';
import { customerInfoIt } from './component/customer-info.ts';
import { depositClauseIt } from './component/deposit.ts';
import { contractHeader } from './component/header.ts';
import { itemsTableIt } from './component/items-table.ts';
import { contractLayout } from './component/layout.ts';
import { signatureBlockIt } from './component/signature.ts';
import type { ContractData } from './component/types.ts';

export function scooterItalian(data: ContractData): string {
  const title = 'Contratto di Noleggio – Scooter Elettrico';
  return contractLayout({
    title,
    lang: 'it',
    body: `${contractHeader({ contractNumber: data.contractNumber, title, date: data.generatedAt })}
${customerInfoIt(data.customer)}
${itemsTableIt(data.items, data.subtotal, data.shippingTotal, data.total)}
${depositClauseIt(data.depositAmount ?? '300.00')}
${articlesIt(data.damages)}
${signatureBlockIt()}`,
  });
}
