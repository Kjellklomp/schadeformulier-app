"use client";

import { useState } from "react";
import { ArrowLeft, FileDown, Printer, Copy, AlertTriangle, Check } from "lucide-react";
import Card from "./Card";
import Button from "./Button";
import StatusLine from "./StatusLine";
import SummaryBox from "./SummaryBox";
import {
  PersonState,
  VerzekeringnemerState,
  KentekenState,
  VerzekeringState,
  ToedrachtOcrData,
  PartnerData,
  OcrStatus,
} from "@/lib/types";
import { buildFilledPdf } from "@/lib/buildFilledPdf";

interface StepOverzichtProps {
  person: PersonState;
  vn: VerzekeringnemerState;
  kenteken: KentekenState;
  verzekering: VerzekeringState;
  toedracht: ToedrachtOcrData | null;
  partnerData: PartnerData | null;
  startTime: number;
  onBack: () => void;
}

function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <div className="bg-paper-tint px-4 py-2 text-[11px] uppercase tracking-[0.07em] text-amber-deep font-bold">{title}</div>
      <div>{children}</div>
    </>
  );
}

function DocField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-3 px-4 py-2.5 border-b border-line-soft last:border-b-0 text-[13.5px]">
      <div className="text-ink-soft shrink-0 w-[44%]">{label}</div>
      <div className={`font-mono text-[12.8px] text-right ${value ? "font-semibold text-ink" : "italic font-sans text-red"}`}>
        {value || "nog invullen"}
      </div>
    </div>
  );
}

