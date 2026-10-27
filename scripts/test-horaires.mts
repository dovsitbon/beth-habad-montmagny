/**
 * Test des horaires au format du rabbin : npm run test:horaires
 *
 * Référence : le message WhatsApp du Chabbat Lekh Lekha (23-24/10/2026) envoyé par le rabbin.
 * Les noms (parachiot, fêtes) viennent d'Hebcal ; les heures sont calculées sur place.
 */
import {
  buildOccasions,
  homeOccasionKey,
  toWhatsApp,
  type HebcalItem,
  type Occasion,
  type ScheduleRules,
  type WeekAdjustments,
} from "../src/lib/horaires/calcul.ts";
import { parashaFr } from "../src/lib/horaires/noms.ts";
import { bandeauAt, toHomeWindow, type OfficeRow } from "../src/lib/horaires/bandeau.ts";

const place = { latitude: 48.976809, longitude: 2.346422 };
const timeZone = "Europe/Paris";
const rules: ScheduleRules = {
  candleMinutes: 17,
  havdalahMinutes: null,
  endMarginMinutes: 1,
  fridayMinhaOffset: 2,
  fridayMinhaRounding: 5,
  taniaTime: "08:30",
  chaharitTime: "09:15",
  coursTime: "17:00",
  coursBeforeEnd: null,
  minhaTime: "18:00",
  minhaBeforeEnd: null,
  arvitAfterEnd: 10,
};

let failures = 0;
function check(label: string, ok: boolean, detail?: string) {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${!ok && detail ? `\n${detail}` : ""}`);
  if (!ok) failures++;
}

async function hebcal(start: string, end: string): Promise<HebcalItem[]> {
  const q = new URLSearchParams({ v: "1", cfg: "json", maj: "on", min: "on", s: "on", lg: "fr", start, end });
  const res = await fetch(`https://www.hebcal.com/hebcal?${q}`);
  return ((await res.json()) as { items: HebcalItem[] }).items;
}

const week = (date: string, patch: Partial<WeekAdjustments> = {}): WeekAdjustments => ({
  date,
  title: null,
  kidouch: null,
  note: null,
  closing: null,
  times: {},
  hidden: [],
  extra_lines: [],
  ...patch,
});

function occasionOf(items: HebcalItem[], key: string, weeks: WeekAdjustments[] = [], r = rules): Occasion {
  const all = buildOccasions({ items, rules: r, weeks, place, timeZone, from: addDays(key, -1), to: addDays(key, 3) });
  const found = all.find((o) => o.key === key);
  if (!found) throw new Error(`Aucune occasion dont la veille est le ${key}`);
  return found;
}

function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const lineOf = (o: Occasion, id: string) => o.sections.flatMap((s) => s.lines).find((l) => l.id === id);

// ---------------------------------------------------------------------------
console.log("\nChabbat Lekh Lekha (23-24/10/2026) : le message du rabbin");
const octobre = await hebcal("2026-10-20", "2026-10-26");
const kidouch =
  "Grand Kidouch 🍷 offert par la famille Chekli à l'occasion de la bar-mitsva de leur fils Jonas Gabriel Nathan.";
const lekhLekha = occasionOf(octobre, "2026-10-23", [week("2026-10-23", { kidouch })]);

const attendu = `HORAIRES CHABBAT LEKH LEKHA

Vendredi 23/10/26

Allumage 🕯: avant 18h28
Minha suivi d'Arvit: 18h30

Chabbat matin

Tania: 8h30
Chaharit: 9h15
${kidouch}

Cours: 17h
Minha: 18h
Fin: 19h33
Arvit: 19h43

Chabbat Chalom`;

const message = toWhatsApp(lekhLekha);
check("le message est identique, au caractère près", message === attendu, `--- obtenu ---\n${message}\n--- attendu ---\n${attendu}`);
check("allumage 18h28", lineOf(lekhLekha, "2026-10-23:allumage")?.minutes === 18 * 60 + 28);
check("Minha suivi d'Arvit 18h30", lineOf(lekhLekha, "2026-10-23:minha-arvit")?.minutes === 18 * 60 + 30);
check("Fin 19h33", lineOf(lekhLekha, "2026-10-24:fin")?.minutes === 19 * 60 + 33);
check("Arvit 19h43", lineOf(lekhLekha, "2026-10-24:arvit")?.minutes === 19 * 60 + 43);
check("sans Kidouch, la ligne n'apparaît pas", !toWhatsApp(occasionOf(octobre, "2026-10-23")).includes("Kidouch"));

