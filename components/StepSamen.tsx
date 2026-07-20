"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, SkipForward, CheckCircle2 } from "lucide-react";
import Card from "./Card";
import Button from "./Button";
import SummaryBox from "./SummaryBox";
import { PartnerData } from "@/lib/types";
import { generateQrDataUrl } from "@/lib/qrDataUrl";
import { fetchPartnerData } from "@/lib/sessionClient";

const POLL_INTERVAL_MS = 3500;

interface StepSamenProps {
  sessionId: string;
  partnerData: PartnerData | null;
  setPartnerData: (d: PartnerData) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function StepSamen({ sessionId, partnerData, setPartnerData, onBack, onNext }: StepSamenProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const link =
    typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}?s=${sessionId}` : "";

  useEffect(() => {
    if (!link) return;
    let cancelled = false;
    generateQrDataUrl(link).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [link]);

  useEffect(() => {
    if (partnerData) return;
    const timer = setInterval(async () => {
      try {
        const data = await fetchPartnerData(sessionId);
        if (data) setPartnerData(data);
      } catch {
        // netwerkfout tijdens pollen: gewoon volgende poging afwachten
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [sessionId, partnerData, setPartnerData]);

  return (
    <Card
      eyebrow="Stap 3 van 5"
      title="Samen invullen met de tegenpartij"
      description="Laat de andere bestuurder onderstaande QR-code scannen met zijn/haar eigen telefoon. Die vult zijn kant (Voertuig B) rechtstreeks in — geen overtypen, geen los papier."
      footer={
        <>
          <Button variant="secondary" onClick={onBack} icon={<ArrowLeft size={17} strokeWidth={2.25} />}>
            Terug
          </Button>
          {!partnerData && (
            <Button variant="secondary" onClick={onNext} icon={<SkipForward size={17} strokeWidth={2.25} />}>
              Overslaan
            </Button>
          )}
          <Button onClick={onNext} fullWidth icon={<ArrowRight size={17} strokeWidth={2.25} />}>
            Volgende: toedracht
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-paper-tint px-4 py-6">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} width={200} height={200} alt="QR-code voor de tegenpartij" className="rounded-xl shadow-[var(--shadow-card)]" />
        ) : (
          <div className="w-[200px] h-[200px] rounded-xl bg-line-soft animate-pulse" />
        )}
        <div className="font-mono text-[20px] font-semibold tracking-[0.12em] text-navy bg-white px-4 py-2 rounded-lg border border-dashed border-line">
          {sessionId}
        </div>
        <div className="text-[12px] text-ink-soft text-center break-all px-2">Of deel deze link: {link}</div>

        {!partnerData ? (
          <div className="flex items-center gap-2 text-[13px] text-ink-soft mt-1">
            <div className="w-[7px] h-[7px] rounded-full bg-amber animate-pulse" />
            <div>Wachten op gegevens van de tegenpartij…</div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[13px] text-green font-medium mt-1">
            <CheckCircle2 size={15} strokeWidth={2.25} />
            <div>Gegevens ontvangen</div>
          </div>
        )}
      </div>

      {partnerData && (
        <SummaryBox>
          <b>Voertuig B ontvangen:</b> {partnerData.naam} {partnerData.voornaam} · kenteken{" "}
          {partnerData.kenteken || "-"} · verzekeraar {partnerData.verzekeraar || "-"}
        </SummaryBox>
      )}
    </Card>
  );
}
