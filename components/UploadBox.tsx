"use client";

import { useEffect, useMemo, useRef } from "react";
import { Check, LucideIcon } from "lucide-react";

interface UploadBoxProps {
  icon: LucideIcon;
  label: string;
  hint: string;
  accept?: string;
  capture?: string;
  multiple?: boolean;
  maxFiles?: number;
  files: File[];
  onFilesSelected: (files: File[]) => void;
}

export default function UploadBox({
  icon: Icon,
  label,
  hint,
  accept = "image/*",
  capture,
  multiple,
  maxFiles = 1,
  files,
  onFilesSelected,
}: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const thumbs = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  useEffect(() => {
    return () => thumbs.forEach((u) => URL.revokeObjectURL(u));
  }, [thumbs]);

  const filled = files.length > 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`w-full border-[1.5px] border-dashed rounded-2xl p-5 text-center cursor-pointer bg-paper-tint mt-1.5 transition-all duration-150 ease-out hover:border-amber hover:bg-white focus:outline-none focus-visible:shadow-[var(--shadow-focus)] ${
          filled ? "border-solid border-green/50 bg-[#F1F7F3]" : "border-line"
        }`}
      >
        <div
          className={`w-11 h-11 rounded-full mx-auto mb-2.5 flex items-center justify-center ${
            filled ? "bg-green/15" : "bg-navy/[0.06]"
          }`}
        >
          {filled ? <Check size={20} strokeWidth={2.5} className="text-green" /> : <Icon size={20} strokeWidth={1.75} className="text-navy" />}
        </div>
        <div className="text-[14.5px] font-medium text-ink">{label}</div>
        <div className="text-[12.5px] text-ink-soft mt-0.5">{hint}</div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        capture={capture as never}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const selected = Array.from(e.target.files || []).slice(0, maxFiles);
          if (selected.length) onFilesSelected(selected);
          e.target.value = "";
        }}
      />
      {thumbs.length > 0 && (
        <div className="flex gap-2 mt-2.5 flex-wrap">
          {thumbs.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="w-[70px] h-12 object-cover rounded-lg border border-line-soft" />
          ))}
        </div>
      )}
    </div>
  );
}
