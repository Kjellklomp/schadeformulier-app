"use client";

import { useState } from "react";
import { Car, FileText, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import Card from "./Card";
import Button from "./Button";
import UploadBox from "./UploadBox";
import StatusLine from "./StatusLine";
import { Label } from "./FormField";
import { KentekenState, VerzekeringState, KentekenOcrData, VerzekeringOcrData } from "@/lib/types";
import { fileToBase64 } from "@/lib/fileToBase64";
import { parseJsonLoose } from "@/lib/parseJsonLoose";
import { callVision } from "@/lib/visionClient";
import { rdwLookup } from "@/lib/rdw";
import { KENTEKEN_OCR_SYSTEM, VERZEKERING_OCR_SYSTEM } from "@/lib/prompts";

interface StepVehicleProps {
  kenteken: KentekenState;
  setKenteken: (k: KentekenState) => void;
  verzekering: VerzekeringState;
  setVerzekering: (v: VerzekeringState) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function StepVehicle({ kenteken, setKenteken, verzekering, setVerzekering, onBack, onNext }: StepVehicleProps) {
  const [kentekenFiles, setKentekenFiles] = useState<File[]>([]);
  const [verzekeringFiles, setVerzekeringFiles] = useState<File[]>([]);

  async function handleKentekenUpload(files: File[]) {
    setKentekenFiles(files);
    setKenteken({ ...kenteken, status: "busy" });
    try {
      const data = await runKentekenOcr(files);
      setKenteken({ status: "ok", data, rdw: { status: "busy", data: null, mismatch: false } });
      await runRdwCheck(data);
    } catch {
      setKenteken({ status: "err", data: null, rdw: { status: "idle", data: null, mismatch: false } });
    }
  }

  async function runRdwCheck(data: KentekenOcrData) {
    try {
      const rec = await rdwLookup(data.kenteken);
      if (!rec) {
        setKenteken({ status: "ok", data, rdw: { status: "notfound", data: null, mismatch: false } });
        return;
      }
      const merkMatch = !data.merk || (rec.merk || "").toUpperCase().includes(data.merk.toUpperCase().slice(0, 4));
      setKenteken({ status: "ok", data, rdw: { status: "ok", data: rec, mismatch: !merkMatch } });
    } catch {
      setKenteken({ status: "ok", data, rdw: { status: "err", data: null, mismatch: false } });
    }
  }

  async function handleVerzekeringUpload(files: File[]) {
    setVerzekeringFiles(files);
    setVerzekering({ status: "busy", data: null });
    try {
      const data = await runVerzekeringOcr(files[0]);
      setVerzekering({ status: "ok", data });
    } catch {
      setVerzekering({ status: "err", data: null });
    }
  }

  return (
    <Card
      eyebrow="Stap 2 van 5"
      title="Voertuig & verzekering"
      description="Upload je kentekenbewijs en verzekeringsbewijs. We lezen ze automatisch uit én checken het kenteken direct live bij de RDW, zodat fouten of afwijkingen meteen opvallen."
      footer={
        <>
          <Button id="back2" variant="secondary" onClick={onBack} icon={<ArrowLeft size={17} strokeWidth={2.25} />}>
            Terug
          </Button>
          <Button id="next2" onClick={onNext} fullWidth icon={<ArrowRight size={17} strokeWidth={2.25} />}>
            Volgende: samen invullen
          </Button>
        </>
      }
    >
      <Label>Kentekenbewijs (deel 1, voor- en achterkant)</Label>
      <UploadBox
        icon={Car}
        label="Tik om foto's te kiezen"
        hint="JPG of PNG, max. 2 foto's"
        multiple
        maxFiles={2}
        files={kentekenFiles}
        onFilesSelected={handleKentekenUpload}
      />
      <StatusLine status={kenteken.status}>
        {kenteken.status === "busy" && "Gegevens uitlezen…"}
        {kenteken.status === "ok" && kenteken.data && summarizeKenteken(kenteken.data)}
        {kenteken.status === "err" && "Kon gegevens niet automatisch lezen — vul aan bij het overzicht."}
      </StatusLine>
      <RdwBox kenteken={kenteken} />

      <Label className="mt-6">Verzekeringsbewijs / groene kaart</Label>
      <UploadBox
        icon={FileText}
        label="Tik om foto of PDF te kiezen"
        hint="JPG, PNG of PDF"
        accept="image/*,application/pdf"
        files={verzekeringFiles}
        onFilesSelected={handleVerzekeringUpload}
      />
      <StatusLine status={verzekering.status}>
        {verzekering.status === "busy" && "Gegevens uitlezen…"}
        {verzekering.status === "ok" && verzekering.data && summarizeVerzekering(verzekering.data)}
        {verzekering.status === "err" && "Kon gegevens niet automatisch lezen — vul aan bij het overzicht."}
      </StatusLine>
    </Card>
  );
}

function RdwBox({ kenteken }: { kenteken: KentekenState }) {
  const { rdw } = kenteken;
  if (rdw.status === "busy") {
    return (
      <div className="flex items-center gap-2 text-[13px] text-ink-soft mt-3">
        <div className="w-[7px] h-[7px] rounded-full bg-amber animate-pulse" />
        <div>Live checken bij RDW open data…</div>
      </div>
    );
  }
  if (rdw.status === "notfound" || rdw.status === "err") {
    return (
      <div className="flex items-start gap-2 text-[13px] text-ink-soft mt-3">
        <XCircle size={15} strokeWidth={2} className="text-red shrink-0 mt-0.5" />
        <div>
          {rdw.status === "notfound"
            ? "Kenteken niet gevonden in RDW open data — controleer het kenteken."
            : "RDW-check niet gelukt (geen verbinding) — ga verder zonder live check."}
        </div>
      </div>
    );
  }
  if (rdw.status === "ok" && rdw.data) {
    const d = rdw.data;
    return (
      <div
        className={`flex items-start gap-2.5 rounded-2xl px-4 py-3.5 text-[13px] mt-3 leading-relaxed ${
          rdw.mismatch ? "bg-[#FBEDEA] text-[#7a2c1c]" : "bg-[#EEF2FA] text-[#1f3560]"
        }`}
      >
        {rdw.mismatch ? (
          <AlertTriangle size={16} strokeWidth={2} className="shrink-0 mt-0.5 text-red" />
        ) : (
          <CheckCircle2 size={16} strokeWidth={2} className="shrink-0 mt-0.5 text-green" />
        )}
        <div>
          {rdw.mismatch ? (
            <>
              <b className="text-navy">Let op:</b> merk op je documentfoto komt niet duidelijk overeen met het RDW-register — controleer het kenteken.
              <br />
            </>
          ) : (
            <>
              <b className="text-navy">Live bevestigd bij RDW:</b>
              <br />
            </>
          )}
          {d.merk || "-"} {d.handelsbenaming || ""} · kleur {d.eerste_kleur || "-"} · {d.voertuigsoort || "-"}
          <br />
          <span className="text-[11.5px] opacity-80">Bron: opendata.rdw.nl, kenteken {d.kenteken}</span>
        </div>
      </div>
    );
  }
  return null;
}

function summarizeKenteken(d: KentekenOcrData) {
  return (
    <>
      Herkend: <b>{d.merk || "?"} {d.handelsbenaming || d.type || ""}</b> · kenteken <b>{d.kenteken || "?"}</b>
    </>
  );
}
function summarizeVerzekering(d: VerzekeringOcrData) {
  return (
    <>
      Herkend: <b>{d.maatschappij || "?"}</b> · polis <b>{d.polisnr || "?"}</b>
    </>
  );
}

async function runKentekenOcr(files: File[]): Promise<KentekenOcrData> {
  const images = await Promise.all(files.map(async (f) => ({ mediaType: f.type || "image/jpeg", data: await fileToBase64(f) })));
  const text = await callVision({
    system: KENTEKEN_OCR_SYSTEM,
    userText: "Lees dit kentekenbewijs uit en geef het JSON-object.",
    images,
  });
  const parsed = parseJsonLoose<KentekenOcrData>(text);
  if (!parsed) throw new Error("parse-fout");
  return parsed;
}

async function runVerzekeringOcr(file: File): Promise<VerzekeringOcrData> {
  const data = await fileToBase64(file);
  const text = await callVision({
    system: VERZEKERING_OCR_SYSTEM,
    userText: "Lees dit verzekeringsbewijs uit en geef het JSON-object.",
    images: [{ mediaType: file.type || "image/jpeg", data }],
  });
  const parsed = parseJsonLoose<VerzekeringOcrData>(text);
  if (!parsed) throw new Error("parse-fout");
  return parsed;
}
