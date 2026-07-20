import { ReactNode } from "react";

interface CardProps {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
}

export default function Card({ eyebrow, title, description, children, footer }: CardProps) {
  return (
    <div className="bg-paper-2 rounded-[22px] border border-line-soft shadow-[var(--shadow-card)] px-5 py-6 sm:px-7 sm:py-7 mb-4">
      <div className="no-print text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-deep mb-1.5">
        {eyebrow}
      </div>
      <h2 className="font-heading text-navy font-semibold text-[22px] mb-1.5 tracking-tight">{title}</h2>
      {description && <p className="text-ink-soft text-[14.5px] leading-relaxed mb-6">{description}</p>}
      {children}
      {footer && <div className="no-print flex gap-2.5 mt-7">{footer}</div>}
    </div>
  );
}
