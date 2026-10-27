import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

export default function ConnexionPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <p className="text-sm font-semibold tracking-[0.18em] text-gold-ink uppercase">Espace de gestion</p>
      <h1 className="mt-2 text-4xl text-night">Connexion</h1>
      <p className="mt-3 text-lg text-ink-muted">
        Pas de mot de passe à retenir : indiquez votre adresse e-mail, vous recevrez un lien pour vous connecter.
      </p>
      <div className="mt-8">
        <LoginForm />
      </div>
    </main>
  );
}
