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
      <div className="bg-paper-2 rounded-[28px] shadow-[var(--shadow-raised)] px-5 py-7 sm:px-8 sm:py-8 mb-4 [animation:card-enter_0.4s_ease-out]">
        <div className="no-print inline-flex items-center rounded-full bg-amber/10 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-amber-deep mb-3.5">
          {eyebrow}
        </div>
        <h2 className="font-heading text-navy font-bold text-[28px] sm:text-[32px] mb-2 tracking-[-0.02em] leading-[1.1]">{title}</h2>
        {description && <p className="text-ink-soft text-[14.5px] leading-relaxed mb-7">{description}</p>}
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
