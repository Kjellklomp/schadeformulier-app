import { Mic, Radar, QrCode, Sparkles } from "lucide-react";

const CHIPS = [
  { icon: Mic, label: "Spraak → formulier" },
  { icon: Radar, label: "Live RDW-check" },
  { icon: QrCode, label: "Samen invullen via QR" },
  { icon: Sparkles, label: "AI-conflictcheck" },
];

export default function ChipRow() {
  return (
    <div className="no-print flex flex-wrap gap-2 mb-5">
      {CHIPS.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="bg-paper-2 border border-line-soft rounded-full pl-1.5 pr-3 py-1.5 text-[12.5px] font-semibold text-navy-2 flex items-center gap-2 shadow-[var(--shadow-card)]"
        >
          <span className="w-7 h-7 rounded-full bg-navy/[0.07] flex items-center justify-center shrink-0">
            <Icon size={14} strokeWidth={2.25} className="text-amber-deep" />
          </span>
          {label}
        </div>
      ))}
    </div>
  );
}
