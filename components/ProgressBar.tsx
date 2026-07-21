export default function ProgressBar({ step, totalSteps }: { step: number; totalSteps: number }) {
  const pct = Math.min(100, Math.max(0, (step / totalSteps) * 100));
  return (
    <div className="no-print mb-5 flex items-center gap-3">
      {/* Deze balk ligt op de navy hero-overlap, vandaar de lichte track. */}
      <div className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-deep to-amber shadow-[0_0_10px_rgba(217,142,43,0.55)] transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70 tabular-nums shrink-0">
        {step}/{totalSteps}
      </span>
    </div>
  );
}
