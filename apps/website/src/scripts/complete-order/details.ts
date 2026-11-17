/**
 * The details step: the customer's own name, phone and fiscal identifier, saved to the order.
 *
 *   "Salva i dati"  gate: first name, last name, phone, and the fiscal field(s) the type needs
 *                   → PUT /api/order-links/details → the summary back, the next step opens
 *   server 422      the server's `fields` keep their messages showing until edited
 *   contract signed the form gives way to a one-line note (the contract states these details)
 *
 * The button is never disabled and a click never returns silently: the gate marks every
 * missing field, scrolls to the first and moves focus there (lib/form-validation.ts).
 */
import { createFormGate } from '~/lib/form-validation';

import type { AccountCopyData } from '../account/copy';
import { type LinkClient, LinkError } from './client.ts';
import type { CustomerType, DetailsBody, GoneReason, LinkSummary } from './types.ts';

export interface DetailsStep {
  /** Fills the form from the order and shows it, or the frozen note once signed. */
  paint: (summary: LinkSummary) => void;
  /** True while what is typed differs from what was last saved. */
  isDirty: () => boolean;
  /** Tells the customer, at the save button, to save first; moves focus there. */
  demandSave: (message: string) => void;
  /** Marks fields a later step's 409 named, as a failed save would. */
  markFields: (fields: Record<string, string>) => void;
}

export interface DetailsOptions {
  client: LinkClient;
  copy: AccountCopyData;
  onSaved: (summary: LinkSummary) => void;
  onGone: (reason: GoneReason | null) => void;
}

export function createDetailsStep(root: HTMLElement, options: DetailsOptions): DetailsStep {
  const form = root.querySelector<HTMLFormElement>('[data-co-details-form]')!;
  const note = root.querySelector<HTMLElement>('[data-co-details-note]')!;
  const failure = root.querySelector<HTMLElement>('[data-co-details-error]')!;
  const saveButton = form.querySelector<HTMLButtonElement>('[data-co-details-save]')!;
  const chips = [...form.querySelectorAll<HTMLButtonElement>('[data-customer-type]')];
  const say = (key: string) => options.copy.text[key] ?? '';

  const field = (name: string) => form.querySelector<HTMLInputElement>(`[data-field="${name}"]`)!;
  const value = (name: string) => field(name).value.trim();
  const blocks = (type: string) => form.querySelectorAll<HTMLElement>(`[data-when-type="${type}"]`);

  let type: CustomerType = 'private';
  let saved = '';
  let busy = false;
  /** Gate keys the server refused; each stays marked until its field is edited. */
  const refused = new Set<string>();

  const needs = (key: string, when: (t: CustomerType) => boolean, name: string) => ({
    key,
    isSatisfied: () => !refused.has(key) && (!when(type) || value(name) !== ''),
    controls: () => [field(name)],
  });
  const gate = createFormGate(
    form,
    [
      needs('firstName', () => true, 'firstName'),
      needs('lastName', () => true, 'lastName'),
      needs('phone', () => true, 'phone'),
      needs('codiceFiscale', (t) => t === 'private', 'privateCodiceFiscale'),
      needs('partitaIva', (t) => t === 'company', 'partitaIva'),
      needs('companyCodiceFiscale', (t) => t === 'company', 'companyCodiceFiscale'),
    ],
    { announce: form.querySelector<HTMLElement>('[data-co-announce="details"]') },
  );

  function selectType(next: CustomerType): void {
    type = next;
    for (const chip of chips) {
      const on = chip.dataset.customerType === next;
      chip.setAttribute('aria-pressed', String(on));
      chip.setAttribute('aria-checked', String(on));
    }
    for (const block of blocks('private')) block.hidden = next !== 'private';
    for (const block of blocks('company')) block.hidden = next !== 'company';
    gate.refresh();
  }

  function snapshot(): string {
    return JSON.stringify([
      type,
      value('firstName'),
      value('lastName'),
      value('phone'),
      value('privateCodiceFiscale'),
      value('partitaIva'),
      value('companyCodiceFiscale'),
    ]);
  }

  function body(): DetailsBody {
    const result: DetailsBody = {
      firstName: value('firstName'),
      lastName: value('lastName'),
      phone: value('phone'),
      customerType: type,
    };
    if (type === 'private') result.codiceFiscale = value('privateCodiceFiscale');
    if (type === 'company') {
      result.codiceFiscale = value('companyCodiceFiscale');
      result.partitaIva = value('partitaIva');
    }
    return result;
  }

  /** The server's field name → this form's gate key. */
  function gateKey(serverField: string): string | null {
    if (serverField === 'codiceFiscale')
      return type === 'company' ? 'companyCodiceFiscale' : 'codiceFiscale';
    if (['firstName', 'lastName', 'phone', 'partitaIva'].includes(serverField)) return serverField;
    return null;
  }

  function markFields(fields: Record<string, string>): void {
    for (const name of Object.keys(fields)) {
      const key = gateKey(name);
      if (key) refused.add(key);
    }
    gate.enforce();
  }

  function paint(summary: LinkSummary): void {
    const { customer } = summary;
    const frozen = summary.contractSigned;
    form.hidden = frozen;
    failure.hidden = true;
    note.hidden = !frozen;
    if (frozen) {
      note.textContent = say('completeOrder.details.frozen');
      return;
    }
    field('firstName').value = customer.firstName ?? '';
    field('lastName').value = customer.lastName ?? '';
    field('phone').value = customer.phone ?? '';
    field('privateCodiceFiscale').value =
      customer.customerType === 'private' ? (customer.codiceFiscale ?? '') : '';
    field('companyCodiceFiscale').value =
      customer.customerType === 'company' ? (customer.codiceFiscale ?? '') : '';
    field('partitaIva').value = customer.partitaIva ?? '';
    selectType(customer.customerType ?? 'private');
    saved = snapshot();
  }

  async function save(): Promise<void> {
    failure.hidden = true;
    note.hidden = true;
    if (!gate.enforce()) return;
    /* A second press while the request is out is ignored, not blocked: the button stays live. */
    if (busy) return;
    busy = true;
    saveButton.setAttribute('aria-busy', 'true');
    try {
      const summary = await options.client.saveDetails(body());
      refused.clear();
      saved = snapshot();
      note.textContent = say('completeOrder.details.saved');
      note.hidden = false;
      options.onSaved(summary);
    } catch (error) {
      reject(error);
    } finally {
      busy = false;
      saveButton.removeAttribute('aria-busy');
    }
  }

  function reject(error: unknown): void {
    if (error instanceof LinkError && error.status === 410) {
      options.onGone(error.reason);
      return;
    }
    if (
      error instanceof LinkError &&
      error.status === 422 &&
      Object.keys(error.fields).length > 0
    ) {
      markFields(error.fields);
      return;
    }
    failure.textContent = say('completeOrder.details.saveError');
    failure.hidden = false;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void save();
  });
  for (const chip of chips) {
    chip.addEventListener('click', () => selectType(chip.dataset.customerType as CustomerType));
  }
  form.addEventListener('input', (event) => {
    const input = event.target as HTMLElement;
    const name = input.dataset.field;
    const key = name === 'privateCodiceFiscale' ? 'codiceFiscale' : name;
    if (key) refused.delete(key);
    gate.refresh();
  });

  return {
    paint,
    isDirty: () => !form.hidden && snapshot() !== saved,
    demandSave: (message) => {
      failure.textContent = message;
      failure.hidden = false;
      saveButton.focus({ preventScroll: true });
      saveButton.scrollIntoView({ block: 'center', behavior: 'smooth' });
    },
    markFields,
  };
}
