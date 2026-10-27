/** Styles de boutons communs à l'admin (grandes zones tactiles, lisibles en plein soleil). */
export const btn = {
  primary:
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-night px-5 text-base font-bold text-white transition-colors hover:bg-night-soft disabled:opacity-60",
  gold: "inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-gold px-5 text-base font-bold text-night-deep transition-colors hover:bg-gold-soft disabled:opacity-60",
  secondary:
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-night/30 bg-surface px-5 text-base font-semibold text-night transition-colors hover:bg-night-tint disabled:opacity-60",
  danger:
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-red-800/30 bg-surface px-5 text-base font-semibold text-red-800 transition-colors hover:bg-[#FDEBEC] disabled:opacity-60",
  small:
    "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-line bg-surface px-3 text-sm font-semibold text-night transition-colors hover:bg-night-tint",
};
