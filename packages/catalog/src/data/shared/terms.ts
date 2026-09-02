/**
 * Terms & conditions documents. A product links to one; it does not own it, so
 * the same document is signed by every product pointing at it.
 *
 * `defineTerms` brands what it returns, so a product's `terms` accepts only a
 * document this function produced — a document has to exist as its own row
 * before anything can link to it.
 */
import { defineTerms } from '../../lib/define.ts';

export const generalRental = defineTerms({
  code: 'general-rental',
  status: 'published',
  translations: {
    it: {
      title: 'Condizioni generali di noleggio',
      slug: 'condizioni-generali-di-noleggio',
      body: '<h2>Oggetto</h2><p>Il presente contratto disciplina il noleggio di ausili medicali.</p>',
    },
  },
});

/** Scooters and electric wheelchairs take a deposit — a different document. */
export const depositRental = defineTerms({
  code: 'deposit-rental',
  status: 'published',
  translations: {
    it: {
      title: 'Condizioni di noleggio con deposito',
      slug: 'condizioni-di-noleggio-con-deposito',
      body: '<h2>Deposito cauzionale</h2><p>Al ritiro è richiesto un deposito.</p>',
    },
  },
});

export const salesTerms = defineTerms({
  code: 'sales',
  status: 'published',
  translations: {
    it: {
      title: 'Condizioni di vendita',
      slug: 'condizioni-di-vendita',
      body: '<h2>Garanzia</h2><p>I prodotti sono coperti da garanzia legale.</p>',
    },
  },
});
