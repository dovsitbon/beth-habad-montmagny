/**
 * Variables d'environnement Supabase (voir .env.example).
 * La clé « publishable » peut être exposée au navigateur : la RLS protège les données.
 *
 * Multi-tenant (docs/multi-tenant.md) : un seul projet Supabase pour tous les sites.
 * Ce site est identifié par NEXT_PUBLIC_SITE_ID, envoyé à chaque requête dans l'en-tête
 * « x-site-id » : la base ne renvoie et n'accepte alors que les données de ce site.
 */
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "Configuration Supabase manquante : renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY dans .env.local",
    );
  }
  return { url, publishableKey };
}

/** Identifiant de ce site dans la table « sites » (NEXT_PUBLIC_SITE_ID). */
export function siteId(): string {
  // Lecture littérale : Next.js remplace la valeur dans le code envoyé au navigateur.
  const id = process.env.NEXT_PUBLIC_SITE_ID;
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error("Configuration manquante : renseignez NEXT_PUBLIC_SITE_ID (identifiant du site) dans .env.local");
  }
  return id;
}

/** En-têtes à joindre à toutes les requêtes Supabase de ce site. */
export function siteHeaders(): Record<string, string> {
  return { "x-site-id": siteId() };
}
