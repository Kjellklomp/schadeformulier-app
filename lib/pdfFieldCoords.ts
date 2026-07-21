/* Coördinaten op de echte PDF (voorzijde, 642.284 x 925.748 pt).
   Gemeten met pdfplumber/pixel-analyse op het officiële lege Europees schadeformulier
   (Verbond van Verzekeraars). x/yBottom zijn PDF-punten vanaf linksboven; toPdfY() zet
   dit om naar pdf-lib's van-onder-coördinaten. width/height bepalen de klik-/typbare
   grootte van het PDF-formulierveld dat op deze plek wordt gelegd. */

export const PDF_PAGE = { width: 642.284, height: 925.748 };

export interface FieldCoord {
  x: number;
  yBottom: number;
  width: number;
  height?: number;
  size?: number;
}

export const FIELD_COORDS: Record<string, FieldCoord> = {
  // "Datum aanrijding"/"Tijd" hebben een eigen onderlijn vlak onder het label (y≈87.4) én
  // een leeg schrijfvak daarónder, tot de rand van vak 1 op y≈101.4. De waarde hoort in dat
  // lege vak (niet naast/over het label), over de volle breedte van elke kolom — kolom-
  // scheiding gemeten op x=134.5.
  datum: { x: 44, yBottom: 98, width: 87 },
  tijd: { x: 138, yBottom: 98, width: 37 },
  locatie_plaats: { x: 272, yBottom: 86.9, width: 210 },
  locatie_land: { x: 200, yBottom: 99.0, width: 60 },
  locatie_straat: { x: 272, yBottom: 99.0, width: 205 },

  vn_naam: { x: 70, yBottom: 195.1, width: 145 },
  vn_voornaam: { x: 80, yBottom: 207.6, width: 135 },
  vn_adres: { x: 60, yBottom: 220.1, width: 115 },
  vn_postcode: { x: 190, yBottom: 220.1, width: 35 },
  vn_plaats: { x: 62, yBottom: 232.5, width: 110 },
  vn_land: { x: 188, yBottom: 232.5, width: 38 },
  vn_tel: { x: 85, yBottom: 244.9, width: 140 },

  merk_type: { x: 42, yBottom: 298.1, width: 85, size: 8.5 },
  kenteken: { x: 42, yBottom: 320.1, width: 85, size: 8.5 },
  land_registratie: { x: 42, yBottom: 342.1, width: 85, size: 8.5 },

  verz_naam: { x: 70, yBottom: 374.5, width: 145 },
  polisnr: { x: 70, yBottom: 387.0, width: 145 },
  groenekaart: { x: 100, yBottom: 399.5, width: 115 },
  geldig_vanaf: { x: 60, yBottom: 421.4, width: 62, size: 7.5 },
  geldig_tot_verz: { x: 150, yBottom: 421.4, width: 62, size: 7.5 },

  best_naam: { x: 70, yBottom: 542.7, width: 145 },
  best_voornaam: { x: 82, yBottom: 555.2, width: 135 },
  geboortedatum: { x: 98, yBottom: 567.7, width: 118, size: 8 },
  best_adres: { x: 60, yBottom: 580.1, width: 115 },
  best_postcode: { x: 190, yBottom: 580.1, width: 35 },
  best_plaats: { x: 62, yBottom: 592.5, width: 110 },
  best_land: { x: 188, yBottom: 592.5, width: 38 },
  best_tel: { x: 85, yBottom: 605.0, width: 140 },
  rijbewijsnr: { x: 84, yBottom: 617.5, width: 130, size: 8 },
  categorie: { x: 108, yBottom: 630.0, width: 105 },
  geldigtot_rb: { x: 78, yBottom: 642.3, width: 135, size: 8 },

  // Meerregelige blokken: x/yBottom is de bovenkant van het bloktekstgebied, height loopt
  // omlaag. Pixel-gemeten op het lege formulier:
  //  - vak 11 "Zichtbare schade aan voertuig A": smalle blauwe kolom, box x 37.5→145.5,
  //    3 stippellijnen op y≈780.5/790.5/800.5, onderrand y=807. De brede grid rechts is
  //    vak 13 (situatieschets), NIET dit vak — daar liep de tekst voorheen overheen.
  //  - vak 14 "Mijn opmerkingen": box x 37.5→214, 3 stippellijnen op y≈836.5/846.5/856.5,
  //    onderrand y=864. Rechts daarvan begint vak 15 (handtekeningen).
  zichtbare_schade_A: { x: 41, yBottom: 775, width: 101, height: 28, size: 8 },
  opmerkingen: { x: 41, yBottom: 831, width: 170, height: 27, size: 8 },
};

export interface CheckboxCoord {
  x: number;
  y: number;
  size: number;
}

const SMALL_CHECKBOX_SIZE = 7.2;

export const CHECKBOX_COORDS: Record<string, CheckboxCoord> = {
  gewonden_nee: { x: 402.8, y: 94.9, size: SMALL_CHECKBOX_SIZE },
  gewonden_ja: { x: 450.2, y: 94.8, size: SMALL_CHECKBOX_SIZE },
  schade_voert_nee: { x: 61.8, y: 136.0, size: SMALL_CHECKBOX_SIZE },
  schade_voert_ja: { x: 105.6, y: 135.9, size: SMALL_CHECKBOX_SIZE },
  schade_obj_nee: { x: 165.1, y: 136.0, size: SMALL_CHECKBOX_SIZE },
  schade_obj_ja: { x: 209.0, y: 135.9, size: SMALL_CHECKBOX_SIZE },
};

// vak 12 (toedracht) checkbox-rijen A, nummers 1 t/m 17 — center_x is constant, center_y per rij
export const TOEDRACHT_CHECKBOX_SIZE = 8.5;
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

export function toPdfY(yBottomFromTop: number, nudge = 1.2): number {
  return PDF_PAGE.height - yBottomFromTop + nudge;
}
