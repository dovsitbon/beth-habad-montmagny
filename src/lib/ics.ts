/**
 * Génération d'un fichier iCalendar (.ics, RFC 5545) pour « Ajouter à mon agenda ».
 * Compatible Google Agenda, Apple Calendrier et Outlook.
 */

type IcsEvent = {
  uid: string;
  title: string;
  start: string;
  end?: string | null;
  location?: string | null;
  description?: string | null;
  url?: string;
};

/** Format UTC compact : 20261107T190000Z */
function icsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Plie les lignes à 75 octets (exigence du format), sans couper un caractère UTF-8. */
function fold(line: string): string {
  const encoder = new TextEncoder();
  const out: string[] = [];
  let current = "";
  for (const char of line) {
    const limit = out.length === 0 ? 75 : 74; // les lignes de continuation commencent par un espace
    if (encoder.encode(current + char).length > limit) {
      out.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  out.push(current);
  return out.join("\r\n ");
}

export function buildIcs(event: IcsEvent, calendarName: string): string {
  // Sans heure de fin, on compte 2 heures par défaut.
  const end = event.end ?? new Date(new Date(event.start).getTime() + 2 * 3600 * 1000).toISOString();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${escapeText(calendarName)}//Site web//FR`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(event.start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    event.location ? `LOCATION:${escapeText(event.location)}` : null,
    event.description ? `DESCRIPTION:${escapeText(event.description)}` : null,
    event.url ? `URL:${event.url}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((l): l is string => l !== null);

  return lines.map(fold).join("\r\n") + "\r\n";
}
