import { siteConfig } from "@/config/site.config";

const TZ = siteConfig.timeZone;

/** Date du jour à Paris au format AAAA-MM-JJ. */
export function todayISO(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
}

/** Ajoute des jours à une date AAAA-MM-JJ. */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Heure à la française : « 17 h 15 ». Accepte un horodatage ISO ou une heure « HH:MM(:SS) ». */
export function formatTime(value: string): string {
  let hours: string;
  let minutes: string;
  if (/^\d{2}:\d{2}/.test(value)) {
    [hours, minutes] = value.split(":");
  } else {
    const parts = new Intl.DateTimeFormat("fr-FR", {
      timeZone: TZ,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(value));
    hours = parts.find((p) => p.type === "hour")!.value;
    minutes = parts.find((p) => p.type === "minute")!.value;
  }
  return `${Number(hours)} h ${minutes}`;
}

/** Heure au format HH:MM pour l'attribut datetime des balises <time>. */
export function timeAttr(value: string): string {
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

/** « vendredi 30 octobre » (date AAAA-MM-JJ, sans décalage horaire). */
export function formatDayLong(isoDate: string, withYear = false): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(withYear ? { year: "numeric" } : {}),
  }).format(new Date(`${isoDate}T12:00:00Z`));
}

/** « 30 oct. » (date AAAA-MM-JJ). */
export function formatDayShort(isoDate: string): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", day: "numeric", month: "short" }).format(
    new Date(`${isoDate}T12:00:00Z`),
  );
}

// ---------------------------------------------------------------------------
// Date hébraïque (calendrier hébraïque intégré au navigateur / à Node : aucun appel réseau)
// ---------------------------------------------------------------------------

const ONES = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
const TENS = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
const HUNDREDS = ["", "ק", "ר", "ש", "ת"];

/** Nombre en lettres hébraïques (guématria) : 15 → ט״ו, 787 → תשפ״ז. */
export function gematriya(n: number): string {
  let rest = n % 1000;
  let letters = "";
  while (rest >= 400) {
    letters += "ת";
    rest -= 400;
  }
  letters += HUNDREDS[Math.floor(rest / 100)];
  rest %= 100;
  // 15 et 16 s'écrivent ט״ו et ט״ז (on évite d'écrire le Nom divin).
  if (rest === 15 || rest === 16) {
    letters += "ט" + ONES[rest - 9];
  } else {
    letters += TENS[Math.floor(rest / 10)] + ONES[rest % 10];
  }
  return letters.length === 1 ? `${letters}׳` : `${letters.slice(0, -1)}״${letters.slice(-1)}`;
}

/** Date hébraïque d'une date civile AAAA-MM-JJ, en français et en hébreu. */
export function hebrewDate(isoDate: string): { fr: string; he: string } {
  const date = new Date(`${isoDate}T12:00:00Z`);
  const parts = (locale: string) =>
    new Intl.DateTimeFormat(locale, { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).formatToParts(
      date,
    );

  const fr = parts("fr-FR-u-ca-hebrew");
  const day = Number(fr.find((p) => p.type === "day")!.value);
  const month = fr.find((p) => p.type === "month")!.value;
  const year = Number(fr.find((p) => p.type === "year")!.value);

  const heMonth = parts("he-IL-u-ca-hebrew").find((p) => p.type === "month")!.value;

  return {
    fr: `${day === 1 ? "1er" : day} ${month} ${year}`,
    he: `${gematriya(day)} ${heMonth} ${gematriya(year)}`,
  };
}

/** URL publique d'une image du stockage Supabase (bucket « media »). */
export function mediaUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${path}`;
}

/** « samedi 7 novembre 2026 à 20 h 00 » (horodatage ISO, heure de Paris). */
export function formatDateTimeLong(iso: string): string {
  const date = new Intl.DateTimeFormat("fr-FR", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
  return `${date} à ${formatTime(iso)}`;
}

/** Date AAAA-MM-JJ (heure de Paris) d'un horodatage ISO. */
export function isoDateInParis(iso: string): string {
  return todayISO(new Date(iso));
}

/** Retire les balises HTML (pour les résumés, le fichier .ics, les métadonnées). */
export function stripHtml(html: string): string {
  return html
    .replace(/<\/(p|h[1-6]|li|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** « 06 12 83 38 48 » → « +33612833848 » (numéro français à 10 chiffres ; sinon chiffres et + seulement). */
export function internationalPhone(phone: string): string {
  const compact = phone.replace(/[^+\d]/g, "");
  return /^0\d{9}$/.test(compact) ? `+33${compact.slice(1)}` : compact;
}

/** Lien d'appel : « tel:+33612833848 ». */
export function telHref(phone: string): string {
  return `tel:${internationalPhone(phone)}`;
}

/** Lien WhatsApp : « https://wa.me/33612833848 » (numéro international sans + ni espaces). */
export function whatsappHref(number: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}`;
}

/** Itinéraire Google Maps vers une adresse (ouvre l'application sur téléphone). */
export function directionsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

/** Itinéraire Waze vers des coordonnées GPS. */
export function wazeUrl(latitude: number, longitude: number): string {
  return `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
}