export default function StepOverzicht({
  person,
  vn,
  kenteken,
  verzekering,
  toedracht,
  partnerData,
  startTime,
  onBack,
}: StepOverzichtProps) {
  const [pdfStatus, setPdfStatus] = useState<OcrStatus>("idle");
  const [pdfError, setPdfError] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [elapsedMinutes] = useState(() => Math.max(1, Math.round((Date.now() - startTime) / 60000)));

  const p = person;
  const effectiveVn = vn.zelfde ? { naam: p.naam, voornaam: p.voornaam, adres: p.adres, postcode: p.postcode, plaats: p.plaats } : vn;
  const k = kenteken.data;
  const v = verzekering.data;
  const t = toedracht;
  const b = partnerData;

  async function handleGeneratePdf() {
    setPdfStatus("busy");
    setPdfError("");
    try {
      const { bytes } = await buildFilledPdf({ person, vn, kenteken: k, verzekering: v, toedracht: t });
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfStatus("ok");
    } catch (err) {
      setPdfStatus("err");
      setPdfError(`PDF genereren mislukt: ${err instanceof Error ? err.message : "onbekende fout"}`);
    }
  }

  function handleCopyText() {
    const lines = [
      `VOERTUIG A — ${p.naam} ${p.voornaam}`.trim(),
      `Geboortedatum: ${p.geboortedatum || "-"}`,
      `Tel/e-mail: ${p.tel || "-"}`,
      `Rijbewijsnr.: ${p.rijbewijsnr || "-"} (cat. ${p.categorie || "-"}, geldig tot ${p.geldigtot || "-"})`,
      `Adres: ${p.adres || "-"}, ${p.postcode || ""} ${p.plaats || ""}, ${p.land || ""}`,
      "",
      `Verzekeringnemer: ${effectiveVn.naam || "-"} ${effectiveVn.voornaam || ""}, ${effectiveVn.adres || "-"}`,
      "",
      `Voertuig: ${k?.merk || "-"} ${k?.handelsbenaming || k?.type || ""} — kenteken ${k?.kenteken || "-"} (${k?.land || "Nederland"})`,
      `RDW-check: ${kenteken.rdw.status === "ok" ? (kenteken.rdw.mismatch ? "afwijking gevonden" : "bevestigd") : "niet uitgevoerd"}`,
      "",
      `Verzekeraar: ${v?.maatschappij || "-"}, polis ${v?.polisnr || "-"}, groene kaart ${v?.groenekaart || "-"}, geldig ${v?.van || "-"} t/m ${v?.tot || "-"}`,
      "",
      `Datum/tijd ongeval: ${t?.datum || "-"} ${t?.tijd || ""}`,
      `Locatie: ${t?.straat || "-"}, ${t?.plaats || ""} ${t?.land || ""}`,
      `Gewonden: ${t?.gewonden || "-"} | Schade andere voertuigen: ${t?.materiele_schade_andere_voertuigen || "-"} | andere objecten: ${t?.materiele_schade_andere_objecten || "-"}`,
      `Vermoedelijke toedrachtvakjes (A): ${(t?.toedracht_vakjes_A || []).join(", ") || "-"}`,
      `Zichtbare schade A: ${t?.zichtbare_schade_A || "-"}`,
      `Opmerkingen: ${t?.opmerkingen || "-"}`,
      "",
      b
        ? `VOERTUIG B — ${b.naam || ""} ${b.voornaam || ""}, tel ${b.tel || "-"}, kenteken ${b.kenteken || "-"}, verzekeraar ${b.verzekeraar || "-"}\nToedracht B: ${b.toedracht || "-"}`
        : "VOERTUIG B — nog niet ontvangen",
    ].join("\n");
    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <Card
      eyebrow="Stap 5 van 5"
      title="Overzicht"
      description="Controleer alles en neem het over op het papieren of digitale Europees schadeformulier. Beide partijen moeten samen ondertekenen — dat kan dit prototype niet vervangen."
      footer={
        <Button variant="secondary" onClick={onBack} icon={<ArrowLeft size={17} strokeWidth={2.25} />}>
          Terug
        </Button>
      }
    >
      <div className="no-print flex justify-end -mt-2 mb-3">
        <span className="inline-block bg-paper-tint rounded-full px-3 py-1 text-[12px] text-ink-soft font-semibold">
          ⏱ {elapsedMinutes} min
        </span>
      </div>

      <div className="rounded-2xl overflow-hidden border border-line-soft">
        <div className="bg-navy text-white px-4 py-3 font-heading text-[13px] tracking-[0.03em]">VOERTUIG A — bestuurder</div>
        <DocField label="Naam, voornaam" value={p.naam || p.voornaam ? `${p.naam} ${p.voornaam}`.trim() : ""} />
        <DocField label="Geboortedatum" value={p.geboortedatum} />
        <DocField label="Tel. / e-mail" value={p.tel} />
        <DocField label="Rijbewijsnr." value={p.rijbewijsnr} />
        <DocField label="Categorie / geldig tot" value={p.categorie || p.geldigtot ? `${p.categorie || "—"} · ${p.geldigtot || "—"}` : ""} />
        <DocField label="Adres" value={p.adres || p.postcode || p.plaats ? `${p.adres}, ${p.postcode} ${p.plaats}, ${p.land}` : ""} />

        <DocSection title="Verzekeringnemer">
          <DocField
            label="Naam, voornaam"
            value={effectiveVn.naam || effectiveVn.voornaam ? `${effectiveVn.naam} ${effectiveVn.voornaam}`.trim() : ""}
          />
          <DocField
            label="Adres"
            value={effectiveVn.adres || effectiveVn.postcode || effectiveVn.plaats ? `${effectiveVn.adres}, ${effectiveVn.postcode} ${effectiveVn.plaats}` : ""}
          />
        </DocSection>

        <DocSection title="Voertuig (live gecheckt bij RDW)">
          <DocField label="Merk, type" value={k?.merk || k?.type || k?.handelsbenaming ? `${k?.merk || ""} ${k?.handelsbenaming || k?.type || ""}`.trim() : ""} />
          <DocField label="Kenteken" value={k?.kenteken} />
          <DocField label="Land van registratie" value={k?.land || "Nederland"} />
          <DocField label="RDW-status" value={kenteken.rdw.status === "ok" ? (kenteken.rdw.mismatch ? "⚠️ afwijking gevonden" : "✅ bevestigd") : "—"} />
        </DocSection>

        <DocSection title="Verzekeringsmaatschappij">
          <DocField label="Naam" value={v?.maatschappij} />
          <DocField label="Polisnr." value={v?.polisnr} />
          <DocField label="Groene kaart nr." value={v?.groenekaart} />
          <DocField label="Geldig van / tot" value={v?.van || v?.tot ? `${v?.van || "—"} → ${v?.tot || "—"}` : ""} />
        </DocSection>

        <DocSection title="Ongeval">
          <DocField label="Datum / tijd" value={t?.datum || t?.tijd ? `${t?.datum || "—"} ${t?.tijd || ""}`.trim() : ""} />
          <DocField label="Locatie" value={t?.straat || t?.plaats ? `${t?.straat || ""}, ${t?.plaats || ""} ${t?.land ? `(${t.land})` : ""}`.trim() : ""} />
          <DocField label="Gewonden?" value={t?.gewonden} />
          <DocField label="Materiële schade — andere voertuigen" value={t?.materiele_schade_andere_voertuigen} />
          <DocField label="Materiële schade — andere objecten" value={t?.materiele_schade_andere_objecten} />
        </DocSection>

        <DocSection title="12. Toedracht (vakjes A) — te verifiëren">
          <DocField label="Vermoedelijke vakjes" value={t?.toedracht_vakjes_A?.length ? t.toedracht_vakjes_A.join(", ") : ""} />
        </DocSection>

        <DocSection title="11. Zichtbare schade aan A">
          <DocField label="Beschrijving" value={t?.zichtbare_schade_A} />
        </DocSection>

        <DocSection title="14. Mijn opmerkingen">
          <DocField label="Samenvatting" value={t?.opmerkingen} />
        </DocSection>
      </div>

      {b ? (
        <div className="rounded-2xl overflow-hidden border border-line-soft mt-3.5">
          <div className="bg-amber-deep text-white px-4 py-3 font-heading text-[13px] tracking-[0.03em]">
            VOERTUIG B — via QR-sessie ontvangen
          </div>
          <DocField label="Naam" value={`${b.naam || ""} ${b.voornaam || ""}`.trim()} />
          <DocField label="Tel. / e-mail" value={b.tel} />
          <DocField label="Kenteken" value={b.kenteken} />
          <DocField label="Verzekeraar" value={b.verzekeraar} />
          <DocField label="Toedracht (B, eigen woorden)" value={b.toedracht} />
        </div>
      ) : (
        <SummaryBox tone="warning">
          Geen gegevens van de tegenpartij ontvangen. Vul kolom &quot;Voertuig B&quot; samen handmatig in op het formulier, of ga terug naar stap 3 om de QR-code opnieuw te tonen.
        </SummaryBox>
      )}

      <div className="flex items-start gap-2.5 rounded-2xl bg-[#FBF1EA] px-4 py-3.5 text-[12.8px] text-[#7A4A1E] mt-3.5 leading-relaxed">
        <AlertTriangle size={16} strokeWidth={2} className="shrink-0 mt-0.5" />
        <div>Vak 15 (handtekeningen van beide bestuurders) moet nog steeds fysiek of via een handtekenwidget gebeuren — dat kan wettelijk niet worden overgeslagen.</div>
      </div>

      <Button
        id="genpdf5"
        variant="amber"
        onClick={handleGeneratePdf}
        disabled={pdfStatus === "busy"}
        fullWidth
        className="mt-5"
        icon={<FileDown size={17} strokeWidth={2.25} />}
      >
        {pdfStatus === "busy" ? "PDF wordt ingevuld…" : "Genereer ingevuld schadeformulier (PDF)"}
      </Button>
      <StatusLine status={pdfStatus === "ok" ? "idle" : pdfStatus}>{pdfStatus === "err" && pdfError}</StatusLine>

      {pdfStatus === "ok" && pdfUrl && (
        <>
          <SummaryBox>
            <b>PDF gegenereerd</b> — jouw kant (Voertuig A) is overgenomen op het echte Europees schadeformulier. Vak
            13 (situatieschets) is opengelaten — teken deze samen met de tegenpartij met de hand in.
          </SummaryBox>
          <a
            href={pdfUrl}
            download="schadeformulier-voertuig-A.pdf"
            className="mt-3 inline-flex items-center gap-2 bg-gradient-to-b from-navy-2 to-navy text-white shadow-[var(--shadow-button)] rounded-2xl px-5 py-3 font-semibold text-[14.5px] hover:brightness-110 transition-all duration-150 ease-out active:scale-[0.97]"
          >
            <FileDown size={17} strokeWidth={2.25} />
            Download ingevulde PDF
          </a>
          <iframe src={pdfUrl} title="Ingevuld schadeformulier" className="w-full h-[480px] border border-line-soft rounded-2xl mt-3" />
        </>
      )}

      <div className="no-print flex gap-2.5 mt-4">
        <Button variant="secondary" onClick={() => window.print()} fullWidth icon={<Printer size={17} strokeWidth={2.25} />}>
          Printen / opslaan als PDF (samenvatting)
        </Button>
      </div>
      <div className="no-print flex gap-2.5 mt-2.5">
        <Button variant="secondary" onClick={handleCopyText} fullWidth icon={copied ? <Check size={17} strokeWidth={2.25} /> : <Copy size={17} strokeWidth={2.25} />}>
          {copied ? "Gekopieerd" : "Kopiëren als tekst"}
        </Button>
      </div>
    </Card>
  );
}
