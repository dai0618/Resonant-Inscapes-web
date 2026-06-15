import type { InputHTMLAttributes } from "react";

type RiInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export default function RiInput({ label, className = "", id, ...props }: RiInputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={className}>
      {label ? (
        <label htmlFor={inputId} className="mb-2 block text-xs tracking-[0.12em] text-[var(--ri-muted)]">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className="w-full border-b border-[var(--ri-line)] bg-transparent py-2.5 text-sm text-[var(--ri-text)] outline-none placeholder:text-[var(--ri-muted)] focus:border-[var(--ri-accent)]"
        {...props}
      />
    </div>
  );
}
