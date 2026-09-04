/**
 * The terms documents, on a page of their own.
 *
 * They are not part of any product: a document is written as its own row and a
 * product LINKS to it, so two products showing the same conditions share one
 * document rather than owning a copy each. Giving them a page rather than
 * repeating the body under every product that signs it is the same fact
 * expressed in the layout.
 *
 * Each product's metadata panel lists the documents it links to; this is where
 * the bodies are read.
 */
import type { TermsDocument } from '../../lib/types.ts';
import { escape, localizedRich } from './html.ts';

export function renderTermsPage(documents: readonly TermsDocument[]): string {
  if (documents.length === 0) return '';

  const body = documents
    .map((document) => {
      const italian = document.translations.it;
      const english = document.translations.en;

      return `<section class="panel" id="terms-${encodeURIComponent(document.code)}">
        <header class="panel-head">
          <h2>${escape(italian.title)}</h2>
          <span class="panel-note"><code>${escape(document.code)}</code></span>
        </header>
        <p class="eyebrow">
          <span class="flag status-${escape(document.status ?? 'draft')}">${escape(document.status ?? 'draft')}</span>
          <span class="flag">v${(document.version ?? 1).toString()}</span>
          <code>/${escape(italian.slug)}</code>
        </p>
        ${localizedRich(italian.body, english?.body)}
      </section>`;
    })
    .join('');

  return `<article class="page terms" data-page="terms" data-title="Terms documents">
    <header class="page-head">
      <p class="eyebrow"><span class="flag">${documents.length.toString()} documents</span></p>
      <h1>Terms documents</h1>
      <p class="lede muted">A product links to one; the row is written on its own.</p>
    </header>
    ${body}
  </article>`;
}
