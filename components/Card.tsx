"use client";

import { ReactNode, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

interface CardProps {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
}

function subscribeNoop() {
  return () => {};
}

export default function Card({ eyebrow, title, description, children, footer }: CardProps) {
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  return (
    <>
      <div className="bg-paper-2 rounded-[24px] border border-line-soft shadow-[var(--shadow-card)] px-5 py-6 sm:px-7 sm:py-7 mb-4 [animation:card-enter_0.4s_ease-out]">
        <div className="no-print text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-deep mb-1.5">
          {eyebrow}
        </div>
        <h2 className="font-heading text-navy font-bold text-[26px] mb-1.5 tracking-tight leading-tight">{title}</h2>
        {description && <p className="text-ink-soft text-[14.5px] leading-relaxed mb-6">{description}</p>}
        {children}
      </div>
      {footer &&
        mounted &&
        createPortal(
          <div className="no-print fixed inset-x-0 bottom-0 z-30 bg-paper/85 backdrop-blur-md border-t border-line-soft shadow-[0_-8px_24px_-12px_rgba(24,33,56,0.15)]">
            <div
              className="max-w-[720px] mx-auto px-4 pt-3 flex gap-2.5"
              style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
            >
              {footer}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
