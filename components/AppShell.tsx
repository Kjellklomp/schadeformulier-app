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

  // Elke stap begint bovenaan — de hero is hoog genoeg dat een oude scrollpositie anders
  // de kaarttitel uit beeld zou houden.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

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

  const hero = (
    <header className="no-print relative bg-gradient-to-b from-navy-2 to-navy pb-24 overflow-hidden">
      <div
        className="pointer-events-none absolute -top-28 right-[-12%] w-96 h-96 rounded-full bg-amber/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[-40%] left-[-10%] w-72 h-72 rounded-full bg-white/[0.04] blur-2xl"
        aria-hidden
      />
      <div className="relative max-w-[720px] mx-auto px-4 pt-9">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-amber font-heading font-bold text-[17px] shrink-0">
            EU
          </div>
          <h1 className="font-heading font-bold text-[24px] sm:text-[28px] text-white tracking-tight leading-tight">
            Schadeformulier Snelinvuller
          </h1>
        </div>
        <p className="text-white/65 text-[13.5px] mt-3.5 max-w-md leading-relaxed">
          Vult jouw kant automatisch in, checkt live bij de RDW, en synct met de tegenpartij.
        </p>
        {!incomingSession && <ChipRow />}
      </div>
    </header>
  );

  if (incomingSession) {
    return (
      <>
        {hero}
        <div className="max-w-[720px] mx-auto px-4 -mt-16 pb-32 w-full relative">
          <PartnerFlow sessionId={incomingSession} />
        </div>
      </>
    );
  }

  return (
    <>
      {hero}
      <div className="max-w-[720px] mx-auto px-4 -mt-16 pb-32 w-full relative">
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