// ---------------------------------------------------------------------------
console.log("\nAjustements de la semaine");
const ajuste = occasionOf(octobre, "2026-10-23", [
  week("2026-10-23", {
    times: { "2026-10-24:fin": "19:40" },
    hidden: ["2026-10-24:cours"],
    extra_lines: [{ section: "2026-10-24:matin", label: "Office des jeunes", time: "07:45" }],
    note: "Pas de cours cette semaine.",
  }),
]);
const texte = toWhatsApp(ajuste);
check("une heure modifiée est prise en compte (Fin 19h40)", texte.includes("Fin: 19h40"));
check("Arvit suit la Fin modifiée (19h50)", texte.includes("Arvit: 19h50"));
check("une ligne retirée disparaît (Cours)", !texte.includes("Cours:"));
check("une ligne ajoutée se range à son heure (avant Tania)", texte.includes("Office des jeunes: 7h45\nTania: 8h30"));
check("la note apparaît avant « Chabbat Chalom »", texte.endsWith("Pas de cours cette semaine.\n\nChabbat Chalom"));

const relatif = occasionOf(octobre, "2026-10-23", [], { ...rules, minhaBeforeEnd: 30 });
check("Minha « 30 min avant la Fin » : 19h33 − 30 → 19h (arrondi aux 5 min)", toWhatsApp(relatif).includes("Minha: 19h\n"));

// ---------------------------------------------------------------------------
console.log("\nFêtes");
const tichri = await hebcal("2026-09-08", "2026-10-06");
const rh = occasionOf(tichri, "2026-09-11");
const rhTexte = toWhatsApp(rh);
check("titre « HORAIRES ROCH HACHANA »", rhTexte.startsWith("HORAIRES ROCH HACHANA\n"));
check("deuxième soir : « Allumage 🕯: après … »", /Allumage 🕯: après \d+h\d*/.test(rhTexte));
check("une seule « Fin », le dernier jour", (rhTexte.match(/^Fin:/gm) ?? []).length === 1 && lineOf(rh, "2026-09-13:fin") !== undefined);
check("formule « Chabbat Chalom et Chana Tova » (1er jour un samedi)", rhTexte.endsWith("Chabbat Chalom et Chana Tova"));

const kippour = occasionOf(tichri, "2026-09-20");
const kTexte = toWhatsApp(kippour);
check("titre « HORAIRES KIPPOUR »", kTexte.startsWith("HORAIRES KIPPOUR\n"));
check("veille : « Kol Nidré »", kTexte.includes("Kol Nidré:"));
check("formule « Gmar 'Hatima Tova »", kTexte.endsWith("Gmar 'Hatima Tova"));

const souccot = occasionOf(tichri, "2026-09-25");
check("titre « HORAIRES SOUCCOT »", toWhatsApp(souccot).startsWith("HORAIRES SOUCCOT\n"));
const atseret = occasionOf(tichri, "2026-10-02");
check("titre « HORAIRES CHEMINI ATSERET ET SIM'HAT TORAH »", toWhatsApp(atseret).startsWith("HORAIRES CHEMINI ATSERET ET SIM'HAT TORAH\n"));

