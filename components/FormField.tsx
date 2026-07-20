import { InputHTMLAttributes, LabelHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Label({
  required,
  className = "",
  ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={`block text-[13px] font-semibold text-ink mt-4 mb-1.5 ${className}`} {...props}>
      {props.children}
      {required && <span className="text-red"> *</span>}
    </label>
  );
}

const fieldBase =
  "w-full px-3.5 py-3 rounded-[13px] text-[15px] bg-paper-tint text-ink border border-transparent transition-all duration-150 ease-out placeholder:text-ink-soft/60 focus:outline-none focus:border-amber/40 focus:bg-white focus:shadow-[var(--shadow-focus)]";

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldBase} ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldBase} resize-none leading-relaxed ${className}`} {...props} />;
}
