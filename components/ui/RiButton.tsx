import type { ButtonHTMLAttributes, ReactNode } from "react";

type RiButtonVariant = "primary" | "ghost" | "text";

type RiButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: RiButtonVariant;
  children: ReactNode;
};

const variantClass: Record<RiButtonVariant, string> = {
  primary:
    "border border-[var(--ri-accent)]/40 py-3.5 text-[var(--ri-accent)] tracking-[0.15em] hover:border-[var(--ri-accent)] hover:bg-[var(--ri-accent-dim)]",
  ghost: "border border-[var(--ri-line)] py-3 text-[var(--ri-muted)] tracking-[0.12em] hover:text-[var(--ri-text)]",
  text: "py-2 text-[var(--ri-muted)] tracking-[0.1em] hover:text-[var(--ri-accent)]",
};

export default function RiButton({
  variant = "primary",
  className = "",
  type = "button",
  children,
  ...props
}: RiButtonProps) {
  return (
    <button
      type={type}
      className={`w-full text-xs uppercase transition disabled:opacity-40 ${variantClass[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
