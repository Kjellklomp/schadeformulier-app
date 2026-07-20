import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { PersonState, VerzekeringnemerState, KentekenOcrData, VerzekeringOcrData, ToedrachtOcrData } from "./types";
import { FIELD_COORDS, CHECKBOX_COORDS, TOEDRACHT_CHECKBOX_A, SCHETS_BOX, toPdfY } from "./pdfFieldCoords";
import { generateSchetsDataUrl } from "./situationSketch";

const PDF_TEMPLATE_URL = "/schadeformulier-leeg.pdf";
const INK_COLOR = rgb(0.09, 0.16, 0.29);
const AI_COLOR = rgb(0.71, 0.26, 0.18);

export interface BuildFilledPdfInput {
  person: PersonState;
  vn: VerzekeringnemerState;
  kenteken: KentekenOcrData | null;
  verzekering: VerzekeringOcrData | null;
  toedracht: ToedrachtOcrData | null;
}

export interface BuildFilledPdfResult {
  bytes: Uint8Array;
  schetsGenerated: boolean;
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function formatDateEU(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  const m = ISO_DATE_PATTERN.exec(iso);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : iso;
}

// Compact DD-MM-JJ voor het smalle datumvak naast "Tijd" op vak 1 van het formulier.
function formatDateEUShort(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  const m = ISO_DATE_PATTERN.exec(iso);
  return m ? `${m[3]}-${m[2]}-${m[1].slice(2)}` : iso;
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

  const p = person;
  const effectiveVn: VerzekeringnemerState = vn.zelfde
    ? { zelfde: true, naam: p.naam, voornaam: p.voornaam, adres: p.adres, postcode: p.postcode, plaats: p.plaats, land: p.land, tel: p.tel }
    : vn;
  const k: Partial<KentekenOcrData> = kenteken ?? {};
  const v: Partial<VerzekeringOcrData> = verzekering ?? {};
  const t: Partial<ToedrachtOcrData> = toedracht ?? {};

  function draw(key: string, value?: string | null) {
    if (!value) return;
    const coord = FIELD_COORDS[key];
    if (!coord) return;
    page.drawText(String(value), { x: coord.x, y: toPdfY(coord.yBottom), size: coord.size ?? 9, font, color: INK_COLOR });
  }

  // Zoals draw(), maar knijpt de fontgrootte tot de tekst binnen maxWidth past — voorkomt overlap in smalle vakjes (bv. datum naast tijd).
  function drawFit(key: string, value: string | undefined, maxWidth: number) {
    if (!value) return;
    const coord = FIELD_COORDS[key];
    if (!coord) return;
    let size = coord.size ?? 9;
    while (size > 5.5 && font.widthOfTextAtSize(value, size) > maxWidth) size -= 0.5;
    page.drawText(value, { x: coord.x, y: toPdfY(coord.yBottom), size, font, color: INK_COLOR });
  }

  function checkX(coord?: { x: number; y: number }) {
    if (!coord) return;
    page.drawText("X", { x: coord.x, y: toPdfY(coord.y, 2), size: 10, font, color: AI_COLOR });
  }

  function wrapDraw(text: string | undefined, keys: string[], maxWidth: number, size = 8) {
    if (!text) return;
    const words = text.split(" ");
    const lines = [""];
    for (const word of words) {
      const candidate = (lines[lines.length - 1] + " " + word).trim();
      if (lines[lines.length - 1] !== "" && font.widthOfTextAtSize(candidate, size) > maxWidth) lines.push(word);
      else lines[lines.length - 1] = candidate;
    }
    lines.slice(0, keys.length).forEach((line, i) => draw(keys[i], line));
  }

  drawFit("datum", formatDateEUShort(t.datum), 22);
  drawFit("tijd", t.tijd, 30);
  draw("locatie_plaats", t.plaats);
  draw("locatie_land", t.land);
  draw("locatie_straat", t.straat);
  if (t.gewonden === "ja") checkX(CHECKBOX_COORDS.gewonden_ja);
  if (t.gewonden === "nee") checkX(CHECKBOX_COORDS.gewonden_nee);
  if (t.materiele_schade_andere_voertuigen === "ja") checkX(CHECKBOX_COORDS.schade_voert_ja);
  if (t.materiele_schade_andere_voertuigen === "nee") checkX(CHECKBOX_COORDS.schade_voert_nee);
  if (t.materiele_schade_andere_objecten === "ja") checkX(CHECKBOX_COORDS.schade_obj_ja);
  if (t.materiele_schade_andere_objecten === "nee") checkX(CHECKBOX_COORDS.schade_obj_nee);

  draw("vn_naam", effectiveVn.naam);
  draw("vn_voornaam", effectiveVn.voornaam);
  draw("vn_adres", effectiveVn.adres);
  draw("vn_postcode", effectiveVn.postcode);
  draw("vn_plaats", effectiveVn.plaats);
  draw("vn_land", effectiveVn.land);
  draw("vn_tel", effectiveVn.tel);

  const merkType = [k.merk, k.handelsbenaming || k.type].filter(Boolean).join(" ").trim();
  draw("merk_type", merkType || undefined);
  draw("kenteken", k.kenteken);
  draw("land_registratie", k.land || "Nederland");

  draw("verz_naam", v.maatschappij);
  draw("polisnr", v.polisnr);
  draw("groenekaart", v.groenekaart);
  draw("geldig_vanaf", formatDateEU(v.van));
  draw("geldig_tot_verz", formatDateEU(v.tot));

  draw("best_naam", p.naam);
  draw("best_voornaam", p.voornaam);
  draw("geboortedatum", formatDateEU(p.geboortedatum));
  draw("best_adres", p.adres);
  draw("best_postcode", p.postcode);
  draw("best_plaats", p.plaats);
  draw("best_land", p.land);
  draw("best_tel", p.tel);
  draw("rijbewijsnr", p.rijbewijsnr);
  draw("categorie", p.categorie);
  draw("geldigtot_rb", formatDateEU(p.geldigtot));

  (t.toedracht_vakjes_A || []).forEach((n) => {
    const y = TOEDRACHT_CHECKBOX_A.rows[n];
    if (y) checkX({ x: TOEDRACHT_CHECKBOX_A.x, y });
  });

  wrapDraw(t.zichtbare_schade_A, ["zichtbare_schade_1", "zichtbare_schade_2"], 95);
  wrapDraw(t.opmerkingen, ["opmerkingen_1", "opmerkingen_2", "opmerkingen_3"], 160);

  let schetsGenerated = false;
  if (t.schets?.mogelijk) {
    try {
      const dataUrl = generateSchetsDataUrl(t.schets);
      const pngImage = await pdfDoc.embedPng(dataUrlToBytes(dataUrl));
      const bx = SCHETS_BOX.x0;
      const by = toPdfY(SCHETS_BOX.bottom, 0);
      const bw = SCHETS_BOX.x1 - SCHETS_BOX.x0;
      const bh = SCHETS_BOX.bottom - SCHETS_BOX.top;
      page.drawImage(pngImage, { x: bx, y: by, width: bw, height: bh });
      page.drawText("AI-concept — controleer en pas zo nodig aan", { x: bx + 4, y: by + 4, size: 6.5, font, color: AI_COLOR });
      schetsGenerated = true;
    } catch {
      schetsGenerated = false;
    }
  }

  const outBytes = await pdfDoc.save();
  return { bytes: outBytes, schetsGenerated };
}
