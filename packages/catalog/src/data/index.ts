/**
 * The registry: every category the sync script writes, in the order the shop's
 * own catalogue lists them — the hire tree first, then the sale tree, each
 * alphabetical by Italian name the way the site's category API returns them.
 *
 * The taxonomy is FLAT and mirrors the live site's leaf terms one for one, with
 * the shop's own names: "Affitto e noleggio" and "Vendita" are containers on
 * the site, not categories a product sits in, so neither appears here. Every
 * product belongs to exactly ONE category; where the site filed a product under
 * several, docs/catalog/source/placement.json records which one was chosen and
 * why.
 *
 * A category is in the catalogue when it is listed here and not before, so a
 * folder can be written and reviewed without touching the database.
 *
 * Terms documents are collected separately because a product LINKS to one
 * rather than owning it — the document has to be written as its own row first,
 * and every product in the catalogue shares this one.
 */
import type { Category, TermsDocument } from '../lib/types.ts';
import { generalTerms } from './shared/terms.ts';
import accessoriesSale from './accessories-sale/index.ts';
import cryomagnetotherapyHire from './cryomagnetotherapy-hire/index.ts';
import cryotherapyHire from './cryotherapy-hire/index.ts';
import cryotherapySale from './cryotherapy-sale/index.ts';
import electricWheelchairsAndScootersHire from './electric-wheelchairs-and-scooters-hire/index.ts';
import electricWheelchairsSale from './electric-wheelchairs-sale/index.ts';
import electromedicalSale from './electromedical-sale/index.ts';
import hospitalBedsHire from './hospital-beds-hire/index.ts';
import hospitalBedsSale from './hospital-beds-sale/index.ts';
import kinetecHire from './kinetec-hire/index.ts';
import magnetotherapyHire from './magnetotherapy-hire/index.ts';
import magnetotherapySale from './magnetotherapy-sale/index.ts';
import mobilityScootersSale from './mobility-scooters-sale/index.ts';
import patientLiftsHire from './patient-lifts-hire/index.ts';
import patientLiftsSale from './patient-lifts-sale/index.ts';
import pressotherapyHire from './pressotherapy-hire/index.ts';
import pressotherapySale from './pressotherapy-sale/index.ts';
import pressureReliefMattressesHire from './pressure-relief-mattresses-hire/index.ts';
import pressureReliefMattressesSale from './pressure-relief-mattresses-sale/index.ts';
import reclinerArmchairsSale from './recliner-armchairs-sale/index.ts';
import stairliftsHire from './stairlifts-hire/index.ts';
import stairliftsSale from './stairlifts-sale/index.ts';
import standingFramesHire from './standing-frames-hire/index.ts';
import standingFramesSale from './standing-frames-sale/index.ts';
import tensHire from './tens-hire/index.ts';
import tensSale from './tens-sale/index.ts';
import ultrasoundHire from './ultrasound-hire/index.ts';
import ultrasoundSale from './ultrasound-sale/index.ts';
import usedDealsHire from './used-deals-hire/index.ts';
import usedDealsSale from './used-deals-sale/index.ts';
import walkersHire from './walkers-hire/index.ts';
import walkersSale from './walkers-sale/index.ts';
import wheelchairsHire from './wheelchairs-hire/index.ts';
import wheelchairsSale from './wheelchairs-sale/index.ts';

export const categories: readonly Category[] = [
  wheelchairsHire,
  electricWheelchairsAndScootersHire,
  cryomagnetotherapyHire,
  cryotherapyHire,
  walkersHire,
  kinetecHire,
  hospitalBedsHire,
  magnetotherapyHire,
  pressureReliefMattressesHire,
  stairliftsHire,
  usedDealsHire,
  pressotherapyHire,
  patientLiftsHire,
  tensHire,
  ultrasoundHire,
  standingFramesHire,
  accessoriesSale,
  wheelchairsSale,
  electricWheelchairsSale,
  cryotherapySale,
  walkersSale,
  electromedicalSale,
  usedDealsSale,
  hospitalBedsSale,
  magnetotherapySale,
  pressureReliefMattressesSale,
  stairliftsSale,
  reclinerArmchairsSale,
  pressotherapySale,
  mobilityScootersSale,
  patientLiftsSale,
  tensSale,
  ultrasoundSale,
  standingFramesSale,
];

export const termsDocuments: readonly TermsDocument[] = [generalTerms];
