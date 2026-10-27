/** En-tête commun des pages intérieures (bandeau bleu nuit avec filet doré). */
export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative bg-night text-white">
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gold" />
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-12 sm:px-6 sm:pt-14 sm:pb-16">
        {eyebrow && <p className="text-sm font-semibold tracking-[0.18em] text-gold-soft uppercase">{eyebrow}</p>}
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold text-white sm:text-5xl">{title}</h1>
        {children && <div className="mt-5 max-w-2xl text-lg text-white/85">{children}</div>}
      </div>
    </div>
  );
}
