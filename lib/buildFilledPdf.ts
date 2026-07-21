import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { PersonState, VerzekeringnemerState, KentekenOcrData, VerzekeringOcrData, ToedrachtOcrData } from "./types";
import { FIELD_COORDS, CHECKBOX_COORDS, TOEDRACHT_CHECKBOX_A, TOEDRACHT_CHECKBOX_SIZE, FieldCoord, toPdfY } from "./pdfFieldCoords";

const PDF_TEMPLATE_URL = "/schadeformulier-leeg.pdf";
const INK_COLOR = rgb(0.09, 0.16, 0.29);

export interface BuildFilledPdfInput {
  person: PersonState;
  vn: VerzekeringnemerState;
  kenteken: KentekenOcrData | null;
  verzekering: VerzekeringOcrData | null;
  toedracht: ToedrachtOcrData | null;
}

export interface BuildFilledPdfResult {
  bytes: Uint8Array;
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function formatDateEU(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  const m = ISO_DATE_PATTERN.exec(iso);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : iso;
}

// Compact DDMMJJ (zonder scheidingstekens) voor het smalle datumvak naast "Tijd" op vak 1.
// Bewust géén "-" of "." tussen de cijfergroepen: sommige PDF-viewers herkennen korte
// DD-MM-JJ/DD.MM.JJ-achtige patronen als datumveld en vervangen de weergave dan door hun
// eigen (veel te grote) datum-widget, waardoor het vakje overloopt. Zonder scheidingstekens
// wordt dat patroon niet herkend en blijft het gewoon leesbare tekst.
function formatDateEUShort(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  const m = ISO_DATE_PATTERN.exec(iso);
  return m ? `${m[3]}${m[2]}${m[1].slice(2)}` : iso;
}

// Zelfde reden als hierboven: "14:30" wordt door sommige viewers als tijdveld herkend en
// vervangen door hun eigen widget. "14u30" (in NL/BE een heel gangbare tijdnotatie) niet.
function formatTimeSafe(time?: string | null): string | undefined {
  if (!time) return undefined;
  return time.replace(":", "u");
}

export async function buildFilledPdf({
  person,
  vn,
  kenteken,
  verzekering,
  toedracht,
}: BuildFilledPdfInput): Promise<BuildFilledPdfResult> {
  const templateBytes = await fetch(PDF_TEMPLATE_URL).then((res) => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPages()[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const form = pdfDoc.getForm();

  const p = person;
  const effectiveVn: VerzekeringnemerState = vn.zelfde
    ? { zelfde: true, naam: p.naam, voornaam: p.voornaam, adres: p.adres, postcode: p.postcode, plaats: p.plaats, land: p.land, tel: p.tel }
    : vn;
  const k: Partial<KentekenOcrData> = kenteken ?? {};
  const v: Partial<VerzekeringOcrData> = verzekering ?? {};
  const t: Partial<ToedrachtOcrData> = toedracht ?? {};

  let fieldSeq = 0;
  const MIN_FONT_SIZE = 5.5;
  const HORIZONTAL_PADDING = 3; // pdf-lib's eigen veldpadding (2 × 1pt) plus wat lucht

  // Zoekt de grootste lettergrootte (aflopend vanaf `preferredSize`) waarbij `value` nog
  // binnen `maxWidth` past, zodat lange waarden (bv. een lange verzekeraarsnaam) verkleinen
  // in plaats van afgekapt te worden.
  function fitFontSize(value: string, preferredSize: number, maxWidth: number): number {
    let size = preferredSize;
    while (size > MIN_FONT_SIZE && font.widthOfTextAtSize(value, size) > maxWidth) {
      size -= 0.5;
    }
    return size;
  }

  // Legt een écht (leeg of vooringevuld) PDF-formulierveld op de plek van `key`, zodat de
  // ontvanger het na downloaden nog kan corrigeren of aanvullen — de tekst wordt dus niet
  // onwijzigbaar op de pagina "gebrand".
  function textField(key: string, value: string | undefined, opts?: { multiline?: boolean }) {
    const coord: FieldCoord | undefined = FIELD_COORDS[key];
    if (!coord) return;
    let y: number;
    let height: number;
    if (coord.height) {
      // Meerregelig blok: yBottom is de bovenkant van het tekstgebied, de box loopt
      // omlaag over de opgegeven hoogte (zie pdfFieldCoords.ts).
      height = coord.height;
      y = toPdfY(coord.yBottom + height, 0);
    } else {
      // Eenregelig veld: yBottom is de basislijn van het bijbehorende label (gemeten op
      // het lege formulier), dus de box moet vanaf net onder die lijn omhóóg lopen — niet
      // omlaag, anders belandt de tekst in de rij eronder. 10pt geeft ruim baan aan een
      // 9pt-letter zonder de volgende rij (~12,4pt verderop) te raken.
      height = 10;
      y = toPdfY(coord.yBottom + 1, 0);
    }
    const tf = form.createTextField(`voertuigA.${key}.${fieldSeq++}`);
    if (opts?.multiline) tf.enableMultiline();
    tf.addToPage(page, {
      x: coord.x,
      y,
      width: coord.width,
      height,
      font,
      textColor: INK_COLOR,
      borderWidth: 0,
      // pdf-lib vult een veld standaard wit als je `backgroundColor` weglaat — dat overplakt
      // de bestaande opdruk van het formulier (labels/lijntjes) eronder. Expliciet op
      // `undefined` zetten (i.p.v. de optie helemaal weglaten) voorkomt die default.
      backgroundColor: undefined,
      borderColor: undefined,
    });
    const preferredSize = coord.size ?? 9;
    let fontSize: number;
    if (!value) {
      fontSize = preferredSize;
    } else if (opts?.multiline) {
      // 0 = automatisch: pdf-lib's eigen meerregel-layout (breekt woorden af over regels
      // én verkleint de letter) zorgt dat lange tekst binnen de box blijft, zowel in
      // breedte als in hoogte — iets wat een vaste grootte niet garandeert.
      fontSize = 0;
    } else {
      fontSize = fitFontSize(value, preferredSize, coord.width - HORIZONTAL_PADDING);
    }
    tf.setFontSize(fontSize);
    if (value) tf.setText(value);
  }

  // Legt een écht (aan- of uitvinkbaar) PDF-checkbox-veld op de plek van `coord`, gecentreerd
  // op basis van de gemeten vakjesgrootte — ook checkboxen blijven zo na downloaden aanpasbaar.
  function checkboxField(name: string, coord: { x: number; y: number; size: number } | undefined, checked: boolean) {
    if (!coord) return;
    const cb = form.createCheckBox(`voertuigA.${name}.${fieldSeq++}`);
    cb.addToPage(page, {
      x: coord.x - coord.size / 2,
      y: toPdfY(coord.y, 0) - coord.size / 2,
      width: coord.size,
      height: coord.size,
      borderWidth: 0,
    });
    if (checked) cb.check();
  }

  textField("datum", formatDateEUShort(t.datum));
  textField("tijd", formatTimeSafe(t.tijd));
  textField("locatie_plaats", t.plaats);
  textField("locatie_land", t.land);
  textField("locatie_straat", t.straat);
  checkboxField("gewonden_ja", CHECKBOX_COORDS.gewonden_ja, t.gewonden === "ja");
  checkboxField("gewonden_nee", CHECKBOX_COORDS.gewonden_nee, t.gewonden === "nee");
  checkboxField("schade_voert_ja", CHECKBOX_COORDS.schade_voert_ja, t.materiele_schade_andere_voertuigen === "ja");
  checkboxField("schade_voert_nee", CHECKBOX_COORDS.schade_voert_nee, t.materiele_schade_andere_voertuigen === "nee");
  checkboxField("schade_obj_ja", CHECKBOX_COORDS.schade_obj_ja, t.materiele_schade_andere_objecten === "ja");
  checkboxField("schade_obj_nee", CHECKBOX_COORDS.schade_obj_nee, t.materiele_schade_andere_objecten === "nee");

  textField("vn_naam", effectiveVn.naam);
  textField("vn_voornaam", effectiveVn.voornaam);
  textField("vn_adres", effectiveVn.adres);
  textField("vn_postcode", effectiveVn.postcode);
  textField("vn_plaats", effectiveVn.plaats);
  textField("vn_land", effectiveVn.land);
  textField("vn_tel", effectiveVn.tel);

  const merkType = [k.merk, k.handelsbenaming || k.type].filter(Boolean).join(" ").trim();
  textField("merk_type", merkType || undefined);
  textField("kenteken", k.kenteken);
  textField("land_registratie", k.land || "Nederland");

  textField("verz_naam", v.maatschappij);
  textField("polisnr", v.polisnr);
  textField("groenekaart", v.groenekaart);
  textField("geldig_vanaf", formatDateEU(v.van));
  textField("geldig_tot_verz", formatDateEU(v.tot));

  textField("best_naam", p.naam);
  textField("best_voornaam", p.voornaam);
  textField("geboortedatum", formatDateEU(p.geboortedatum));
  textField("best_adres", p.adres);
  textField("best_postcode", p.postcode);
  textField("best_plaats", p.plaats);
  textField("best_land", p.land);
  textField("best_tel", p.tel);
  textField("rijbewijsnr", p.rijbewijsnr);
  textField("categorie", p.categorie);
  textField("geldigtot_rb", formatDateEU(p.geldigtot));

  // Alle 17 toedracht-vakjes krijgen een checkbox-veld — ook de vakjes die de AI niet
  // aankruiste, zodat de gebruiker zelf nog kan corrigeren of aanvullen.
  for (let n = 1; n <= 17; n++) {
    const y = TOEDRACHT_CHECKBOX_A.rows[n];
    checkboxField(`toedracht_${n}`, { x: TOEDRACHT_CHECKBOX_A.x, y, size: TOEDRACHT_CHECKBOX_SIZE }, (t.toedracht_vakjes_A || []).includes(n));
  }

  textField("zichtbare_schade_A", t.zichtbare_schade_A, { multiline: true });
  textField("opmerkingen", t.opmerkingen, { multiline: true });

  // Vak 13 (situatieschets) laten we altijd leeg — dat tekenen beide partijen samen met de hand in.

  form.updateFieldAppearances(font);
  const outBytes = await pdfDoc.save();
  return { bytes: outBytes };
}
