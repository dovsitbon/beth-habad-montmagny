"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import Link from "next/link";
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { sendContactMessage, type ContactState } from "@/app/(public)/contact/actions";
import { Field } from "./field";
import { SpamFields } from "./spam-fields";

const initial: ContactState = { status: "idle" };

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, initial);
  const messageRef = useRef<HTMLDivElement>(null);
  const textareaId = useId();

  useEffect(() => {
    if (state.status !== "idle") messageRef.current?.focus();
  }, [state]);

  if (state.status === "success") {
    return (
      <div ref={messageRef} tabIndex={-1} role="status" className="flex gap-3 rounded-lg bg-[#EDF3EC] p-5 font-semibold text-[#2C5530] outline-none">
        <CheckCircleIcon aria-hidden weight="fill" className="mt-0.5 size-6 shrink-0" />
        {state.message}
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

      <SpamFields />
      <Field label="Nom" name="name" autoComplete="name" required defaultValue={v.name} error={errors.name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={v.email}
          error={errors.email}
          hint="E-mail ou téléphone : au moins l'un des deux."
        />
        <Field label="Téléphone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={v.phone} error={errors.phone} />
      </div>
      <div>
        <label htmlFor={textareaId} className="block font-semibold text-ink">
          Message <span className="font-normal text-ink-muted">(obligatoire)</span>
        </label>
        <textarea
          id={textareaId}
          name="message"
          rows={6}
          required
          defaultValue={v.message}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? `${textareaId}-erreur` : undefined}
          className="mt-1.5 block w-full rounded-md border border-line bg-surface px-3 py-2.5 text-base text-ink outline-none focus:border-night focus:ring-2 focus:ring-gold/60 aria-[invalid=true]:border-red-700"
        />
        {errors.message && (
          <p id={`${textareaId}-erreur`} className="mt-1 text-sm font-semibold text-red-800">
            {errors.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded-md bg-night px-6 text-lg font-bold text-white transition-colors hover:bg-night-soft disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Envoi en cours…" : "Envoyer le message"}
      </button>

      <p className="text-sm text-ink-muted">
        Vos coordonnées servent uniquement à vous répondre.{" "}
        <Link href="/confidentialite" className="underline underline-offset-4">
          En savoir plus
        </Link>
        .
      </p>
    </form>
  );
}