console.log("\nAccueil : Chabbat ou offices de la semaine selon l'heure de Paris");
const windows = [occasionOf(octobre, "2026-10-23"), kippour];
const mode = (parisIso: string) => homeOccasionKey(windows, Date.parse(parisIso)) ?? "Offices de la semaine";
check("jeudi 22/10 à 22h → « Offices de la semaine »", mode("2026-10-22T22:00:00+02:00") === "Offices de la semaine");
check("vendredi 23/10 à 7h59 → encore « Offices de la semaine »", mode("2026-10-23T07:59:00+02:00") === "Offices de la semaine");
check("vendredi 23/10 à 8h → « Horaires Chabbat »", mode("2026-10-23T08:00:00+02:00") === "2026-10-23");
check("vendredi 23/10 à 10h → « Horaires Chabbat »", mode("2026-10-23T10:00:00+02:00") === "2026-10-23");
check("samedi 24/10 à 20h10 (Arvit 19h43 + 27 min) → toujours Chabbat", mode("2026-10-24T20:10:00+02:00") === "2026-10-23");
check("samedi 24/10 à 20h13 (Arvit + 30 min) → « Offices de la semaine »", mode("2026-10-24T20:13:00+02:00") === "Offices de la semaine");
check("samedi 24/10 à 23h → « Offices de la semaine »", mode("2026-10-24T23:00:00+02:00") === "Offices de la semaine");
check("fête en semaine : dimanche 20/09 (veille de Kippour) à 10h → Kippour", mode("2026-09-20T10:00:00+02:00") === "2026-09-20");
check("lundi 21/09 à 23h, après Kippour → « Offices de la semaine »", mode("2026-09-21T23:00:00+02:00") === "Offices de la semaine");

console.log("\nBandeau du haut");
const offices: OfficeRow[] = [
  { office: "chaharit", day_type: "semaine", time: "08:15:00" },
  { office: "minha", day_type: "semaine", time: "18:30:00" },
  { office: "arvit", day_type: "semaine", time: "18:45:00" },
  { office: "chaharit", day_type: "dimanche", time: "09:00:00" },
];
const bandeauWindows = [toHomeWindow(occasionOf(octobre, "2026-10-23"))];
const bandeau = (parisIso: string) => {
  const b = bandeauAt(bandeauWindows, offices, Date.parse(parisIso), timeZone);
  return b ? (b.kind === "chabbat" ? b.parts : [b.day, ...b.parts]).join(" · ") : "";
};
check("jeudi 22/10 à 20h → offices du jour", bandeau("2026-10-22T20:00:00+02:00") === "Aujourd'hui · Chaharit 8h15 · Minha 18h30 · Arvit 18h45");
check("vendredi 23/10 à 7h59 → encore les offices du jour", bandeau("2026-10-23T07:59:00+02:00").startsWith("Aujourd'hui · Chaharit 8h15"));
check(
  "vendredi 23/10 à 9h → « Chabbat Lekh Lekha · Allumage avant 18h28 · Chaharit 9h15 · Fin 19h33 »",
  bandeau("2026-10-23T09:00:00+02:00") === "Chabbat Lekh Lekha · Allumage avant 18h28 · Chaharit 9h15 · Fin 19h33",
);
check("samedi 24/10 à 20h → toujours Chabbat (Arvit 19h43 + 30 min)", bandeau("2026-10-24T20:00:00+02:00").startsWith("Chabbat Lekh Lekha"));
check("samedi 24/10 à 23h → offices du jour (ceux de demain dimanche)", bandeau("2026-10-24T23:00:00+02:00") === "Demain · Chaharit 9h");
check("dimanche 25/10 à 10h → Chaharit 9h", bandeau("2026-10-25T10:00:00+01:00") === "Aujourd'hui · Chaharit 9h");

// ---------------------------------------------------------------------------
console.log("\nParachiot");
const unknown = new Set<string>();
for (const [start, end] of [["2026-01-01", "2029-12-31"], ["2030-01-01", "2033-12-31"], ["2034-01-01", "2037-12-31"]]) {
  for (const i of await hebcal(start, end)) if (i.category === "parashat" && !parashaFr(i.hebrew)) unknown.add(i.hebrew ?? i.title);
}
check("toutes les parachiot d'Hebcal (2026-2037) ont leur nom français", unknown.size === 0, [...unknown].join(", "));
check("parachiot doubles : « Vayakhel-Pekoudé »", parashaFr("פרשת ויקהל־פקודי") === "Vayakhel-Pekoudé");
check("Lekh Lekha (maqaf dans le nom)", parashaFr("פרשת לך־לך") === "Lekh Lekha");

console.log(failures === 0 ? "\nTous les tests passent." : `\n${failures} échec(s).`);
process.exit(failures === 0 ? 0 : 1);
