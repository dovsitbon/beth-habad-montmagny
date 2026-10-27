/**
 * Tests de bout en bout de l'espace de gestion, dans Microsoft Edge sans interface,
 * au format téléphone. Nécessite le serveur de développement (npm run dev) et le compte
 * de test (TEST_EDITOR_EMAIL / TEST_EDITOR_PASSWORD dans .env.local).
 *
 * Usage : node scripts/e2e-admin.mjs
 * Toutes les données créées sont préfixées « [E2E] » et supprimées à la fin, y compris
 * le compte éditeur de test (créé au début, supprimé à la fin : il ne reste jamais en base).
 */
import { chromium } from "playwright-core";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const SITE = process.env.NEXT_PUBLIC_SITE_ID;
const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
  global: { headers: { "x-site-id": SITE } },
});

let passed = 0;
let failed = 0;
function check(label, ok, detail = "") {
  if (ok) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

// Compte éditeur de test, le temps des tests uniquement.
const { data: testUser, error: testUserError } = await service.auth.admin.createUser({
  email: process.env.TEST_EDITOR_EMAIL,
  password: process.env.TEST_EDITOR_PASSWORD,
  email_confirm: true,
  user_metadata: { full_name: "Éditeur Test" },
});
if (testUserError && !/already/i.test(testUserError.message)) throw testUserError;
// Membre de l'équipe de ce site (multi-tenant).
{
  const { data: profile } = await service.from("profiles").select("id").eq("email", process.env.TEST_EDITOR_EMAIL).single();
  await service.from("user_sites").upsert({ user_id: profile.id, site_id: SITE, role: "editor" }, { onConflict: "user_id,site_id" });
}

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR", isMobile: true, hasTouch: true });
const page = await context.newPage();
page.setDefaultTimeout(30000);
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));

async function go(path) {
  await page.goto(`${BASE}${path}`);
  await page.locator("h1").first().waitFor();
}
async function publicText(path) {
  const res = await fetch(`${BASE}${path}`);
  return res.text();
}
async function saveAndWait(buttonName, urlPart) {
  await Promise.all([page.waitForURL((u) => u.href.includes(urlPart)), page.getByRole("button", { name: buttonName }).click()]);
}

const today = new Date();
// Date AAAA-MM-JJ à l'heure de Paris (toISOString donnerait la veille entre minuit et 1 h/2 h).
const isoDate = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(d);

// Le test change le téléphone : on remet ensuite le vrai numéro du Beth Habad.
const { data: originalSettings } = await service.from("settings").select("phone").eq("site_id", SITE).single();

