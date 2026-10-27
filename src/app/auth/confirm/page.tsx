"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Failure = { title: string; text: string; code: string };

/** Explications en français selon la raison du refus (codes renvoyés par Supabase). */
function explain(code: string): Omit<Failure, "code"> {
  switch (code) {
    case "otp_expired":
      return {
        title: "Ce lien n'est plus valable",
        text: "Un lien ne sert qu'une seule fois et reste valable 1 heure. Si vous avez demandé plusieurs e-mails, seul le dernier fonctionne : les précédents sont annulés.",
      };
    case "access_denied":
      return {
        title: "Accès refusé",
        text: "Cette adresse e-mail ne fait peut-être pas partie de l'équipe. Demandez à l'administrateur de vous ajouter.",
      };
    case "lien_incomplet":
      return {
        title: "Ce lien est incomplet",
        text: "L'adresse ouverte ne contient pas les informations de connexion. Ouvrez le lien directement depuis l'e-mail (sans le copier à la main).",
      };
    default:
      return {
        title: "La connexion n'a pas abouti",
        text: "Le lien a peut-être déjà servi ou expiré. Demandez simplement un nouveau lien et utilisez le plus récent.",
      };
  }
}

/**
 * Arrivée depuis le lien de connexion reçu par e-mail. Gère les trois formats possibles :
 *  - ?token_hash=…&type=email  (modèle d'e-mail personnalisé)
 *  - ?code=…                   (même navigateur que la demande)
 *  - #access_token=…           (lien magique par défaut de Supabase, flux implicite)
 * En cas d'échec, Supabase renvoie ici avec #error_code=… : la raison est expliquée.
 */
export default function ConfirmPage() {
  const router = useRouter();
  const [failure, setFailure] = useState<Failure | null>(null);
  // Un lien ne se vérifie qu'une fois (React peut rejouer l'effet en développement).
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // Lire l'adresse AVANT de créer le client Supabase : à sa création, il analyse
    // lui-même l'adresse et efface le fragment #error=… qu'on veut expliquer.
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const supabase = createBrowserSupabase();
    const next = search.get("next")?.startsWith("/admin") ? search.get("next")! : "/admin";

    const fail = (code: string) => {
      window.history.replaceState(null, "", "/auth/confirm");
      setFailure({ ...explain(code), code });
    };

    async function confirm() {
      // Refus déjà constaté par Supabase (lien expiré, déjà utilisé, remplacé…).
      const errorCode = hash.get("error_code") ?? search.get("error_code") ?? hash.get("error") ?? search.get("error");
      if (errorCode) return fail(errorCode);

      let error: { code?: string; message: string } | null = null;
      if (search.get("token_hash")) {
        ({ error } = await supabase.auth.verifyOtp({ token_hash: search.get("token_hash")!, type: "email" }));
      } else if (search.get("code")) {
        ({ error } = await supabase.auth.exchangeCodeForSession(search.get("code")!));
      } else if (hash.get("access_token") && hash.get("refresh_token")) {
        ({ error } = await supabase.auth.setSession({
          access_token: hash.get("access_token")!,
          refresh_token: hash.get("refresh_token")!,
        }));
      } else {
        return fail("lien_incomplet");
      }

      if (error) return fail(error.code ?? "erreur_inconnue");

      // Retire les jetons de l'adresse avant de quitter la page.
      window.history.replaceState(null, "", "/auth/confirm");
      router.replace(next);
      router.refresh();
    }
    confirm();
  }, [router]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      {failure ? (
        <div role="alert">
          <h1 className="text-3xl text-night">{failure.title}</h1>
          <p className="mt-3 text-lg text-ink-muted">{failure.text}</p>
          <Link
            href="/admin/connexion"
            className="mt-6 inline-flex h-12 items-center rounded-md bg-night px-6 font-bold text-white hover:bg-night-soft"
          >
            Recevoir un nouveau lien
          </Link>
          {/* Code technique à communiquer en cas de problème persistant. */}
          <p className="mt-6 text-sm text-ink-muted">Code : {failure.code}</p>
        </div>
      ) : (
        <p role="status" className="text-lg text-ink-muted">
          Connexion en cours…
        </p>
      )}
    </main>
  );
}
