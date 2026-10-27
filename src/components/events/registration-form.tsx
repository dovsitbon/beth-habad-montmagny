"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { registerForEvent, type RegistrationState } from "@/app/(public)/evenements/[slug]/actions";
import { Field } from "@/components/forms/field";
import { SpamFields } from "@/components/forms/spam-fields";

const initial: RegistrationState = { status: "idle" };

export function RegistrationForm({ eventId, slug, maxParty }: { eventId: string; slug: string; maxParty: number }) {
  const [state, action, pending] = useActionState(registerForEvent, initial);
  const messageRef = useRef<HTMLDivElement>(null);

  // Place le focus sur le message de résultat pour qu'il soit lu immédiatement.
  useEffect(() => {
    if (state.status !== "idle") messageRef.current?.focus();
  }, [state]);

  if (state.status === "success") {
    return (
      <div ref={messageRef} tabIndex={-1} role="status" className="rounded-lg bg-[#EDF3EC] p-5 text-[#2C5530] outline-none">
        <p className="flex gap-3 font-semibold">
          <CheckCircleIcon aria-hidden weight="fill" className="mt-0.5 size-6 shrink-0" />
          {state.message}
        </p>
        <p className="mt-2 pl-9">
          Pensez à l&apos;ajouter à votre agenda :{" "}
          <Link href={`/evenements/${slug}/agenda.ics`} prefetch={false} className="font-semibold underline underline-offset-4">
            télécharger le rappel
          </Link>
          .
        </p>
      </div>
    );
  }

  const errors = state.fieldErrors ?? {};
  const v = state.values ?? {};

  return (
    <form action={action} noValidate className="relative space-y-4">
      {state.status === "error" && state.message && (
        <div ref={messageRef} tabIndex={-1} role="alert" className="flex gap-3 rounded-lg bg-[#FDEBEC] p-4 font-semibold text-[#8A2A28] outline-none">
          <WarningCircleIcon aria-hidden weight="fill" className="mt-0.5 size-5 shrink-0" />
          {state.message}
        </div>
      )}

      <input type="hidden" name="eventId" value={eventId} />
      <SpamFields />

      <Field label="Nom et prénom" name="name" autoComplete="name" required defaultValue={v.name} error={errors.name} />
      <Field
        label="Téléphone"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        defaultValue={v.phone}
        error={errors.phone}
        hint="Téléphone ou e-mail : au moins l'un des deux."
      />
      <Field label="E-mail" name="email" type="email" autoComplete="email" defaultValue={v.email} error={errors.email} />
      <Field
        label="Nombre de personnes"
        name="partySize"
        type="number"
        inputMode="numeric"
        min={1}
        max={maxParty}
        required
        defaultValue={v.partySize ?? "1"}
        error={errors.partySize}
        className="max-w-48"
      />

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded-md bg-night px-6 text-lg font-bold text-white transition-colors hover:bg-night-soft disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Envoi en cours…" : "Je m'inscris"}
      </button>

      <p className="text-sm text-ink-muted">
        Vos coordonnées servent uniquement à organiser cet événement. Elles sont supprimées 6 mois après.{" "}
        <Link href="/confidentialite" className="underline underline-offset-4">
          En savoir plus
        </Link>
        .
      </p>
    </form>
  );
}
