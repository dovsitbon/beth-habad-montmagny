import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col items-start justify-center px-4 py-24">
      <p className="text-sm font-semibold tracking-[0.14em] text-gold-ink uppercase">Page introuvable</p>
      <h1 className="mt-3 text-4xl text-night">Cette page n&apos;existe pas (ou pas encore).</h1>
      <p className="mt-4 text-ink-muted">Le lien est peut-être incorrect, ou la page a été déplacée.</p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center rounded-md bg-night px-5 font-semibold text-white hover:bg-night-soft"
      >
        Revenir à l&apos;accueil
      </Link>
    </main>
  );
}
