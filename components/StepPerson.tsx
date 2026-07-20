"use client";

import { useState } from "react";
import { IdCard, ArrowRight } from "lucide-react";
import Card from "./Card";
import Button from "./Button";
import UploadBox from "./UploadBox";
import StatusLine from "./StatusLine";
import { Label, TextInput } from "./FormField";
import { PersonState, VerzekeringnemerState, RijbewijsOcrData, OcrStatus } from "@/lib/types";
import { fileToBase64 } from "@/lib/fileToBase64";
import { parseJsonLoose } from "@/lib/parseJsonLoose";
import { callVision } from "@/lib/visionClient";
import { RIJBEWIJS_OCR_SYSTEM } from "@/lib/prompts";

interface StepPersonProps {
  person: PersonState;
  setPerson: (p: PersonState) => void;
  vn: VerzekeringnemerState;
  setVn: (vn: VerzekeringnemerState) => void;
  onNext: () => void;
}

export default function StepPerson({ person, setPerson, vn, setVn, onNext }: StepPersonProps) {
  const [rijbewijsFiles, setRijbewijsFiles] = useState<File[]>([]);
  const [ocrStatus, setOcrStatus] = useState<OcrStatus>("idle");
  const [ocrMessage, setOcrMessage] = useState<React.ReactNode>(null);

  function update<K extends keyof PersonState>(key: K, value: PersonState[K]) {
    setPerson({ ...person, [key]: value });
  }
  function updateVn<K extends keyof VerzekeringnemerState>(key: K, value: VerzekeringnemerState[K]) {
    setVn({ ...vn, [key]: value });
  }

  async function handleRijbewijsUpload(files: File[]) {
    setRijbewijsFiles(files);
    setOcrStatus("busy");
    setOcrMessage("Rijbewijs uitlezen…");
    try {
      const data = await runRijbewijsOcr(files[0]);
      setPerson({
        ...person,
        naam: data.achternaam || person.naam,
        voornaam: data.voornaam || person.voornaam,
        geboortedatum: data.geboortedatum || person.geboortedatum,
        rijbewijsnr: data.documentnummer || person.rijbewijsnr,
        categorie: data.categorie || person.categorie,
        geldigtot: data.geldig_tot || person.geldigtot,
      });
      setOcrStatus("ok");
      setOcrMessage(
        <>
          Herkend: <b>{data.achternaam || "?"} {data.voornaam || ""}</b> — rijbewijsnr. {data.documentnummer || "?"}
        </>
      );
    } catch {
      setOcrStatus("err");
      setOcrMessage("Kon rijbewijs niet automatisch lezen — vul de velden hieronder handmatig in.");
    }
  }

  function handleNext() {
    if (!person.naam || !person.adres) {
      alert("Vul in elk geval naam en adres in.");
      return;
    }
    onNext();
  }

  return (
    <Card
      eyebrow="Stap 1 van 5"
      title="Jouw gegevens"
      description="Fotografeer je rijbewijs — naam, geboortedatum, rijbewijsnummer en geldigheid vullen we automatisch in. De rest (adres, contact) hoef je maar één keer in te vullen."
      footer={
        <Button id="next1" onClick={handleNext} fullWidth icon={<ArrowRight size={17} strokeWidth={2.25} />}>
          Volgende: voertuig &amp; verzekering
        </Button>
      }
    >
      <Label htmlFor="rfile">Rijbewijs (voorkant)</Label>
      <UploadBox
        icon={IdCard}
        label="Tik om foto te maken of te kiezen"
        hint="JPG of PNG"
        capture="environment"
        files={rijbewijsFiles}
        onFilesSelected={handleRijbewijsUpload}
      />
      <StatusLine status={ocrStatus}>{ocrMessage}</StatusLine>

      <div className="mt-6 pt-5 border-t border-line-soft" />

      <div className="grid grid-cols-2 gap-x-3">
        <div>
          <Label required htmlFor="naam">Achternaam</Label>
          <TextInput id="naam" value={person.naam} onChange={(e) => update("naam", e.target.value)} />
        </div>
        <div>
          <Label required htmlFor="voornaam">Voornaam</Label>
          <TextInput id="voornaam" value={person.voornaam} onChange={(e) => update("voornaam", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-3">
        <div>
          <Label required htmlFor="geboortedatum">Geboortedatum</Label>
          <TextInput id="geboortedatum" type="date" value={person.geboortedatum} onChange={(e) => update("geboortedatum", e.target.value)} />
        </div>
        <div>
          <Label required htmlFor="tel">Tel. of e-mail</Label>
          <TextInput id="tel" value={person.tel} onChange={(e) => update("tel", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-3">
        <div>
          <Label required htmlFor="rijbewijsnr">Rijbewijsnummer</Label>
          <TextInput id="rijbewijsnr" className="font-mono" value={person.rijbewijsnr} onChange={(e) => update("rijbewijsnr", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="categorie">Categorie</Label>
          <TextInput id="categorie" placeholder="bv. B" value={person.categorie} onChange={(e) => update("categorie", e.target.value)} />
        </div>
      </div>
      <Label htmlFor="geldigtot">Rijbewijs geldig tot</Label>
      <TextInput id="geldigtot" type="date" value={person.geldigtot} onChange={(e) => update("geldigtot", e.target.value)} />

      <Label required htmlFor="adres">Adres (straat + huisnr.)</Label>
      <TextInput id="adres" value={person.adres} onChange={(e) => update("adres", e.target.value)} />
      <div className="grid grid-cols-2 gap-x-3">
        <div>
          <Label required htmlFor="postcode">Postcode</Label>
          <TextInput id="postcode" value={person.postcode} onChange={(e) => update("postcode", e.target.value)} />
        </div>
        <div>
          <Label required htmlFor="plaats">Plaats</Label>
          <TextInput id="plaats" value={person.plaats} onChange={(e) => update("plaats", e.target.value)} />
        </div>
      </div>
      <Label htmlFor="land">Land</Label>
      <TextInput id="land" value={person.land} onChange={(e) => update("land", e.target.value)} />

      <div className="mt-5 pt-4 border-t border-line-soft">
        <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink cursor-pointer">
          <input
            type="checkbox"
            className="w-[18px] h-[18px] rounded-md accent-navy cursor-pointer"
            checked={vn.zelfde}
            onChange={(e) => updateVn("zelfde", e.target.checked)}
          />
          Verzekeringnemer is dezelfde persoon als bestuurder
        </label>
      </div>
      {!vn.zelfde && (
        <div>
          <div className="grid grid-cols-2 gap-x-3">
            <div>
              <Label htmlFor="vnnaam">Achternaam verzekeringnemer</Label>
              <TextInput id="vnnaam" value={vn.naam} onChange={(e) => updateVn("naam", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="vnvoornaam">Voornaam</Label>
              <TextInput id="vnvoornaam" value={vn.voornaam} onChange={(e) => updateVn("voornaam", e.target.value)} />
            </div>
          </div>
          <Label htmlFor="vnadres">Adres</Label>
          <TextInput id="vnadres" value={vn.adres} onChange={(e) => updateVn("adres", e.target.value)} />
          <div className="grid grid-cols-2 gap-x-3">
            <div>
              <Label htmlFor="vnpostcode">Postcode</Label>
              <TextInput id="vnpostcode" value={vn.postcode} onChange={(e) => updateVn("postcode", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="vnplaats">Plaats</Label>
              <TextInput id="vnplaats" value={vn.plaats} onChange={(e) => updateVn("plaats", e.target.value)} />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

async function runRijbewijsOcr(file: File): Promise<RijbewijsOcrData> {
  const data = await fileToBase64(file);
  const text = await callVision({
    system: RIJBEWIJS_OCR_SYSTEM,
    userText: "Lees dit rijbewijs uit en geef het JSON-object.",
    images: [{ mediaType: file.type || "image/jpeg", data }],
  });
  const parsed = parseJsonLoose<RijbewijsOcrData>(text);
  if (!parsed) throw new Error("parse-fout");
  return parsed;
}
