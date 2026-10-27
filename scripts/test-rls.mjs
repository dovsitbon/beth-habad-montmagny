/**
 * Vérifie les règles de sécurité (RLS) sur le projet Supabase configuré dans .env.local.
 *
 * Usage : npm run test:rls
 *
 * Crée temporairement un compte « éditeur » de test et des événements de test,
 * puis supprime tout à la fin (même en cas d'échec).
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

process.loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;
const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

const anon = createClient(url, publishable, noSession);
const service = createClient(url, secret, noSession);

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

const tag = `rls-test-${randomUUID().slice(0, 8)}`;
const email = `${tag}@example.com`;
const password = `${randomUUID()}Aa1!`;
let editorId;

async function main() {
  // --- Préparation -----------------------------------------------------------
  const { data: created, error: createErr } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr) throw createErr;
  editorId = created.user.id;

  const { data: events, error: evErr } = await service
    .from("events")
    .insert([
      { slug: `${tag}-pub`, title: `${tag} publié`, starts_at: future(3), status: "published" },
      { slug: `${tag}-draft`, title: `${tag} brouillon`, starts_at: future(3), status: "draft" },
      {
        slug: `${tag}-full`,
        title: `${tag} complet`,
        starts_at: future(3),
        status: "published",
        registration_enabled: true,
        capacity: 2,
      },
    ], { defaultToNull: false })
    .select("id, slug");
  if (evErr) throw evErr;
  const id = Object.fromEntries(events.map((e) => [e.slug.replace(`${tag}-`, ""), e.id]));

  // --- Visiteur anonyme ------------------------------------------------------
  console.log("\nVisiteur anonyme");
  {
    const { data } = await anon.from("events").select("slug").like("slug", `${tag}%`);
    const slugs = (data ?? []).map((e) => e.slug);
    check("voit les événements publiés", slugs.includes(`${tag}-pub`));
    check("ne voit pas les brouillons", !slugs.includes(`${tag}-draft`));

    const ins = await anon.from("events").insert({ slug: `${tag}-x`, title: "x", starts_at: future(1) });
    check("ne peut pas créer d'événement", !!ins.error);

    const upd = await anon.from("events").update({ title: "piraté" }).eq("id", id.pub).select();
    check("ne peut pas modifier un événement", !!upd.error || upd.data.length === 0);

    const reg = await anon.from("registrations").select("id").limit(1);
    check("ne peut pas lire les inscriptions", !!reg.error || reg.data.length === 0);

    const regIns = await anon.from("registrations").insert({ event_id: id.pub, name: "x", email: "x@x.fr" });
    check("ne peut pas s'inscrire directement (passe par le serveur)", !!regIns.error);

    const rpc = await anon.rpc("register_for_event", {
      p_event_id: id.full, p_name: "x", p_phone: null, p_email: "x@x.fr", p_party_size: 1,
    });
    check("ne peut pas appeler register_for_event", !!rpc.error);

    const msg = await anon.from("contact_messages").select("id").limit(1);
    check("ne peut pas lire les messages", !!msg.error || msg.data.length === 0);

    const priv = await anon.from("settings_private").select("*");
    check("ne peut pas lire les paramètres privés", !!priv.error || priv.data.length === 0);

    const prof = await anon.from("profiles").select("*");
    check("ne peut pas lire les profils", !!prof.error || prof.data.length === 0);

    const rl = await anon.rpc("check_rate_limit", { p_key: "x", p_max: 1, p_window: "1 minute" });
    check("ne peut pas appeler check_rate_limit", !!rl.error);

    const purge = await anon.rpc("purge_expired");
    check("ne peut pas lancer la purge", !!purge.error);

    const seats = await anon.rpc("event_seats_taken", { p_event_id: id.full });
    check("peut connaître le nombre de places prises", !seats.error && seats.data === 0);

    const settings = await anon.from("settings").select("name").single();
    check("peut lire les paramètres publics", !settings.error && !!settings.data?.name);

    const upload = await anon.storage.from("media").upload(`${tag}.txt`, new Blob(["x"]), { contentType: "image/png" });
    check("ne peut pas envoyer de fichier", !!upload.error);

    const signup = await anon.auth.signUp({ email: `${tag}-intrus@example.com`, password });
    check("ne peut pas se créer de compte (invitation uniquement)", !!signup.error);
  }

  // --- Éditeur ---------------------------------------------------------------
  console.log("\nÉditeur (rabbin)");
  const editor = createClient(url, publishable, noSession);
  const { error: signErr } = await editor.auth.signInWithPassword({ email, password });
  if (signErr) throw signErr;
  {
    const { data: profile } = await editor.from("profiles").select("role").eq("id", editorId).single();
    check("a le rôle éditeur par défaut", profile?.role === "editor");

    const { data } = await editor.from("events").select("slug").like("slug", `${tag}%`);
    check("voit aussi les brouillons", (data ?? []).some((e) => e.slug === `${tag}-draft`));

    const role = await editor.from("profiles").update({ role: "admin" }).eq("id", editorId);
    check("ne peut pas se promouvoir admin", !!role.error);

    const name = await editor.from("profiles").update({ full_name: "Test" }).eq("id", editorId);
    check("peut modifier son propre nom", !name.error);

    const { data: before } = await service.from("settings").select("phone, color_primary").single();
    const phone = await editor.from("settings").update({ phone: before.phone }).eq("id", 1);
    check("peut modifier le téléphone", !phone.error);
    const color = await editor.from("settings").update({ color_primary: "#FF0000" }).eq("id", 1);
    check("ne peut pas modifier les couleurs (réservé à l'admin)", !!color.error);

    const ev = await editor
      .from("events")
      .insert({ slug: `${tag}-ed`, title: `${tag} éditeur`, starts_at: future(2), status: "published" })
      .select("id")
      .single();
    check("peut créer un événement", !ev.error);

    if (ev.data) {
      const trash = await editor.from("events").update({ deleted_at: new Date().toISOString() }).eq("id", ev.data.id);
      check("peut mettre un événement à la corbeille", !trash.error);
      const { data: seen } = await anon.from("events").select("id").eq("id", ev.data.id);
      check("l'événement à la corbeille disparaît du site public", (seen ?? []).length === 0);
      const restore = await editor.from("events").update({ deleted_at: null }).eq("id", ev.data.id);
      check("peut le restaurer depuis la corbeille", !restore.error);
      const hard = await editor.from("events").delete().eq("id", ev.data.id).select();
      check("ne peut pas supprimer définitivement", !!hard.error || hard.data.length === 0);
    }

    const regs = await editor.from("registrations").select("id").limit(1);
    check("peut lire les inscriptions", !regs.error);

    const priv = await editor.from("settings_private").select("notification_email");
    check("peut lire les paramètres privés", !priv.error && priv.data.length === 1);
  }

  // --- Serveur (service_role) ------------------------------------------------
  console.log("\nServeur");
  {
    const reg = (n) =>
      service.rpc("register_for_event", {
        p_event_id: id.full, p_name: "Test", p_phone: null, p_email: "test@example.com", p_party_size: n,
      });
    const r1 = await reg(2);
    check("inscription acceptée dans la limite des places", !r1.error);
    const r2 = await reg(1);
    check("inscription refusée quand c'est complet", r2.error?.message?.includes("EVENT_FULL"));
    const r3 = await service.rpc("register_for_event", {
      p_event_id: id.draft, p_name: "Test", p_phone: null, p_email: "t@example.com", p_party_size: 1,
    });
    check("inscription refusée sur un brouillon", r3.error?.message?.includes("EVENT_NOT_FOUND"));

    const key = `${tag}:rate`;
    const a = await service.rpc("check_rate_limit", { p_key: key, p_max: 2, p_window: "1 minute" });
    const b = await service.rpc("check_rate_limit", { p_key: key, p_max: 2, p_window: "1 minute" });
    const c = await service.rpc("check_rate_limit", { p_key: key, p_max: 2, p_window: "1 minute" });
    check("limitation de débit : 2 envois acceptés puis refus", a.data === true && b.data === true && c.data === false);
    await service.from("rate_limits").delete().eq("key", key);
  }
}

function future(days) {
  return new Date(Date.now() + days * 86400000).toISOString();
}

async function cleanup() {
  await service.from("events").delete().like("slug", `${tag}%`);
  if (editorId) await service.auth.admin.deleteUser(editorId);
}

try {
  await main();
} catch (err) {
  failed++;
  console.error("\nErreur inattendue :", err);
} finally {
  await cleanup();
  console.log(`\n${passed} vérification(s) réussie(s), ${failed} échec(s).`);
  process.exitCode = failed ? 1 : 0;
}
