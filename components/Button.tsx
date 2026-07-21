import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "amber";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
  fullWidth?: boolean;
  /** Hides the text label below the `sm` breakpoint, keeping only the icon (requires aria-label). */
  compact?: boolean;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-navy-2 to-navy text-white shadow-[var(--shadow-button)] hover:brightness-110 disabled:from-[#9aa3b5] disabled:to-[#9aa3b5] disabled:shadow-none disabled:cursor-not-allowed",
  secondary:
    "bg-transparent text-navy border-[1.5px] border-line hover:border-navy hover:bg-paper-tint",
  amber:
    "bg-gradient-to-b from-amber to-amber-deep text-white shadow-[var(--shadow-button)] hover:brightness-110",
};

export default function Button({
  variant = "primary",
  icon,
  fullWidth,
  compact,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 min-h-[50px] rounded-full ${
        compact ? "px-4 sm:px-6" : "px-6"
      } py-3 font-semibold text-[14.5px] tracking-[0.01em] cursor-pointer transition-all duration-150 ease-out active:scale-[0.97] disabled:active:scale-100 ${
        fullWidth ? "flex-1" : ""
      } ${VARIANT_CLASS[variant]} ${className}`}
      {...props}
    >
      {icon}
      {compact ? <span className="hidden sm:inline">{children}</span> : children}
    </button>
  );
}
