import { siteConfig } from "@/config/site.config";
import { getSettings } from "@/lib/data/settings";
import { getUpcomingEvents } from "@/lib/data/content";
import { formatDateTimeLong } from "@/lib/format";

/**
 * /llms.txt (https://llmstxt.org) : résumé lisible par les assistants IA
 * (ChatGPT, Perplexity, Claude…) pour qu'ils décrivent correctement le Beth Habad.
 * Généré à partir des paramètres et des événements publiés : toujours à jour.
 */
export async function GET() {
  const [s, events] = await Promise.all([getSettings(), getUpcomingEvents(10)]);
  const base = siteConfig.url;
  const address = [s.address.street, [s.address.postalCode, s.address.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");

  const lines = [
    `# ${s.name}`,
    "",
    `> ${s.tagline ?? siteConfig.description}`,
    "",
    `Adresse : ${address}.`,
    s.phone ? `Téléphone : ${s.phone}.` : null,
    s.email ? `E-mail : ${s.email}.` : null,
    "",
    "## Pages principales",
    "",
    `- [Horaires de Chabbat et des fêtes](${base}/horaires) : allumage des bougies, Havdala, fêtes juives, calculés pour ${s.address.city}`,
    `- [Horaires des offices](${base}/offices) : Chaharit, Minha, Arvit`,
    `- [Événements](${base}/evenements) : agenda et inscriptions`,
    `- [Cours et activités](${base}/cours)`,
    `- [CTeen](${base}/cteen) : activités pour les adolescents`,
    `- [Le Beth Habad et le Rabbin](${base}/beth-habad)`,
    `- [Faire un don](${base}/faire-un-don)`,
    `- [Contact et accès](${base}/contact)`,
    events.length ? "" : null,
    events.length ? "## Prochains événements" : null,
    events.length ? "" : null,
    ...events.map((e) => `- [${e.title}](${base}/evenements/${e.slug}) : ${formatDateTimeLong(e.starts_at)}`),
  ].filter((l) => l !== null);

  return new Response(lines.join("\n") + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
