import { Suspense } from "react";
import { requireMember } from "@/lib/auth";
import { AdminShell } from "@/components/admin/shell";

// L'admin lit la session à chaque page : on accepte que la navigation attende le serveur
// (pas d'affichage « instantané » pré-calculé, inutile ici).
export const instant = false;

/**
 * Toutes les pages de l'espace de gestion passent par ici :
 * une personne non connectée (ou sans profil d'équipe) est renvoyée vers la connexion.
 */
export default function EspaceLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<Loading />}>
      <Guarded>{children}</Guarded>
    </Suspense>
  );
}

async function Guarded({ children }: { children: React.ReactNode }) {
  const member = await requireMember();
  return <AdminShell member={member}>{children}</AdminShell>;
}

function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p role="status" className="text-lg text-ink-muted">
        Chargement…
      </p>
    </div>
  );
}
