"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Mic, Square, ArrowLeft, ArrowRight, Wand2 } from "lucide-react";
import Card from "./Card";
import Button from "./Button";
import StatusLine from "./StatusLine";
import SummaryBox from "./SummaryBox";
import { Textarea } from "./FormField";
import { ToedrachtOcrData, OcrStatus, ConflictCheckData } from "@/lib/types";
import { parseJsonLoose } from "@/lib/parseJsonLoose";
import { callVision } from "@/lib/visionClient";
import { TOEDRACHT_ANALYSE_SYSTEM } from "@/lib/prompts";

function subscribeNoop() {
  return () => {};
}
function getSpeechSupportSnapshot() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

interface StepToedrachtProps {
  text: string;
  setText: (t: string) => void;
  data: ToedrachtOcrData | null;
  setData: (d: ToedrachtOcrData | null) => void;
  conflictStatus: OcrStatus;
  conflictData: ConflictCheckData | null;
  onBack: () => void;
  onNext: () => void;
}

export default function StepToedracht({
  text,
  setText,
  data,
  setData,
  conflictStatus,
  conflictData,
  onBack,
  onNext,
}: StepToedrachtProps) {
  const [status, setStatus] = useState<OcrStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [recognizing, setRecognizing] = useState(false);
  const speechSupported = useSyncExternalStore(subscribeNoop, getSpeechSupportSnapshot, () => false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  function toggleRecording() {
    if (recognizing) {
      recognitionRef.current?.stop();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "nl-NL";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onstart = () => setRecognizing(true);
    recognition.onend = () => setRecognizing(false);
    recognition.onerror = () => setRecognizing(false);
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setText((text ? text + " " : "") + transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  }

  async function handleAnalyze() {
    if (!text.trim()) {
      alert("Beschrijf eerst kort wat er gebeurde.");
      return;
    }
    setStatus("busy");
    try {
      const result = await callVision({ system: TOEDRACHT_ANALYSE_SYSTEM, userText: text });
      const parsed = parseJsonLoose<ToedrachtOcrData>(result);
      if (!parsed) throw new Error("parse-fout");
      setData(parsed);
      setStatus("ok");
    } catch {
      setStatus("err");
      setErrorMessage("Analyse mislukt — probeer opnieuw of vul stap 5 handmatig aan.");
    }
  }

  return (
    <Card
      eyebrow="Stap 4 van 5"
      title="Wat is er gebeurd?"
      description="Spreek in of typ in je eigen woorden wat er gebeurde. Hoe meer detail, hoe beter het formulier wordt ingevuld."
      footer={
        <>
          <Button id="back4" variant="secondary" onClick={onBack} icon={<ArrowLeft size={17} strokeWidth={2.25} />}>
            Terug
          </Button>
          <Button id="next4" onClick={onNext} disabled={!data} fullWidth icon={<ArrowRight size={17} strokeWidth={2.25} />}>
            Volgende: overzicht
          </Button>
        </>
      }
    >
      {speechSupported && (
        <div className="mb-3">
          <button
            type="button"
            onClick={toggleRecording}
            className={`inline-flex items-center gap-2 rounded-full pl-2 pr-4 py-2 text-[13.5px] font-semibold cursor-pointer transition-all duration-150 ease-out active:scale-[0.97] ${
              recognizing ? "bg-red text-white" : "bg-paper-tint text-navy hover:bg-line-soft"
            }`}
          >
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                recognizing ? "bg-white/20" : "bg-navy/[0.08]"
              }`}
            >
              {recognizing ? (
                <Square size={13} strokeWidth={2.5} className="text-white fill-white" />
              ) : (
                <Mic size={14} strokeWidth={2.25} className="text-navy" />
              )}
            </span>
            {recognizing ? "Stop opname" : "Inspreken"}
          </button>
        </div>
      )}

      <Textarea
        rows={7}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Bijvoorbeeld: Vandaag rond 14:30 op de Grote Markt in Antwerpen. Ik stond stil voor een verkeerslicht toen de andere auto van achteren tegen mijn bumper reed. Geen gewonden. Schade aan mijn achterbumper."
      />

      <StatusLine status={status === "ok" ? "idle" : status}>
        {status === "busy" && "Toedracht analyseren…"}
        {status === "err" && errorMessage}
      </StatusLine>

      <Button
        id="analyze4"
        variant="amber"
        onClick={handleAnalyze}
        disabled={status === "busy"}
        fullWidth
        className="mt-3.5"
        icon={<Wand2 size={17} strokeWidth={2.25} />}
      >
        {status === "busy" ? "Analyseren…" : "Analyseer met AI"}
      </Button>

      {data && (
        <SummaryBox>
          <b>Samenvatting:</b> {data.opmerkingen || "—"}
          <br />
          <b>Zichtbare schade:</b> {data.zichtbare_schade_A || "—"}
          <br />
          <b>Vermoedelijke vakjes (12. toedracht):</b>{" "}
          {data.toedracht_vakjes_A && data.toedracht_vakjes_A.length ? data.toedracht_vakjes_A.join(", ") : "—"}
          <br />
          <span className="text-[#7A4A1E]">{data.toedracht_toelichting || ""}</span>
        </SummaryBox>
      )}

      {conflictStatus === "busy" && (
        <StatusLine status="busy">Verklaringen van beide partijen vergelijken…</StatusLine>
      )}
      {conflictStatus === "ok" && conflictData && (
        <SummaryBox tone={conflictData.consistent ? "success" : "warning"}>
          {conflictData.consistent ? (
            <>
              <b>Consistent:</b> {conflictData.toelichting || "Geen tegenstrijdigheden gevonden tussen beide verklaringen."}
            </>
          ) : (
            <>
              <b>Mogelijke tegenstrijdigheid:</b> {conflictData.toelichting || ""}
              {conflictData.aandachtspunten && conflictData.aandachtspunten.length > 0 && (
                <ul className="mt-1.5 ml-4 list-disc">
                  {conflictData.aandachtspunten.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              )}
              <div className="text-[11.5px] mt-1.5">Bespreek dit samen vóórdat jullie ondertekenen (vak 15).</div>
            </>
          )}
        </SummaryBox>
      )}
    </Card>
  );
}
