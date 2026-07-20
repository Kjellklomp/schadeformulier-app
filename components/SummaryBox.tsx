import { ReactNode } from "react";
import { Sparkles, AlertTriangle, LucideIcon } from "lucide-react";

interface SummaryBoxProps {
  tone?: "success" | "warning";
  icon?: LucideIcon;
  children: ReactNode;
}

const TONE_CLASS: Record<"success" | "warning", string> = {
  success: "bg-[#F1F7F3] text-[#204634]",
  warning: "bg-[#FBEDEA] text-[#7a2c1c]",
};

export default function SummaryBox({ tone = "success", icon, children }: SummaryBoxProps) {
  const Icon = icon ?? (tone === "success" ? Sparkles : AlertTriangle);
  return (
    <div className={`flex items-start gap-2.5 rounded-2xl px-4 py-3.5 text-[13.5px] leading-relaxed mt-3 ${TONE_CLASS[tone]}`}>
      <Icon size={16} strokeWidth={2} className={`shrink-0 mt-0.5 ${tone === "success" ? "text-green" : "text-red"}`} />
      <div>{children}</div>
    </div>
  );
}
