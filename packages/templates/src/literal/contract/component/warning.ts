/**
 * The red "IMPORTANTE / IMPORTANT" notice every official contract carries on its
 * front page: intended use only, return the aids clean or pay €50, announce
 * postponements/collections at least 2 days ahead.
 */

export function importantNoticeIt(): string {
  return `<div class="warning-box">
  <strong>IMPORTANTE:</strong> Tutti gli ausili devono essere utilizzati esclusivamente per lo scopo a cui sono destinati. È OBBLIGATORIO RICONSEGNARE GLI AUSILI PULITI NELLO STESSO STATO IN CUI VENGONO PRESI IN CONSEGNA DAL LOCATARIO, PENA L'ADDEBITO DI €50,00. Per eventuali rinvii o ritiri degli ausili, si prega di contattare il numero per le comunicazioni ALMENO 2 GIORNI PRIMA DELLA SCADENZA.
</div>`;
}

export function importantNoticeEn(): string {
  return `<div class="warning-box">
  <strong>IMPORTANT:</strong> All aids must be used exclusively for their intended purpose. IT IS COMPULSORY TO RETURN CLEAN AIDS IN THE SAME CONDITION IN WHICH THE HIRER TOOK THEM, ON PAIN OF A FINE OF €50.00.
</div>`;
}