try {
  console.log("\nConnexion");
  await page.goto(`${BASE}/auth/dev-login`);
  await page.waitForURL(`${BASE}/admin`);
  await page.locator("h1").waitFor();
  check("le tableau de bord s'affiche après connexion", (await page.locator("h1").textContent())?.includes("Bonjour"));

  console.log("\nToutes les pages de l'admin s'ouvrent");
  for (const path of [
    "/admin/evenements",
    "/admin/evenements?categorie=cteen",
    "/admin/evenements/nouveau",
    "/admin/inscriptions",
    "/admin/messages",
    "/admin/annonces",
    "/admin/annonces/nouvelle",
    "/admin/offices",
    "/admin/ce-chabbat",
    "/admin/horaires-chabbat",
    "/admin/cours",
    "/admin/cours/nouveau",
    "/admin/galerie",
    "/admin/textes",
    "/admin/textes/rabbin",
    "/admin/parametres",
    "/admin/equipe",
    "/admin/corbeille",
  ]) {
    await go(path);
    const loading = await page.getByText("Chargement…").isVisible().catch(() => false);
    check(`${path}`, !loading);
  }

  console.log("\nAnnonce");
  await go("/admin/annonces/nouvelle");
  await page.getByLabel("Texte de l'annonce").fill("[E2E] Annonce de test");
  await saveAndWait("Enregistrer", "/admin/annonces?message=");
  check("l'annonce apparaît en bandeau sur le site", (await publicText("/")).includes("[E2E] Annonce de test"));
  await Promise.all([
    page.waitForURL(/message=enregistre/),
    page.locator("li", { hasText: "[E2E] Annonce de test" }).getByRole("button", { name: "Masquer" }).click(),
  ]);
  check("masquée, elle disparaît du site", !(await publicText("/")).includes("[E2E] Annonce de test"));

  console.log("\nCours, corbeille et restauration");
  await go("/admin/cours/nouveau");
  await page.getByLabel("Titre").fill("[E2E] Cours de test");
  await page.getByLabel("Jour").selectOption("3");
  await page.getByLabel("Début").fill("19:00");
  await saveAndWait("Publier", "/admin/cours?message=publie");
  check("le cours publié apparaît sur /cours", (await publicText("/cours")).includes("[E2E] Cours de test"));
  page.once("dialog", (d) => d.accept());
  await page.locator("li", { hasText: "[E2E] Cours de test" }).getByRole("button", { name: "Supprimer" }).click();
  await page.waitForURL(/message=corbeille/);
  check("mis à la corbeille, il disparaît du site", !(await publicText("/cours")).includes("[E2E] Cours de test"));
  await go("/admin/corbeille");
  await page.locator("li", { hasText: "[E2E] Cours de test" }).getByRole("button", { name: "Restaurer" }).click();
  await page.waitForURL(/message=restaure/);
  check("restauré depuis la corbeille, il revient sur le site", (await publicText("/cours")).includes("[E2E] Cours de test"));

  console.log("\nHoraires des offices");
  await go("/admin/offices");
  const addForm = page.locator("section", { hasText: "Ajouter un horaire" });
  await addForm.getByLabel("Office").selectOption("arvit");
  await addForm.getByLabel("Quand").selectOption("dimanche");
  await addForm.getByLabel("Précision").fill("[E2E] note");
  await addForm.getByLabel("Heure").fill("21:15");
  await saveAndWait("Ajouter", "/admin/offices?message=");
  check("le nouvel horaire apparaît sur /offices", (await publicText("/offices")).includes("[E2E] note"));

  console.log("\nCe Chabbat (horaires de la semaine, message WhatsApp)");
  await go("/admin/ce-chabbat");
  const before = await page.locator("pre").textContent();
  check("le message commence par « HORAIRES »", before?.startsWith("HORAIRES "));
  check("le message se termine par la formule finale", /Chabbat Chalom|Hag Saméa'h|Chana Tova|Gmar/.test(before ?? ""));
  await page.getByLabel("Kidouch").fill("[E2E] Grand Kidouch 🍷 offert par la famille Test");
  await page.getByLabel("Chaharit").first().fill("09:40");
  await page.getByRole("button", { name: "Ajouter une ligne" }).click();
  await page.getByLabel("Texte").fill("[E2E] Cours spécial");
  await page.getByLabel("Heure").fill("16:00");
  await saveAndWait("Enregistrer les horaires", "message=enregistre");
  const after = await page.locator("pre").textContent();
  check("le Kidouch apparaît dans le message WhatsApp", after?.includes("[E2E] Grand Kidouch 🍷 offert par la famille Test"));
  check("l'heure modifiée apparaît dans le message (Chaharit: 9h40)", after?.includes("Chaharit: 9h40"));
  check("la ligne ajoutée apparaît dans le message", after?.includes("[E2E] Cours spécial: 16h"));
  const share = await page.getByRole("link", { name: "Partager sur WhatsApp" }).getAttribute("href");
  check("« Partager sur WhatsApp » ouvre wa.me avec le message", share?.startsWith("https://wa.me/?text=HORAIRES"));
  // L'accueil n'affiche les horaires de Chabbat que du vendredi au samedi soir : on vérifie sur /horaires.
  const horaires = await publicText("/horaires");
  check("le Kidouch apparaît dans « Ce Chabbat » sur /horaires", horaires.includes("[E2E] Grand Kidouch"));
  page.once("dialog", (d) => d.accept());
  await Promise.all([page.waitForURL(/message=recalcule/), page.getByRole("button", { name: "Revenir au calcul automatique" }).click()]);
  check("« Revenir au calcul » efface les changements", !(await page.locator("pre").textContent())?.includes("[E2E]"));

  console.log("\nÉvénement avec photo");
  await go("/admin/evenements/nouveau");
  await page.getByLabel("Titre").fill("[E2E] Événement de test");
  await page.getByLabel("Date", { exact: true }).fill(isoDate(new Date(today.getTime() + 20 * 86400000)));
  await page.getByLabel("Début").fill("20:00");
  const jpeg = await makeJpeg(page);
  await page.locator('input[type=file]').setInputFiles({ name: "photo.jpg", mimeType: "image/jpeg", buffer: jpeg });
  await page.getByAltText("Aperçu de la photo").waitFor({ timeout: 60000 });
  check("la photo est compressée et envoyée", true);
  await saveAndWait("Publier", "/admin/evenements?message=publie");
  const { data: ev } = await service.from("events").select("slug, image_path").like("title", "[E2E]%").single();
  check("la photo est enregistrée au format WebP", ev?.image_path?.endsWith(".webp"), ev?.image_path ?? "aucune");
  const evHtml = await publicText(`/evenements/${ev.slug}`);
  check("la page publique de l'événement affiche la photo", evHtml.includes(encodeURIComponent(ev.image_path)) || evHtml.includes(ev.image_path));

  console.log("\nGalerie");
  await go("/admin/galerie");
  // :visible : React garde une copie cachée du contenu pendant le chargement progressif.
  await page.locator("summary:visible", { hasText: "Créer un nouvel album" }).click();
  await page.getByLabel("Titre de l'album").fill("[E2E] Album de test");
  await Promise.all([page.waitForURL(/\/admin\/galerie\/.+message=cree/), page.getByRole("button", { name: /Créer l'album/ }).click()]);
  await page.locator('input[type=file][multiple]').setInputFiles([
    { name: "a.jpg", mimeType: "image/jpeg", buffer: jpeg },
    { name: "b.jpg", mimeType: "image/jpeg", buffer: jpeg },
  ]);
  await page.getByText(/2 photos ajoutées/).waitFor({ timeout: 90000 });
  check("2 photos ajoutées d'un coup", true);
  await page.getByRole("heading", { name: "2 photos" }).waitFor();
  check("la liste des photos se met à jour", true);
  await saveAndWait("Publier l'album", "message=");
  await page.getByText("Album enregistré et visible sur le site.").waitFor();
  check("l'album publié apparaît sur /galerie", (await publicText("/galerie")).includes("[E2E] Album de test"));

  console.log("\nParamètres");
  await go("/admin/parametres");
  check("un éditeur ne voit pas les paramètres techniques", !(await page.getByText("Paramètres techniques").isVisible()));
  await page.getByLabel(/^Téléphone/).fill("01 23 45 67 89");
  await page.getByRole("button", { name: "Enregistrer les paramètres" }).click();
  await page.getByText("Paramètres enregistrés").waitFor();
  check("le téléphone apparaît dans le pied de page du site", (await publicText("/contact")).includes("01 23 45 67 89"));

  console.log("\nTexte d'une page");
  await go("/admin/textes/cours");
  await page.locator('[role=textbox][aria-multiline=true]').click();
  await page.keyboard.press("Control+End");
  await page.keyboard.type(" [E2E] texte ajouté");
  await saveAndWait("Publier", "/admin/textes?message=publie");
  check("le texte modifié apparaît sur /cours", (await publicText("/cours")).includes("[E2E] texte ajouté"));

  console.log("\nInscriptions");
  await go("/admin/inscriptions");
  // Les événements d'exemple peuvent avoir été mis à la corbeille avant l'ouverture : liste ou message vide.
  check(
    "la page des inscriptions s'affiche (liste ou « aucun événement »)",
    (await page.getByText("[EXEMPLE] Repas de Chabbat").isVisible()) || (await page.getByText("Aucun événement avec inscription").isVisible()),
  );
  const { data: repas } = await service.from("events").select("id").eq("slug", "exemple-repas-de-chabbat").single();
  const csv = await page.request.get(`${BASE}/admin/inscriptions/${repas.id}/export`);
  check("l'export CSV se télécharge", csv.ok() && (await csv.text()).includes('"Nom";"Nombre de personnes"'));
  const anonCsv = await fetch(`${BASE}/admin/inscriptions/${repas.id}/export`);
  check("l'export CSV est refusé sans connexion", anonCsv.status === 401);

  console.log("\nÉquipe");
  await go("/admin/equipe");
  await page.getByLabel("Prénom et nom").fill("[E2E] Invité");
  await page.getByLabel("Adresse e-mail").fill("e2e-invite@example.com");
  await saveAndWait("Ajouter à l'équipe", "message=invite");
  check("la personne invitée apparaît dans l'équipe", await page.getByText("e2e-invite@example.com").isVisible());

  console.log("\nSécurité");
  const anon = await fetch(`${BASE}/admin/evenements`, { redirect: "manual" });
  check("l'admin est inaccessible sans connexion", [200, 307].includes(anon.status) && !(await anon.text()).includes("[E2E] Événement de test"));

  check("aucune erreur JavaScript dans les pages", pageErrors.length === 0, pageErrors.slice(0, 3).join(" | "));
} catch (err) {
  failed++;
  console.error("\nErreur inattendue :", err.message);
  await page.screenshot({ path: "e2e-erreur.png", fullPage: true }).catch(() => {});
  console.error("Capture d'écran : e2e-erreur.png — page :", page.url());
} finally {
  await browser.close();
  await cleanup();
  console.log(`\n${passed} vérification(s) réussie(s), ${failed} échec(s).`);
  process.exitCode = failed ? 1 : 0;
}

/** Fabrique une vraie photo JPEG (3000 × 2000) dans le navigateur. */
async function makeJpeg(p) {
  const b64 = await p.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = 3000;
    c.height = 2000;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 3000, 2000);
    grad.addColorStop(0, "#0F2444");
    grad.addColorStop(1, "#C9A227");
    g.fillStyle = grad;
    g.fillRect(0, 0, 3000, 2000);
    g.fillStyle = "#fff";
    g.font = "220px Georgia";
    g.fillText("PHOTO E2E", 700, 1050);
    const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.95));
    const buf = new Uint8Array(await blob.arrayBuffer());
    let s = "";
    for (const byte of buf) s += String.fromCharCode(byte);
    return btoa(s);
  });
  return Buffer.from(b64, "base64");
}

