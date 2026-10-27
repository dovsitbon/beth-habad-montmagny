import type { TimeEntry } from "@/lib/hebcal";
import { formatTime, timeAttr } from "@/lib/format";

/** Une heure (calculée ou corrigée par le Beth Habad), avec la mention « ajusté » si besoin. */
export function TimeValue({ entry, fallback = "—" }: { entry: TimeEntry | null; fallback?: string }) {
  if (!entry) return <span className="text-ink-muted">{fallback}</span>;
  return (
    <span className="inline-flex flex-wrap items-baseline justify-end gap-x-2">
      <time dateTime={timeAttr(entry.value)} className="tabular-nums">
        {formatTime(entry.value)}
      </time>
      {entry.overridden && (
        <span className="text-xs font-semibold text-gold-ink" title={entry.note ?? undefined}>
          ajusté par le Beth Habad
        </span>
      )}
    </span>
  );
}
