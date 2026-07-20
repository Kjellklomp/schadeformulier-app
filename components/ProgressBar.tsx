export default function ProgressBar({ step, totalSteps }: { step: number; totalSteps: number }) {
  const pct = Math.min(100, Math.max(0, (step / totalSteps) * 100));
  return (
    <div className="no-print mb-6">
      <div className="h-[6px] rounded-full bg-line-soft overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-deep to-amber transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
