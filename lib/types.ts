export type OcrStatus = "idle" | "busy" | "ok" | "err";

export interface PersonState {
  naam: string;
  voornaam: string;
  geboortedatum: string;
  tel: string;
  rijbewijsnr: string;
  categorie: string;
  geldigtot: string;
  adres: string;
  postcode: string;
  plaats: string;
  land: string;
}

export interface VerzekeringnemerState {
  zelfde: boolean;
  naam: string;
  voornaam: string;
  adres: string;
  postcode: string;
  plaats: string;
  land: string;
  tel: string;
}

export interface RijbewijsOcrData {
  achternaam: string;
  voornaam: string;
  geboortedatum: string;
  documentnummer: string;
  categorie: string;
  geldig_tot: string;
}

export interface KentekenOcrData {
  kenteken: string;
  merk: string;
  type: string;
  handelsbenaming: string;
  land: string;
  voertuigidentificatienummer: string;
}

export interface VerzekeringOcrData {
  maatschappij: string;
  polisnr: string;
  groenekaart: string;
  van: string;
  tot: string;
  kenteken: string;
  adres_verzekeraar: string;
  tel_verzekeraar: string;
}

export interface RdwRecord {
  kenteken?: string;
  merk?: string;
  handelsbenaming?: string;
  eerste_kleur?: string;
  voertuigsoort?: string;
  [key: string]: unknown;
}

export interface RdwState {
  status: "idle" | "busy" | "ok" | "notfound" | "err";
  data: RdwRecord | null;
  mismatch: boolean;
}

export interface KentekenState {
  status: OcrStatus;
  data: KentekenOcrData | null;
  rdw: RdwState;
}

export interface VerzekeringState {
  status: OcrStatus;
  data: VerzekeringOcrData | null;
}

export interface RijbewijsState {
  status: OcrStatus;
}

export type JaNeeOnbekend = "ja" | "nee" | "onbekend";

export interface SchetsData {
  mogelijk: boolean;
  wegtype: "rechte_weg" | "kruising" | "rotonde" | "parkeerplaats" | "onbekend";
  positie_A: "midden" | "links" | "rechts" | "geparkeerd";
  richting_A: "boven" | "onder" | "links" | "rechts" | "stilstaand";
  positie_B: "midden" | "links" | "rechts" | "geparkeerd";
  richting_B: "boven" | "onder" | "links" | "rechts" | "stilstaand";
  botspunt: "voor" | "achter" | "links" | "rechts" | "zijkant_links" | "zijkant_rechts";
  opmerking_schets: string;
}

export interface ToedrachtOcrData {
  datum: string;
  tijd: string;
  plaats: string;
  straat: string;
  land: string;
  gewonden: JaNeeOnbekend;
  materiele_schade_andere_voertuigen: JaNeeOnbekend;
  materiele_schade_andere_objecten: JaNeeOnbekend;
  zichtbare_schade_A: string;
  opmerkingen: string;
  toedracht_vakjes_A: number[];
  toedracht_toelichting: string;
  schets: SchetsData;
}

export interface ToedrachtState {
  text: string;
  status: OcrStatus;
  data: ToedrachtOcrData | null;
}

export interface PartnerData {
  naam: string;
  voornaam: string;
  tel: string;
  kenteken: string;
  verzekeraar: string;
  toedracht: string;
}

export interface ConflictCheckData {
  consistent: boolean;
  toelichting: string;
  aandachtspunten: string[];
}
