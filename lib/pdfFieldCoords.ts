/* Coördinaten op de echte PDF (voorzijde, 642.284 x 925.748 pt).
   Gemeten met pdfplumber op het officiële lege Europees schadeformulier (Verbond van Verzekeraars).
   x/yBottom zijn PDF-punten vanaf linksboven; toPdfY() zet dit om naar pdf-lib's van-onder-coördinaten. */

export const PDF_PAGE = { width: 642.284, height: 925.748 };

export interface FieldCoord {
  x: number;
  yBottom: number;
  size?: number;
}

export const FIELD_COORDS: Record<string, FieldCoord> = {
  datum: { x: 115, yBottom: 86.7 },
  tijd: { x: 153, yBottom: 86.3 },
  locatie_plaats: { x: 272, yBottom: 86.9 },
  locatie_land: { x: 200, yBottom: 99.0 },
  locatie_straat: { x: 272, yBottom: 99.0 },

  vn_naam: { x: 70, yBottom: 195.1 },
  vn_voornaam: { x: 80, yBottom: 207.6 },
  vn_adres: { x: 60, yBottom: 220.1 },
  vn_postcode: { x: 190, yBottom: 220.1 },
  vn_plaats: { x: 62, yBottom: 232.5 },
  vn_land: { x: 188, yBottom: 232.5 },
  vn_tel: { x: 85, yBottom: 244.9 },

  merk_type: { x: 42, yBottom: 298.1, size: 8.5 },
  kenteken: { x: 42, yBottom: 320.1, size: 8.5 },
  land_registratie: { x: 42, yBottom: 342.1, size: 8.5 },

  verz_naam: { x: 70, yBottom: 374.5 },
  polisnr: { x: 70, yBottom: 387.0 },
  groenekaart: { x: 100, yBottom: 399.5 },
  geldig_vanaf: { x: 60, yBottom: 421.4, size: 7.5 },
  geldig_tot_verz: { x: 150, yBottom: 421.4, size: 7.5 },

  best_naam: { x: 70, yBottom: 542.7 },
  best_voornaam: { x: 82, yBottom: 555.2 },
  geboortedatum: { x: 98, yBottom: 567.7, size: 8 },
  best_adres: { x: 60, yBottom: 580.1 },
  best_postcode: { x: 190, yBottom: 580.1 },
  best_plaats: { x: 62, yBottom: 592.5 },
  best_land: { x: 188, yBottom: 592.5 },
  best_tel: { x: 85, yBottom: 605.0 },
  rijbewijsnr: { x: 84, yBottom: 617.5, size: 8 },
  categorie: { x: 108, yBottom: 630.0 },
  geldigtot_rb: { x: 78, yBottom: 642.3, size: 8 },

  zichtbare_schade_1: { x: 44, yBottom: 783.4, size: 8 },
  zichtbare_schade_2: { x: 44, yBottom: 793.4, size: 8 },
  opmerkingen_1: { x: 42, yBottom: 838.4, size: 8 },
  opmerkingen_2: { x: 42, yBottom: 848.5, size: 8 },
  opmerkingen_3: { x: 42, yBottom: 858.6, size: 8 },
};

export interface CheckboxCoord {
  x: number;
  y: number;
}

export const CHECKBOX_COORDS: Record<string, CheckboxCoord> = {
  gewonden_nee: { x: 402.8, y: 94.9 },
  gewonden_ja: { x: 450.2, y: 94.8 },
  schade_voert_nee: { x: 61.8, y: 136.0 },
  schade_voert_ja: { x: 105.6, y: 135.9 },
  schade_obj_nee: { x: 165.1, y: 136.0 },
  schade_obj_ja: { x: 209.0, y: 135.9 },
};

// vak 12 (toedracht) checkbox-rijen A, nummers 1 t/m 17 — center_x is constant, center_y per rij
export const TOEDRACHT_CHECKBOX_A = {
  x: 248.2,
  rows: {
    1: 206.1,
    2: 216.3,
    3: 241.7,
    4: 257.6,
    5: 283.0,
    6: 308.5,
    7: 333.9,
    8: 359.4,
    9: 394.4,
    10: 419.9,
    11: 435.7,
    12: 451.6,
    13: 467.4,
    14: 483.3,
    15: 499.1,
    16: 534.2,
    17: 558.2,
  } as Record<number, number>,
};

// vak 13 situatieschets — tekengebied
export const SCHETS_BOX = { x0: 148, x1: 495, top: 653, bottom: 804 };

export function toPdfY(yBottomFromTop: number, nudge = 1.2): number {
  return PDF_PAGE.height - yBottomFromTop + nudge;
}
