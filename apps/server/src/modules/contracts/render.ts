import type { ContractData, ContractLanguage } from '@mia/templates';
import {
  carrozzInaItalian,
  carrozzinaTourist,
  isContractLanguage,
  scooterItalian,
  scooterTourist,
} from '@mia/templates';
import type { ContractVariant } from '@mia/validators';

import { httpError } from '../../shared/http/errors.ts';

export const TEMPLATE_MAP: Record<ContractVariant, (data: ContractData) => string> = {
  carrozzina_italian: carrozzInaItalian,
  carrozzina_tourist: carrozzinaTourist,
  scooter_italian: scooterItalian,
  scooter_tourist: scooterTourist,
};

/**
 * `contracts.language` is a plain `text` column, so a value that no contract
 * variant exists for is reachable — a hand-edited row, a restored backup, an
 * older writer. Throwing is the only correct answer: falling back to Italian
 * would render a legally different document under a number recorded as
 * something else, and that is worse than a 500.
 */
export function asContractLanguage(value: string): ContractLanguage {
  if (isContractLanguage(value)) return value;
  throw httpError(
    500,
    `Contract language "${value}" has no contract template. A contract is drafted per jurisdiction, not translated — see ContractLanguage in @mia/templates.`,
  );
}

export function defaultDamages(language: ContractLanguage): ContractData['damages'] {
  if (language === 'en') {
    return [
      { description: 'Scratches or cosmetic damage', amount: '50.00' },
      { description: 'Damaged wheels or tires', amount: '80.00' },
      { description: 'Bent or broken frame', amount: '200.00' },
      { description: 'Missing accessories (basket, cushion)', amount: '30.00' },
      { description: 'Electronic/motor damage (electric models)', amount: '350.00' },
      { description: 'Battery damage or loss (electric models)', amount: '250.00' },
      { description: 'Total loss or theft', amount: 'Full replacement value' },
    ];
  }
  return [
    { description: 'Graffi o danni estetici', amount: '50.00' },
    { description: 'Ruote o pneumatici danneggiati', amount: '80.00' },
    { description: 'Telaio piegato o rotto', amount: '200.00' },
    { description: 'Accessori mancanti (cestino, cuscino)', amount: '30.00' },
    { description: 'Danni al motore/elettronica (modelli elettrici)', amount: '350.00' },
    { description: 'Danno o smarrimento batteria (modelli elettrici)', amount: '250.00' },
    { description: 'Perdita totale o furto', amount: 'Valore integrale di sostituzione' },
  ];
}
