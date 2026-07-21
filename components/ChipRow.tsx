import { Mic, Radar, QrCode, Sparkles } from "lucide-react";

const CHIPS = [
  { icon: Mic, label: "Spraak → formulier" },
  { icon: Radar, label: "Live RDW-check" },
  { icon: QrCode, label: "Samen via QR" },
  { icon: Sparkles, label: "AI-conflictcheck" },
];

export default function ChipRow() {
  return (
    <div className="no-print flex flex-wrap gap-2 mt-6">
      {CHIPS.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="bg-white/[0.08] border border-white/15 rounded-full pl-1.5 pr-3.5 py-1.5 text-[12px] font-medium text-white/90 flex items-center gap-2 backdrop-blur-sm"
        >
          <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <Icon size={13} strokeWidth={2} className="text-amber" />
          </span>
          {label}
        </div>
      ))}
    </div>
  );
}
