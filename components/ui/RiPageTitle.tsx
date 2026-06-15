type RiPageTitleProps = {
  children: React.ReactNode;
  subtitle?: string;
  as?: "h1" | "h2";
};

export default function RiPageTitle({ children, subtitle, as: Tag = "h1" }: RiPageTitleProps) {
  return (
    <header className="py-8">
      <Tag className="text-2xl font-light tracking-tight text-[var(--ri-text)]">{children}</Tag>
      {subtitle ? <p className="mt-4 text-sm font-light leading-relaxed text-[var(--ri-muted)]">{subtitle}</p> : null}
    </header>
  );
}
