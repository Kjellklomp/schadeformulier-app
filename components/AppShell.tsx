"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ChipRow from "@/components/ChipRow";
import ProgressBar from "@/components/ProgressBar";
import StepPerson from "@/components/StepPerson";
import StepVehicle from "@/components/StepVehicle";
import StepSamen from "@/components/StepSamen";
import StepToedracht from "@/components/StepToedracht";
import StepOverzicht from "@/components/StepOverzicht";
import PartnerFlow from "@/components/PartnerFlow";
import {
  PersonState,
  VerzekeringnemerState,
  KentekenState,
  VerzekeringState,
  ToedrachtOcrData,
  PartnerData,
  ConflictCheckData,
  OcrStatus,
} from "@/lib/types";
import { genSessionId } from "@/lib/session";
import { callVision } from "@/lib/visionClient";
import { parseJsonLoose } from "@/lib/parseJsonLoose";
import { CONFLICT_CHECK_SYSTEM } from "@/lib/prompts";

const TOTAL_STEPS = 5;

const initialPerson: PersonState = {
  naam: "",
  voornaam: "",
  geboortedatum: "",
  tel: "",
  rijbewijsnr: "",
  categorie: "",
  geldigtot: "",
  adres: "",
  postcode: "",
  plaats: "",
  land: "Nederland",
};

const initialVn: VerzekeringnemerState = {
  zelfde: true,
  naam: "",
  voornaam: "",
  adres: "",
  postcode: "",
  plaats: "",
  land: "Nederland",
  tel: "",
};

const initialKenteken: KentekenState = {
  status: "idle",
  data: null,
  rdw: { status: "idle", data: null, mismatch: false },
};

const initialVerzekering: VerzekeringState = { status: "idle", data: null };

export default function AppShell() {
  const searchParams = useSearchParams();
  const incomingSession = searchParams.get("s");

  const [step, setStep] = useState(1);
  const [person, setPerson] = useState(initialPerson);
  const [vn, setVn] = useState(initialVn);
  const [kenteken, setKenteken] = useState(initialKenteken);
  const [verzekering, setVerzekering] = useState(initialVerzekering);
  const [toedrachtText, setToedrachtText] = useState("");
  const [toedrachtData, setToedrachtData] = useState<ToedrachtOcrData | null>(null);
  const [sessionId] = useState(() => genSessionId());
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [conflictStatus, setConflictStatus] = useState<OcrStatus>("idle");
  const [conflictData, setConflictData] = useState<ConflictCheckData | null>(null);
  const [startTime] = useState(() => Date.now());
  const conflictStartedRef = useRef(false);

  useEffect(() => {
    if (conflictStartedRef.current || !toedrachtData || !partnerData?.toedracht) return;
    conflictStartedRef.current = true;
    let cancelled = false;
    const runConflictCheck = async () => {
      setConflictStatus("busy");
      try {
        const text = await callVision({
          system: CONFLICT_CHECK_SYSTEM,
          userText: `Verklaring A: ${toedrachtData.opmerkingen}\n\nVerklaring B: ${partnerData.toedracht}`,
        });
        if (cancelled) return;
        const parsed = parseJsonLoose<ConflictCheckData>(text);
        if (!parsed) throw new Error("parse-fout");
        setConflictData(parsed);
        setConflictStatus("ok");
      } catch {
        if (!cancelled) setConflictStatus("err");
      }
    };
    runConflictCheck();
    return () => {
      cancelled = true;
    };
  }, [toedrachtData, partnerData]);

  if (incomingSession) {
    return (
      <div className="max-w-[720px] mx-auto px-4 pt-6 pb-32 w-full">
        <PartnerFlow sessionId={incomingSession} />
      </div>
    );
  }

  return (
    <>
      <header className="no-print sticky top-0 z-40 bg-paper/80 backdrop-blur-md border-b border-line-soft/70">
        <div className="relative max-w-[720px] mx-auto px-4 py-4 flex items-center gap-3 overflow-hidden">
          <div
            className="pointer-events-none absolute -top-10 -left-6 w-40 h-40 rounded-full bg-amber/15 blur-3xl"
            aria-hidden
          />
          <div className="relative w-9 h-9 rounded-[10px] bg-gradient-to-b from-navy-2 to-navy shadow-[var(--shadow-button)] flex items-center justify-center text-amber font-heading font-bold text-[15px] shrink-0">
            EU
          </div>
          <div className="relative">
            <div className="font-heading font-bold text-[15.5px] text-navy tracking-tight">Schadeformulier Snelinvuller</div>
            <div className="text-[11.5px] text-ink-soft">
              Vult jouw kant automatisch in, checkt live bij de RDW, en synct met de tegenpartij
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[720px] mx-auto px-4 pt-5 pb-32 w-full">
        <ChipRow />
        <ProgressBar step={step} totalSteps={TOTAL_STEPS} />

        {step === 1 && (
          <StepPerson person={person} setPerson={setPerson} vn={vn} setVn={setVn} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <StepVehicle
            kenteken={kenteken}
            setKenteken={setKenteken}
            verzekering={verzekering}
            setVerzekering={setVerzekering}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepSamen
            sessionId={sessionId}
            partnerData={partnerData}
            setPartnerData={setPartnerData}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <StepToedracht
            text={toedrachtText}
            setText={setToedrachtText}
            data={toedrachtData}
            setData={setToedrachtData}
            conflictStatus={conflictStatus}
            conflictData={conflictData}
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
          />
        )}
        {step >= 5 && (
          <StepOverzicht
            person={person}
            vn={vn}
            kenteken={kenteken}
            verzekering={verzekering}
            toedracht={toedrachtData}
            partnerData={partnerData}
            startTime={startTime}
            onBack={() => setStep(4)}
          />
        )}

        <div className="no-print text-center text-[11.5px] text-ink-soft mt-6 leading-relaxed">
          Prototype ter validatie. Gegevens blijven lokaal tot je ze exporteert.
        </div>
      </div>
    </>
  );
}
