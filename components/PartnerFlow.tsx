"use client";

import { useState } from "react";
import { Car, Send, CheckCircle2 } from "lucide-react";
import Card from "./Card";
import Button from "./Button";
import UploadBox from "./UploadBox";
import StatusLine from "./StatusLine";
import { Label, TextInput, Textarea } from "./FormField";
import { OcrStatus } from "@/lib/types";
import { fileToBase64 } from "@/lib/fileToBase64";
import { parseJsonLoose } from "@/lib/parseJsonLoose";
import { callVision } from "@/lib/visionClient";
import { PARTNER_KENTEKEN_OCR_SYSTEM } from "@/lib/prompts";
import { submitPartnerData } from "@/lib/sessionClient";

export default function PartnerFlow({ sessionId }: { sessionId: string }) {
  const [naam, setNaam] = useState("");
  const [voornaam, setVoornaam] = useState("");
  const [tel, setTel] = useState("");
  const [kenteken, setKenteken] = useState("");
  const [verzekeraar, setVerzekeraar] = useState("");
  const [toedracht, setToedracht] = useState("");
  const [kentekenFiles, setKentekenFiles] = useState<File[]>([]);
  const [ocrStatus, setOcrStatus] = useState<OcrStatus>("idle");
  const [ocrMessage, setOcrMessage] = useState<React.ReactNode>(null);
  const [submitStatus, setSubmitStatus] = useState<OcrStatus>("idle");
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleKentekenUpload(files: File[]) {
    setKentekenFiles(files);
    setOcrStatus("busy");
    setOcrMessage("Kenteken uitlezen…");
    try {
      const data = await fileToBase64(files[0]);
      const text = await callVision({
        system: PARTNER_KENTEKEN_OCR_SYSTEM,
        userText: "Geef het kenteken.",
        images: [{ mediaType: files[0].type || "image/jpeg", data }],
      });
      const parsed = parseJsonLoose<{ kenteken?: string }>(text);
      if (!parsed?.kenteken) throw new Error("parse-fout");
      setKenteken(parsed.kenteken);
      setOcrStatus("ok");
      setOcrMessage(`Kenteken herkend: ${parsed.kenteken}`);
    } catch {
      setOcrStatus("err");
      setOcrMessage("Niet gelukt — vul kenteken handmatig in.");
    }
  }

  async function handleSubmit() {
    if (!naam || !kenteken || !verzekeraar) {
      alert("Vul in elk geval naam, kenteken en verzekeraar in.");
      return;
    }
    setSubmitStatus("busy");
    try {
      await submitPartnerData(sessionId, { naam, voornaam, tel, kenteken, verzekeraar, toedracht });
      setSubmitted(true);
    } catch (err) {
      setSubmitStatus("err");
      setSubmitError(err instanceof Error ? err.message : "Versturen mislukt — controleer je internetverbinding en probeer opnieuw.");
    }
  }

  if (submitted) {
    return (
      <Card eyebrow="Schademelding" title="Verstuurd">
        <div className="flex flex-col items-center text-center gap-3 py-6">
          <div className="w-14 h-14 rounded-full bg-green/15 flex items-center justify-center">
            <CheckCircle2 size={28} strokeWidth={2} className="text-green" />
          </div>
          <p className="text-ink-soft text-[14.5px] leading-relaxed max-w-sm">
            Je gegevens zijn automatisch toegevoegd aan de schademelding. Je kunt dit venster nu sluiten — de andere
            bestuurder ziet je gegevens direct op zijn scherm verschijnen.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      eyebrow="Schademelding"
      title="Je bent uitgenodigd voor een schademelding"
      description="De andere bestuurder gebruikt deze app om het Europees schadeformulier samen sneller in te vullen. Vul hieronder jouw kant (Voertuig B) in — dit wordt automatisch teruggestuurd."
      footer={
        <Button id="bsubmit" onClick={handleSubmit} disabled={submitStatus === "busy"} fullWidth icon={<Send size={17} strokeWidth={2.25} />}>
          {submitStatus === "busy" ? "Versturen…" : "Verstuur mijn gegevens"}
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-x-3">
        <div>
          <Label required htmlFor="bnaam">Achternaam</Label>
          <TextInput id="bnaam" value={naam} onChange={(e) => setNaam(e.target.value)} />
        </div>
        <div>
          <Label required htmlFor="bvoornaam">Voornaam</Label>
          <TextInput id="bvoornaam" value={voornaam} onChange={(e) => setVoornaam(e.target.value)} />
        </div>
      </div>
      <Label required htmlFor="btel">Telefoon of e-mail</Label>
      <TextInput id="btel" value={tel} onChange={(e) => setTel(e.target.value)} />

      <Label>Kentekenbewijs (optioneel — versnelt invullen)</Label>
      <UploadBox
        icon={Car}
        label="Tik om foto te kiezen"
        hint="JPG of PNG"
        files={kentekenFiles}
        onFilesSelected={handleKentekenUpload}
      />
      <StatusLine status={ocrStatus}>{ocrMessage}</StatusLine>

      <Label required htmlFor="bkenteken">Kenteken</Label>
      <TextInput id="bkenteken" className="font-mono" value={kenteken} onChange={(e) => setKenteken(e.target.value)} />

      <Label required htmlFor="bverzekeraar">Verzekeraar</Label>
      <TextInput id="bverzekeraar" value={verzekeraar} onChange={(e) => setVerzekeraar(e.target.value)} />

      <Label htmlFor="btoedracht">Kort, in je eigen woorden: wat is er gebeurd?</Label>
      <Textarea
        id="btoedracht"
        rows={4}
        value={toedracht}
        onChange={(e) => setToedracht(e.target.value)}
        placeholder="Bijvoorbeeld: ik reed rechtdoor en de andere auto reed achteruit uit een parkeervak op het moment dat ik passeerde."
      />

      <StatusLine status={submitStatus === "ok" ? "idle" : submitStatus}>{submitStatus === "err" && submitError}</StatusLine>
    </Card>
  );
}
