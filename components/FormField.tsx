import { InputHTMLAttributes, LabelHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Label({
  required,
  className = "",
  ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={`block text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-soft mt-5 mb-2 ${className}`}
      {...props}
    >
      {props.children}
      {required && <span className="text-red"> *</span>}
    </label>
  );
}

const fieldBase =
  "w-full px-4 py-3 rounded-2xl text-[15px] bg-white text-ink border-[1.5px] border-line transition-all duration-150 ease-out placeholder:text-ink-soft/50 focus:outline-none focus:border-amber focus:shadow-[var(--shadow-focus)]";

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldBase} ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldBase} resize-none leading-relaxed ${className}`} {...props} />;
}