async function cleanup() {
  const files = [];
  const { data: evs } = await service.from("events").select("id, image_path").like("title", "[E2E]%");
  for (const e of evs ?? []) if (e.image_path) files.push(e.image_path);
  await service.from("events").delete().like("title", "[E2E]%");

  const { data: albums } = await service.from("albums").select("id").like("title", "[E2E]%");
  for (const a of albums ?? []) {
    const { data: photos } = await service.from("photos").select("storage_path").eq("album_id", a.id);
    for (const p of photos ?? []) files.push(p.storage_path);
  }
  await service.from("albums").delete().like("title", "[E2E]%");
  if (files.length) await service.storage.from("media").remove(files);

  await service.from("courses").delete().like("title", "[E2E]%");
  await service.from("announcements").delete().like("message", "[E2E]%");
  await service.from("service_times").delete().like("note", "[E2E]%");
  await service.from("schedule_weeks").delete().like("kidouch", "[E2E]%");
  await service.from("settings").update({ phone: originalSettings?.phone ?? null }).eq("site_id", SITE);

  const { data: page } = await service.from("pages").select("body").eq("slug", "cours").single();
  if (page?.body.includes("[E2E]")) {
    await service.from("pages").update({ body: page.body.replace(/ ?\[E2E\] texte ajouté/g, "") }).eq("slug", "cours");
  }
  for (const email of ["e2e-invite@example.com", process.env.TEST_EDITOR_EMAIL]) {
    const { data: user } = await service.from("profiles").select("id").eq("email", email).maybeSingle();
    if (user) await service.auth.admin.deleteUser(user.id);
  }
  void testUser;
  console.log(`\nNettoyage terminé (${files.length} fichier(s) supprimé(s) du stockage).`);
}
