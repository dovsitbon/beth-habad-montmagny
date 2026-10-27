/**
 * Bascule de l'accueil dans un vrai navigateur (Edge) : npm run test:accueil
 *   E2E_BASE_URL=https://… npm run test:accueil   (pour tester le site en ligne)
 *
 * L'horloge du navigateur est avancée au jeudi, vendredi et samedi qui viennent (heure de Paris) :
 * la page, servie depuis le cache, doit basculer seule entre « Offices de la semaine » et
 * « Horaires Chabbat », sans nouveau déploiement.
 */
import { chromium } from "playwright-core";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const TZ = "Europe/Paris";

let failed = 0;
function check(label, ok) {
  console.log(`  ${ok ? "✓" : "✗"} ${label}`);
  if (!ok) failed++;
}

const isoDate = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
const addDays = (iso, n) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** « 2026-10-30 » + « 10:00 » à Paris → Date (UTC). */
function paris(date, time) {
  const naive = Date.parse(`${date}T${time}:00Z`);
  const offset = (ms) => {
    const p = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(ms);
    const g = (t) => Number(p.find((x) => x.type === t).value);
    return (Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute")) - ms) / 60000;
  };
  return new Date(naive - offset(naive - offset(naive) * 60000) * 60000);
}

// Le vendredi qui vient (au moins demain).
let friday = addDays(isoDate(new Date()), 1);
while (new Date(`${friday}T12:00:00Z`).getUTCDay() !== 5) friday = addDays(friday, 1);
const thursday = addDays(friday, -1);
const saturday = addDays(friday, 1);

const browser = await chromium.launch({ channel: "msedge" });

/** Texte du bloc principal de l'accueil (juste sous la bannière) à l'instant donné. */
async function homeAt(date) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, timezoneId: TZ });
  await context.clock.setFixedTime(date);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const text = await page.locator("main").innerText();
  const first = await page.locator("main section").nth(1).innerText();
  await context.close();
  return { text, first, errors };
}

console.log(`\nAccueil (${BASE}) — semaine du ${thursday} au ${saturday}`);

const jeudi = await homeAt(paris(thursday, "22:00"));
check(`jeudi ${thursday} à 22h → « Offices de la semaine »`, jeudi.first.includes("Offices de la semaine") && !/HORAIRES CHABBAT/i.test(jeudi.first));
check("jeudi : Chaharit 8h15 du lundi au vendredi, mis en évidence « Aujourd'hui »", /Du lundi au vendredi\s*Aujourd'hui[\s\S]*Chaharit\s*8h15/i.test(jeudi.first));
check("jeudi : petit lien « Horaires de Chabbat »", jeudi.first.includes("Horaires de Chabbat"));

const vendredi = await homeAt(paris(friday, "10:00"));
check(`vendredi ${friday} à 10h → « Horaires Chabbat » en grand`, /HORAIRES (CHABBAT|[A-Z' ]+)/.test(vendredi.first) && !vendredi.first.includes("Offices de la semaine"));
check("vendredi : Allumage, Tania, Chaharit, Fin, Arvit et « Chabbat Chalom »", ["Allumage", "Tania", "Chaharit", "Fin", "Arvit", "Chabbat Chalom"].every((w) => vendredi.first.includes(w)));

const samedi = await homeAt(paris(saturday, "23:00"));
check(`samedi ${saturday} à 23h → « Offices de la semaine »`, samedi.first.includes("Offices de la semaine"));
check("samedi soir : les offices de dimanche sont mis en avant (« Demain »)", /Dimanche\s*Demain[\s\S]*Chaharit\s*9h/i.test(samedi.first));

// La page /horaires, elle, affiche les horaires de Chabbat toute la semaine.
const context = await browser.newContext({ timezoneId: TZ });
await context.clock.setFixedTime(paris(thursday, "22:00"));
const page = await context.newPage();
await page.goto(`${BASE}/horaires`, { waitUntil: "networkidle" });
check("/horaires montre les horaires de Chabbat même un jeudi", /HORAIRES CHABBAT/i.test(await page.locator("main").innerText()));
await context.close();

check("aucune erreur JavaScript", [jeudi, vendredi, samedi].every((r) => r.errors.length === 0));
await browser.close();

console.log(failed === 0 ? "\nTous les tests passent." : `\n${failed} échec(s).`);
process.exit(failed === 0 ? 0 : 1);
