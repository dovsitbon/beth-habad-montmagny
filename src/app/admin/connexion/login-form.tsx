"use client";

import { useActionState, useState } from "react";
import { EnvelopeSimpleOpenIcon } from "@phosphor-icons/react";
import { sendLoginLink, verifyLoginCode, type LoginState } from "./actions";
import { FormMessage, SubmitButton, TextField } from "@/components/admin/fields";

const CODE_IN_EMAIL = process.env.NEXT_PUBLIC_LOGIN_CODE_IN_EMAIL === "1";

export function LoginForm() {
  const [linkState, sendLink] = useActionState(sendLoginLink, { step: "email" } as LoginState);
  const [codeState, verifyCode] = useActionState(verifyLoginCode, { step: "code" } as LoginState);
  const [showCode, setShowCode] = useState(false);

  if (linkState.step === "code") {
    return (
      <div className="space-y-6">
        <div role="status" className="rounded-xl border border-line bg-surface p-5">
          <EnvelopeSimpleOpenIcon aria-hidden weight="duotone" className="size-10 text-gold-ink" />
          <p className="mt-3 text-lg font-semibold">Regardez vos e-mails</p>
          <p className="mt-1 text-ink-muted">{linkState.message}</p>
          <p className="mt-3 text-sm text-ink-muted">
            Pensez à vérifier le dossier « Courrier indésirable ». Si vous demandez un nouvel e-mail, seul le
            dernier reçu fonctionnera.
          </p>
        </div>

        {/* Le code n'apparaît que dans l'e-mail personnalisé (actif une fois le SMTP configuré). */}
        {!CODE_IN_EMAIL ? null : showCode ? (
          <form action={verifyCode} className="space-y-4">
            <input type="hidden" name="email" value={linkState.email} />
            <TextField
              label="Code reçu par e-mail"
              name="code"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              hint="Utile si vous avez ajouté l'admin sur l'écran d'accueil de votre téléphone."
              error={codeState.error}
            />
            <SubmitButton className="w-full">Valider le code</SubmitButton>
          </form>
        ) : (
          <button type="button" onClick={() => setShowCode(true)} className="font-semibold text-night underline underline-offset-4">
            J&apos;ai reçu un code à saisir
          </button>
        )}

        <form action={sendLink}>
          <input type="hidden" name="email" value={linkState.email} />
          <button type="submit" className="text-sm text-ink-muted underline underline-offset-4">
            Renvoyer un e-mail
          </button>
        </form>
      </div>
    );
  }

  return (
    <form action={sendLink} className="space-y-4">
      <FormMessage state={{ ok: false, message: linkState.error }} />
      <TextField
        label="Votre adresse e-mail"
        name="email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        defaultValue={linkState.email}
      />
      <SubmitButton variant="gold" className="w-full text-lg">
        Recevoir mon lien de connexion
      </SubmitButton>
    </form>
  );
}
