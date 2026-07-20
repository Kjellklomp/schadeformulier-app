import { OcrStatus } from "@/lib/types";

const DOT_CLASS: Record<OcrStatus, string> = {
  idle: "bg-line",
  busy: "bg-amber animate-pulse",
  ok: "bg-green",
  err: "bg-red",
};

export default function StatusLine({ status, children }: { status: OcrStatus; children: React.ReactNode }) {
  if (status === "idle") return null;
  return (
    <div className="flex items-center gap-2 text-[13px] text-ink-soft mt-3" role="status">
      <div className={`w-[7px] h-[7px] rounded-full shrink-0 ${DOT_CLASS[status]}`} />
      <div>{children}</div>
    </div>
  );
}
