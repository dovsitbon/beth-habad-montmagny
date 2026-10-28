/**
 * Bascule de l'accueil dans un vrai navigateur (Edge) : npm run test:accueil
 *   E2E_BASE_URL=https://… npm run test:accueil   (pour tester le site en ligne)
 *
 * L'horloge du navigateur est avancée au jeudi, vendredi et samedi qui viennent (heure de Paris) :
 * la page, servie depuis le cache, doit basculer seule entre la carte « Aujourd'hui » et
 * « Horaires Chabbat », sans nouveau déploiement. Le bandeau du haut (masqué sur l'accueil,
 * où la carte le remplace) est vérifié sur la page Contact.
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
  // Bloc principal : la carte « Aujourd'hui » ou les horaires de Chabbat en grand (après la bannière photo).
  const first = await page.locator('main section[aria-labelledby="aujourdhui"], main section[aria-labelledby^="horaires-"]').first().innerText();
  const homeBanner = await page.locator('section[aria-label="Offices du jour"], section[aria-label="Horaires de Chabbat"]').isVisible();
  await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const bar = page.locator('section[aria-label="Offices du jour"], section[aria-label="Horaires de Chabbat"]');
  const banner = (await bar.count()) ? { label: await bar.getAttribute("aria-label"), text: (await bar.innerText()).replace(/\s+/g, " ").trim(), href: await bar.locator("a").getAttribute("href") } : null;
  await context.close();
  return { text, first, banner, homeBanner, errors };
}

console.log(`\nAccueil (${BASE}) — semaine du ${thursday} au ${saturday}`);

const jeudi = await homeAt(paris(thursday, "22:00"));
const isToday = (r) => /AUJOURD'HUI/i.test(r.first) && /DEMAIN/i.test(r.first) && !/HORAIRES CHABBAT/i.test(r.first);
check(`jeudi ${thursday} à 22h → carte « Aujourd'hui / Demain »`, isToday(jeudi), jeudi.first);
check("jeudi 22h : « Demain : Chaharit à 8h15 »", /Demain\s*:\s*Chaharit à 8h15/i.test(jeudi.first));
check("jeudi : ligne « Chabbat … Allumage … Fin … » vers /horaires", /Chabbat \S+.*\sAllumage avant \d+h\d*\s*·\s*Fin \d+h\d*/.test(jeudi.first.replace(/\s+/g, " ")));
check("pas de bandeau d'horaires sur l'accueil (la carte le remplace)", jeudi.homeBanner === false);

const jeudiSoir = await homeAt(paris(thursday, "20:00"));
check(`bandeau jeudi ${thursday} à 20h → offices du jour (« Aujourd'hui · Chaharit 8h15 … »)`, jeudiSoir.banner?.label === "Offices du jour" && /^Aujourd'hui · Chaharit 8h15/.test(jeudiSoir.banner.text));

const vendrediMatin = await homeAt(paris(friday, "07:30"));
check(`vendredi ${friday} à 7h30 → encore la carte « Aujourd'hui » (bascule à 8h)`, isToday(vendrediMatin));
check("vendredi 7h30 : prochain office Chaharit à 8h15, dans 45 min", /Prochain office\s*:\s*Chaharit à 8h15\s*dans 45 min/i.test(vendrediMatin.first));

const vendrediBandeau = await homeAt(paris(friday, "09:00"));
check(
  `bandeau vendredi ${friday} à 9h → « Chabbat … · Allumage avant … · Chaharit 9h15 · Fin … », lien vers /horaires`,
  vendrediBandeau.banner?.label === "Horaires de Chabbat" &&
    /^Chabbat .+ · Allumage avant \d+h\d* · Chaharit 9h15 · Fin \d+h\d*$/.test(vendrediBandeau.banner.text) &&
    vendrediBandeau.banner.href === "/horaires",
);

const vendredi = await homeAt(paris(friday, "10:00"));
check(`vendredi ${friday} à 10h → « Horaires Chabbat » en grand`, /HORAIRES (CHABBAT|[A-Z' ]+)/.test(vendredi.first) && !/Prochain office/.test(vendredi.first));
check("vendredi : Allumage, Tania, Chaharit, Fin, Arvit et « Chabbat Chalom »", ["Allumage", "Tania", "Chaharit", "Fin", "Arvit", "Chabbat Chalom"].every((w) => vendredi.first.includes(w)));

const samedi = await homeAt(paris(saturday, "23:00"));
check(`samedi ${saturday} à 23h → carte « Aujourd'hui / Demain »`, isToday(samedi));
check("samedi soir : « Demain : Chaharit à 9h »", /Demain\s*:\s*Chaharit à 9h/i.test(samedi.first));
check(`bandeau samedi ${saturday} à 23h → offices (« Demain · Chaharit 9h »)`, samedi.banner?.label === "Offices du jour" && samedi.banner.text.startsWith("Demain · Chaharit 9h"));

// La page /horaires, elle, affiche les horaires de Chabbat toute la semaine.
const context = await browser.newContext({ timezoneId: TZ });
await context.clock.setFixedTime(paris(thursday, "22:00"));
const page = await context.newPage();
await page.goto(`${BASE}/horaires`, { waitUntil: "networkidle" });
check("/horaires montre les horaires de Chabbat même un jeudi", /HORAIRES CHABBAT/i.test(await page.locator("main").innerText()));
await context.close();

check("aucune erreur JavaScript", [jeudi, jeudiSoir, vendrediMatin, vendrediBandeau, vendredi, samedi].every((r) => r.errors.length === 0));
await browser.close();

console.log(failed === 0 ? "\nTous les tests passent." : `\n${failed} échec(s).`);
process.exit(failed === 0 ? 0 : 1);
