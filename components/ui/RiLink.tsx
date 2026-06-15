import Link from "next/link";
import type { ComponentProps } from "react";

type RiLinkProps = ComponentProps<typeof Link>;

export default function RiLink({ className = "", children, ...props }: RiLinkProps) {
  return (
    <Link
      className={`text-[var(--ri-accent)] underline-offset-4 transition hover:underline ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
