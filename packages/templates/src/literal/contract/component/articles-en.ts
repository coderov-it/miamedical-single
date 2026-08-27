import { escapeHtml } from './escape.ts';
import type { ContractDamageItem } from './types.ts';

/**
 * The English (tourist) legal articles, transcribed from the company's official
 * contracts (`blank-contracts /*.pdf`) with clerical errors corrected: "THE BEST
 * PARTS INDICATED A TERGO"→"the parties", "Pawn the goods"→"handle the goods",
 * "the agreed freight"→"the agreed rental fee", "on the plate of"→"on the first
 * page of", "early retunr"→"early return". Wording changes beyond clerical fixes
 * need office sign-off.
 */

const INTRO_EN = '<p class="intro-line">The parties to this contract agree as follows:</p>';

const ART_1_EN = `<div class="article">
  <div class="article-title">Art. 1 – Subject of the contract</div>
  <div class="article-body">The user rents the property indicated on the first page, owned by MIA MEDICAL ITALIA SRL, which he/she declares to be in good working order and maintenance.</div>
</div>`;

function obligationsArticleEn(returnWording: string): string {
  return `<div class="article">
  <div class="article-title">Art. 2 – Obligations and responsibilities of the parties</div>
  <div class="article-body">
    <p><strong>MIA MEDICAL ITALIA SRL undertakes:</strong></p>
    <ul>
      <li>To deliver the rental property in perfect working order and with the certifications required by law.</li>
    </ul>
    <p><strong>The user undertakes:</strong></p>
    <ul>
      <li>To use, keep and store the rented goods with the utmost diligence.</li>
      <li>To handle the goods according to the instructions provided.</li>
      <li>To pay the agreed rental fee as set out in this contract.</li>
      <li>${returnWording}</li>
      <li>To pay, in the event of damage/destruction/theft of the asset, also dependent on third parties, the costs of repairing or repurchasing the asset. Any damage and/or missing parts, etc., will be charged to the renter according to the price table.</li>
    </ul>
    <p class="clause-critical">The customer is reminded that he/she is liable to us in the event of loss or damage to the aid, change of delivery address, late delivery and other costs which may arise during the rental period.</p>
  </div>
</div>`;
}

const ART_3_EN = `<div class="article">
  <div class="article-title">Art. 3 – Duration of the lease</div>
  <div class="article-body">The duration of the lease is indicated on the first page of this contract. It is valid from the day of delivery and expires on the day of return of the goods to the MIA MEDICAL offices or to the person appointed for the collection.</div>
</div>`;

function generalProvisionsEn(number: number): string {
  return `<div class="article">
  <div class="article-title">Art. ${number} – General provisions</div>
  <div class="article-body">Any modification to this contract must be made in writing and signed by both parties under penalty of nullity. Read, confirmed and signed.</div>
</div>`;
}

const GDPR_EN = `<div class="article">
  <div class="article-title">Data protection</div>
  <div class="article-body">The customer's personal data will be processed in compliance with EU Regulation 2016/679 (GDPR) and applicable Italian law, exclusively for the purpose of executing this contract.</div>
</div>`;

function damagePriceListEn(damages: ContractDamageItem[]): string {
  if (damages.length === 0) return '';
  const rows = damages
    .map(
      (d) =>
        `<tr><td>${escapeHtml(d.description)}</td><td class="num">€${escapeHtml(d.amount)}</td></tr>`,
    )
    .join('\n');
  return `<div class="article">
  <div class="article-title">Price list for any damages</div>
  <div class="damage-list">
    <table>
      <thead><tr><th>Description</th><th class="num">Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</div>`;
}

/** "Lease Agreement for Wheelchair and Walker" — tourists, no deposit. */
export function articlesEnWheelchair(damages: ContractDamageItem[]): string {
  const paymentArticle = `<div class="article">
  <div class="article-title">Art. 4 – Price/method and terms of payment</div>
  <div class="article-body">
    <p>For the rented property, the user owes the renter the amount indicated on the first page of this contract, which will be paid in the manner indicated therein.</p>
    <p><strong>There is no financial refund and/or credit note of the amount paid in the event of early return of the rented property, for any reason and cause.</strong></p>
  </div>
</div>`;

  return `<h2>Terms and Conditions</h2>
${INTRO_EN}
${ART_1_EN}
${obligationsArticleEn('To return the rented property at the expiry of the contract.')}
${damagePriceListEn(damages)}
${ART_3_EN}
${paymentArticle}
${generalProvisionsEn(5)}
${GDPR_EN}`;
}

/** "Lease Agreement for Electric Scooter" — tourists, with security deposit. */
export function articlesEnScooterDeposit(
  damages: ContractDamageItem[],
  depositAmount: string,
): string {
  const depositArticle = `<div class="article">
  <div class="article-title">Art. 4 – Security deposit</div>
  <div class="article-body">The Lessee shall pay to the Lessor, at the time of signing the present contract, the sum of €${escapeHtml(depositAmount)} as security/penalty deposit for each rented equipment, which shall be returned to the Lessee upon return of the equipment(s), once it has been ascertained that there are no defects or damage to the equipment(s), if paid in cash, or automatically released at the end of the rental period if held by credit card with pre-authorisation procedure. The security deposit may be used in whole or in part to cover any damage caused during the rental period, with the addition of the cost of the damage assessment if necessary. The Lessee undertakes to indemnify the Lessor for any damage resulting from the theft of the item(s) or parts thereof. Description of charge or penalty on security deposit: theft or loss of property from €300.00 to €1,500.00.</div>
</div>`;

  return `<h2>Terms and Conditions</h2>
${INTRO_EN}
${ART_1_EN}
${obligationsArticleEn('To return the rented property at the end of the contract.')}
${ART_3_EN}
${depositArticle}
${damagePriceListEn(damages)}
${generalProvisionsEn(5)}
${GDPR_EN}`;
}
