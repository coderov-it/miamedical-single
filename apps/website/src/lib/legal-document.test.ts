/**
 * `renderDocument()` — what turns a stored legal document into a readable one.
 *
 * Worth testing rather than eyeballing on both halves. The ids end up in URLs
 * people send each other, so a heading that silently loses its anchor, or two
 * that collide on one, breaks a link that was correct yesterday. And the label
 * promotion decides what a 5,000-word pasted policy looks like: too eager and
 * it turns emphasised sentences into headings, too shy and the document is a
 * wall of undifferentiated paragraphs.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { renderDocument } from './legal-document.ts';

describe('renderDocument · heading anchors', () => {
  it('gives each h2 an id', () => {
    assert.equal(
      renderDocument('<h2>Titolare del trattamento</h2><p>…</p><h2>Conservazione dei dati</h2>'),
      '<h2 id="titolare-del-trattamento">Titolare del trattamento</h2><p>…</p>' +
        '<h2 id="conservazione-dei-dati">Conservazione dei dati</h2>',
    );
  });

  it('folds accents rather than dropping the words they sit on', () => {
    assert.equal(
      renderDocument('<h2>Perché trattiamo i dati</h2>'),
      '<h2 id="perche-trattiamo-i-dati">Perché trattiamo i dati</h2>',
    );
  });

  it('reads the words out of a heading that carries markup', () => {
    assert.equal(
      renderDocument('<h2><strong>I tuoi</strong> diritti</h2>'),
      '<h2 id="i-tuoi-diritti"><strong>I tuoi</strong> diritti</h2>',
    );
  });

  it('keeps repeated headings apart', () => {
    const html = renderDocument('<h2>Cookie</h2><h2>Cookie</h2><h2>Cookie</h2>');
    assert.deepEqual(html.match(/id="[^"]+"/g), ['id="cookie"', 'id="cookie-2"', 'id="cookie-3"']);
  });

  it('leaves a heading with no words alone', () => {
    assert.equal(renderDocument('<h2> </h2>'), '<h2> </h2>');
  });

  it('touches nothing else', () => {
    const body = '<h3>Sottosezione</h3><p>Testo con <a href="/carrello/">un link</a>.</p>';
    assert.equal(renderDocument(body), body);
  });
});

/**
 * Every case below is taken from the document actually published on this site —
 * an iubenda policy whose 40 section titles arrived as bold paragraphs.
 */
describe('renderDocument · bold paragraphs as section labels', () => {
  it('promotes a paragraph that is entirely one short bold run', () => {
    /* The `<strong>` goes with it: the heading is already bold, and keeping it
       would nest emphasis inside a heading that means the same thing. */
    assert.equal(
      renderDocument('<p><strong>Cookie Policy</strong></p><p>Testo.</p>'),
      '<h2 id="cookie-policy">Cookie Policy</h2><p>Testo.</p>',
    );
  });

  it('leaves an emphasised sentence alone', () => {
    const sentence =
      '<p><strong>Dichiaro di aver compreso l’informativa resa ai sensi dell’articolo 9 ' +
      'del regolamento (UE) 2016/679 e di acconsentire al trattamento.</strong></p>';

    assert.equal(renderDocument(sentence), sentence);
  });

  it('leaves a paragraph that merely ends in bold alone', () => {
    const mixed = '<p>Il conferimento dei dati è <strong>obbligatorio</strong></p>';
    assert.equal(renderDocument(mixed), mixed);
  });

  it('leaves a paragraph with two bold runs alone', () => {
    const two = '<p><strong>IBAN</strong> presso <strong>Banca</strong></p>';
    assert.equal(renderDocument(two), two);
  });

  it('never promotes inside a list item or a quote', () => {
    const nested =
      '<ol><li><p><strong>Statistica</strong></p></li></ol>' +
      '<blockquote><p><strong>Luogo</strong></p></blockquote>';

    assert.equal(renderDocument(nested), nested);
  });

  it('comes back out of a list and promotes what follows it', () => {
    assert.equal(
      renderDocument(
        '<ul><li><p><strong>Statistica</strong></p></li></ul><p><strong>Luogo</strong></p>',
      ),
      '<ul><li><p><strong>Statistica</strong></p></li></ul><h2 id="luogo">Luogo</h2>',
    );
  });

  it('keeps a trailing colon, which is a label, not a sentence', () => {
    assert.equal(renderDocument('<p><strong>Luogo:</strong></p>'), '<h2 id="luogo">Luogo:</h2>');
  });
});

describe('renderDocument · a paragraph that opens bold and carries on', () => {
  /*
    The regression that cost 26 of this document's 40 section labels: the
    paragraph below opens with `<p><strong>` but does not end with
    `</strong></p>`, so a lazy match ran on to the next one far below, ate the
    list in between, and left the nesting counter stuck inside a list item for
    the rest of the document.
  */
  it('does not swallow the structure after it', () => {
    const html =
      '<p><strong>Indirizzo email del Titolare:</strong> info@example.it</p>' +
      '<ul><li>Dati di utilizzo</li></ul>' +
      '<p><strong>Cookie Policy</strong></p>';

    assert.equal(
      renderDocument(html),
      '<p><strong>Indirizzo email del Titolare:</strong> info@example.it</p>' +
        '<ul><li>Dati di utilizzo</li></ul>' +
        '<h2 id="cookie-policy">Cookie Policy</h2>',
    );
  });

  it('keeps promoting after a list that follows one', () => {
    const html =
      '<p><strong>Titolare:</strong> Mia Medical</p>' +
      '<ul><li><p><strong>Statistica</strong></p></li></ul>' +
      '<p><strong>Diritti dell’Utente</strong></p>' +
      '<p><strong>Definizioni</strong></p>';

    const out = renderDocument(html);
    assert.deepEqual(out.match(/<h2 id="[^"]+"/g), [
      '<h2 id="diritti-dell-utente"',
      '<h2 id="definizioni"',
    ]);
    /* The one inside the list item is still left where it is. */
    assert.ok(out.includes('<li><p><strong>Statistica</strong></p></li>'));
  });
});
