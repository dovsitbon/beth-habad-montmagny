import "server-only";
import sanitizeHtml from "sanitize-html";
import type { z } from "zod";

/** Résultat standard d'une action de l'admin, affiché au-dessus du formulaire. */
export type ActionState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

/** Transforme les erreurs Zod en { champ: message } (premier message par champ). */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function invalid(error: z.ZodError): ActionState {
  return { ok: false, fieldErrors: fieldErrorsFrom(error), message: "Merci de corriger les champs indiqués en rouge." };
}

export const TECH_ERROR: ActionState = {
  ok: false,
  message: "L'enregistrement n'a pas fonctionné. Vérifiez votre connexion internet et réessayez.",
};

/** Nettoie le HTML produit par l'éditeur de texte : seules les mises en forme simples sont gardées. */
export function cleanHtml(html: string): string {
  const cleaned = sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "em", "u", "s", "h2", "h3", "ul", "ol", "li", "a", "blockquote"],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? "#";
        const out: Record<string, string> = /^https?:/.test(href) ? { href, target: "_blank", rel: "noopener" } : { href };
        return { tagName, attribs: out };
      },
    },
  }).trim();
  // Un éditeur vide renvoie « <p></p> » : on le considère comme vide.
  return cleaned.replace(/^(<p>\s*<\/p>)+$/, "");
}

/** « Repas de Chabbat ! » → « repas-de-chabbat » */
export function slugify(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/\[exemple\]/g, "exemple")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "element"
  );
}

/** Petit suffixe aléatoire pour garantir l'unicité d'une adresse (slug). */
export function shortId(): string {
  return Math.random().toString(36).slice(2, 6);
}

// ---------------------------------------------------------------------------
// Dates : le formulaire travaille en heure de Paris, la base en UTC.
// ---------------------------------------------------------------------------

const TZ = "Europe/Paris";

function offsetMinutes(utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return Math.round((asUtc - utcMs) / 60000);
}

/** « 2026-11-06 » + « 20:00 » (heure de Paris) → horodatage ISO UTC. */
export function parisToISO(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const naive = Date.UTC(y, m - 1, d, hh, mm);
  // Deux passes pour tomber juste autour des changements d'heure.
  let utc = naive - offsetMinutes(naive) * 60000;
  utc = naive - offsetMinutes(utc) * 60000;
  return new Date(utc).toISOString();
}

/** Horodatage ISO → { date: « 2026-11-06 », time: « 20:00 » } en heure de Paris. */
export function isoToParis(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
  const time = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
  return { date, time };
}

export const dateField = /^\d{4}-\d{2}-\d{2}$/;
export const timeField = /^\d{2}:\d{2}$/;

/** Horodatage ISO décalé de `days` jours par rapport à maintenant (négatif = dans le passé). */
export function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}
