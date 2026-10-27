"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/browser";

/**
 * Arrivée depuis le lien de connexion reçu par e-mail. Gère les trois formats possibles :
 *  - ?token_hash=…&type=email  (modèle d'e-mail personnalisé)
 *  - ?code=…                   (même navigateur que la demande)
 *  - #access_token=…           (lien magique par défaut de Supabase, flux implicite)
 */
export default function ConfirmPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const next = search.get("next")?.startsWith("/admin") ? search.get("next")! : "/admin";

    async function confirm() {
      let ok = false;
      if (search.get("token_hash")) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: search.get("token_hash")!, type: "email" });
        ok = !error;
      } else if (search.get("code")) {
        const { error } = await supabase.auth.exchangeCodeForSession(search.get("code")!);
        ok = !error;
      } else if (hash.get("access_token") && hash.get("refresh_token")) {
        const { error } = await supabase.auth.setSession({
          access_token: hash.get("access_token")!,
          refresh_token: hash.get("refresh_token")!,
        });
        ok = !error;
      }
      if (ok) {
        // Retire les jetons de l'adresse avant de quitter la page.
        window.history.replaceState(null, "", "/auth/confirm");
        router.replace(next);
        router.refresh();
      } else {
        setFailed(true);
      }
    }
    confirm();
  }, [router]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      {failed ? (
        <div role="alert">
          <h1 className="text-3xl text-night">Ce lien ne fonctionne plus</h1>
          <p className="mt-3 text-ink-muted">
            Il a peut-être déjà été utilisé ou il a expiré (il est valable 1 heure). Demandez simplement un nouveau lien.
          </p>
          <Link
            href="/admin/connexion"
            className="mt-6 inline-flex h-12 items-center rounded-md bg-night px-6 font-bold text-white hover:bg-night-soft"
          >
            Recevoir un nouveau lien
          </Link>
        </div>
      ) : (
        <p role="status" className="text-lg text-ink-muted">
          Connexion en cours…
        </p>
      )}
    </main>
  );
}
