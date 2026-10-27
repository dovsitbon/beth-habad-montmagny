/**
 * Noms des parachiot et des fêtes tels que le rabbin les écrit (translittération française séfarade).
 *
 * Hebcal renvoie sa propre orthographe (« Lech-Lecha » en anglais, « Lekh Lekha » en français,
 * « Vayeh̲i »…) : la clé de correspondance est le nom hébreu renvoyé par Hebcal, identique quelle
 * que soit la langue demandée. Relevé sur les données réelles d'Hebcal (2026-2037).
 */
const PARACHIOT: Record<string, string> = {
  בראשית: "Béréchit",
  נח: "Noa'h",
  "לך־לך": "Lekh Lekha",
  וירא: "Vayéra",
  "חיי שרה": "'Hayé Sarah",
  תולדות: "Toledot",
  ויצא: "Vayétsé",
  וישלח: "Vayichla'h",
  וישב: "Vayéchev",
  מקץ: "Mikets",
  ויגש: "Vayigach",
  ויחי: "Vay'hi",
  שמות: "Chemot",
  וארא: "Vaéra",
  בא: "Bo",
  בשלח: "Béchala'h",
  יתרו: "Yitro",
  משפטים: "Michpatim",
  תרומה: "Terouma",
  תצוה: "Tetsavé",
  "כי תשא": "Ki Tissa",
  ויקהל: "Vayakhel",
  פקודי: "Pekoudé",
  ויקרא: "Vayikra",
  צו: "Tsav",
  שמיני: "Chemini",
  תזריע: "Tazria",
  מצרע: "Metsora",
  "אחרי מות": "A'haré Mot",
  קדשים: "Kedochim",
  אמור: "Emor",
  בהר: "Behar",
  בחקתי: "Be'houkotaï",
  במדבר: "Bamidbar",
  נשא: "Nasso",
  בהעלתך: "Beha'alotekha",
  "שלח־לך": "Chela'h Lekha",
  קורח: "Kora'h",
  חוקת: "'Houkat",
  בלק: "Balak",
  פינחס: "Pin'has",
  מטות: "Matot",
  מסעי: "Massé",
  דברים: "Devarim",
  ואתחנן: "Vaet'hanan",
  עקב: "Ekev",
  ראה: "Réé",
  שופטים: "Choftim",
  "כי־תצא": "Ki Tetsé",
  "כי־תבוא": "Ki Tavo",
  נצבים: "Nitsavim",
  וילך: "Vayélekh",
  האזינו: "Haazinou",
  "וזאת הברכה": "Vezot Haberakha",
};

/**
 * « פרשת לך־לך » → « Lekh Lekha » ; parachiot doubles : « פרשת ויקהל־פקודי » → « Vayakhel-Pekoudé ».
 * Renvoie null si le nom est inconnu (on garde alors le libellé d'Hebcal).
 */
export function parashaFr(hebrew: string | undefined): string | null {
  if (!hebrew) return null;
  const name = hebrew.replace(/^פרשת\s+/, "").trim();
  if (PARACHIOT[name]) return PARACHIOT[name];
  // Parachiot doubles : les deux noms sont reliés par un maqaf (־). Certaines parachiot
  // simples en contiennent aussi (לך־לך, כי־תצא…), d'où l'essai sur chaque coupure possible.
  const parts = name.split("־");
  for (let i = 1; i < parts.length; i++) {
    const a = PARACHIOT[parts.slice(0, i).join("־")];
    const b = PARACHIOT[parts.slice(i).join("־")];
    if (a && b) return `${a}-${b}`;
  }
  return null;
}

/** Fêtes (jours de Yom tov) : libellé Hebcal → nom du rabbin. */
const FETES: [RegExp, string][] = [
  [/^Roch Hachanah?/i, "Roch Hachana"],
  [/^Yom Kippour/i, "Kippour"],
  [/^Soukkot|^Souccot/i, "Souccot"],
  [/^Chemini Atz/i, "Chemini Atseret"],
  [/^Sim.?h?at Torah/i, "Sim'hat Torah"],
  [/^Pessa.?h/i, "Pessa'h"],
  [/^Chavouot/i, "Chavouot"],
];

/** « Roch Hachanah 5787 », « Soukkot II » → « Roch Hachana », « Souccot ». */
export function feteFr(hebcalTitle: string): string {
  const title = hebcalTitle.normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  for (const [pattern, name] of FETES) if (pattern.test(title)) return name;
  // Inconnue : on retire le numéro de jour (I, II…) et l'année.
  return hebcalTitle.replace(/̲/g, "").replace(/\s+(\d{4}|[IVX]+)$/, "").trim();
}

/** Formule finale du message selon l'occasion. */
export function closingFor(fetes: string[], includesShabbat: boolean): string {
  if (fetes.length === 0) return "Chabbat Chalom";
  const wish = fetes.includes("Kippour")
    ? "Gmar 'Hatima Tova"
    : fetes.includes("Roch Hachana")
      ? "Chana Tova"
      : "'Hag Saméa'h";
  return includesShabbat && !fetes.includes("Kippour") ? `Chabbat Chalom et ${wish}` : wish;
}
