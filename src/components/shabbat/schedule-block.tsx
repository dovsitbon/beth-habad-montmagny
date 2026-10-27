import { lineValue, minutesToHHMM, visibleLines, type Occasion, type ScheduleLine } from "@/lib/horaires/calcul";

type Props = {
  occasion: Occasion;
  /** Niveau des titres de blocs (Vendredi, Chabbat matin…) selon la place dans la page. */
  headingLevel?: "h3" | "h4";
  /** Affiche le titre « HORAIRES CHABBAT … » (masqué quand la carte l'affiche déjà ailleurs). */
  showTitle?: boolean;
};

/**
 * Horaires d'un Chabbat ou d'une fête, dans l'ordre et avec le vocabulaire du message du rabbin :
 * Vendredi (allumage, Minha suivi d'Arvit) / Chabbat matin (Tania, Chaharit, Kidouch) /
 * après-midi (Cours, Minha, Fin, Arvit), puis « Chabbat Chalom ».
 */
export function ScheduleBlock({ occasion, headingLevel: Heading = "h3", showTitle = true }: Props) {
  return (
    <div>
      {showTitle && (
        <p className="font-serif text-xl font-semibold tracking-[0.04em] text-night uppercase sm:text-2xl">
          {occasion.title}
          {occasion.parashaHebrew && (
            <span lang="he" dir="rtl" className="ml-3 align-middle font-serif text-lg font-normal tracking-normal text-ink-muted normal-case">
              {occasion.parashaHebrew}
            </span>
          )}
        </p>
      )}
      {occasion.special && <p className="mt-1 font-semibold text-gold-ink">{occasion.special}</p>}

      <div className="mt-4 space-y-5">
        {occasion.sections.map((section) => {
          const lines = visibleLines(section);
          const kidouch = section.kidouch ? occasion.kidouch : null;
          if (lines.length === 0 && !kidouch) return null;
          return (
            <section key={section.id} aria-label={section.label}>
              <Heading className="border-b border-line pb-1.5 text-sm font-semibold tracking-[0.12em] text-gold-ink uppercase">
                {section.label}
              </Heading>
              <dl>
                {lines.map((line) => (
                  <Line key={line.id} line={line} />
                ))}
              </dl>
              {kidouch && <p className="mt-2 rounded-md bg-gold-tint px-3 py-2.5 font-semibold text-ink">{kidouch}</p>}
            </section>
          );
        })}
      </div>

      {occasion.note && <p className="mt-5 rounded-md bg-canvas px-3 py-2.5 text-ink">{occasion.note}</p>}
      <p className="mt-5 text-center font-serif text-2xl text-night">{occasion.closing}</p>
    </div>
  );
}

function Line({ line }: { line: ScheduleLine }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line/70 py-2 last:border-b-0">
      <dt className="text-ink">{line.label}</dt>
      {line.minutes !== null && (
        <dd className="text-right whitespace-nowrap">
          {line.prefix && <span className="mr-1 text-sm text-ink-muted">{line.prefix}</span>}
          <time dateTime={minutesToHHMM(line.minutes)} className="text-xl font-semibold text-night tabular-nums">
            {lineValue({ ...line, prefix: null })}
          </time>
        </dd>
      )}
    </div>
  );
}
