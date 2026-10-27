"use client";

import { createContext, startTransition, useContext, useEffect, useId, useRef } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { btn } from "./styles";

type Base = { label: string; name: string; hint?: string; error?: string; required?: boolean; className?: string };

const inputClass =
  "mt-1.5 block w-full rounded-md border border-line bg-surface px-3 text-base text-ink outline-none transition-colors focus:border-night focus:ring-2 focus:ring-gold/60 aria-[invalid=true]:border-red-700";

function Label({ id, label, required }: { id: string; label: string; required?: boolean }) {
  return (
    <label htmlFor={id} className="block font-semibold text-ink">
      {label}
      {!required && <span className="font-normal text-ink-muted"> (facultatif)</span>}
    </label>
  );
}

function Help({ id, hint, error }: { id: string; hint?: string; error?: string }) {
  return (
    <>
      {hint && (
        <p id={`${id}-aide`} className="mt-1 text-sm text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-erreur`} className="mt-1 text-sm font-semibold text-red-800">
          {error}
        </p>
      )}
    </>
  );
}

function describedBy(id: string, hint?: string, error?: string) {
  return [hint && `${id}-aide`, error && `${id}-erreur`].filter(Boolean).join(" ") || undefined;
}

export function TextField({
  label,
  name,
  hint,
  error,
  required,
  className = "",
  ...input
}: Base & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name">) {
  const id = useId();
  return (
    <div className={className}>
      <Label id={id} label={label} required={required} />
      <input
        id={id}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${inputClass} h-12`}
        {...input}
      />
      <Help id={id} hint={hint} error={error} />
    </div>
  );
}

export function TextArea({
  label,
  name,
  hint,
  error,
  required,
  className = "",
  ...input
}: Base & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name">) {
  const id = useId();
  return (
    <div className={className}>
      <Label id={id} label={label} required={required} />
      <textarea
        id={id}
        name={name}
        required={required}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${inputClass} py-2.5`}
        {...input}
      />
      <Help id={id} hint={hint} error={error} />
    </div>
  );
}

export function SelectField({
  label,
  name,
  hint,
  error,
  required,
  className = "",
  options,
  ...select
}: Base & { options: { value: string; label: string }[] } & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name">) {
  const id = useId();
  return (
    <div className={className}>
      <Label id={id} label={label} required={required} />
      <select
        id={id}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${inputClass} h-12`}
        {...select}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Help id={id} hint={hint} error={error} />
    </div>
  );
}

/** Case à cocher large, facile à toucher. */
export function CheckField({
  label,
  name,
  hint,
  defaultChecked,
  onChange,
}: {
  label: string;
  name: string;
  hint?: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex gap-3 rounded-lg border border-line bg-surface p-4">
      <input
        id={id}
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        onChange={(e) => onChange?.(e.target.checked)}
        aria-describedby={hint ? `${id}-aide` : undefined}
        className="mt-0.5 size-6 shrink-0 accent-[var(--brand-primary)]"
      />
      <div>
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        {hint && (
          <p id={`${id}-aide`} className="text-sm text-ink-muted">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

/** Message global de résultat d'un formulaire ; il reçoit le focus pour être vu (et lu) tout de suite. */
export function FormMessage({ state }: { state: { ok?: boolean; message?: string } }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.message) {
      ref.current?.focus();
      ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [state]);
  if (!state.message) return null;
  return state.ok ? (
    <p ref={ref} tabIndex={-1} role="status" className="flex gap-3 rounded-lg bg-[#EDF3EC] p-4 font-semibold text-[#2C5530] outline-none">
      <CheckCircleIcon aria-hidden weight="fill" className="mt-0.5 size-5 shrink-0" />
      {state.message}
    </p>
  ) : (
    <p ref={ref} tabIndex={-1} role="alert" className="flex gap-3 rounded-lg bg-[#FDEBEC] p-4 font-semibold text-[#8A2A28] outline-none">
      <WarningCircleIcon aria-hidden weight="fill" className="mt-0.5 size-5 shrink-0" />
      {state.message}
    </p>
  );
}

const PendingContext = createContext(false);

/**
 * Formulaire de l'admin qui conserve les saisies en cas d'erreur.
 * (Avec <form action>, React vide le formulaire après chaque envoi : le rabbin perdrait
 * tout ce qu'il a tapé à la moindre erreur. On envoie donc les données nous-mêmes.)
 */
export function AdminForm({
  action,
  pending,
  children,
  className = "space-y-5",
}: {
  action: (form: FormData) => void;
  pending: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const dirty = useRef(false);

  // Avertit avant de quitter la page si des modifications n'ont pas été enregistrées.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  return (
    <PendingContext value={pending}>
      <form
        noValidate
        className={className}
        onInput={() => (dirty.current = true)}
        onSubmit={(e) => {
          // `dirty` n'est pas remis à zéro : la redirection après un enregistrement réussi est une
          // navigation interne (pas d'avertissement), et en cas d'erreur les saisies restent à protéger.
          e.preventDefault();
          // Le bouton cliqué (Publier, Brouillon, Aperçu…) est transmis avec les données.
          const data = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
          startTransition(() => action(data));
        }}
      >
        {children}
      </form>
    </PendingContext>
  );
}

/** Bouton d'envoi qui affiche « Enregistrement… » pendant l'envoi. */
export function SubmitButton({
  children,
  variant = "primary",
  name,
  value,
  className = "",
}: {
  children: React.ReactNode;
  variant?: keyof typeof btn;
  name?: string;
  value?: string;
  className?: string;
}) {
  const { pending: formPending } = useFormStatus();
  const pending = useContext(PendingContext) || formPending;
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={`${btn[variant]} ${className}`}>
      {pending ? "Enregistrement…" : children}
    </button>
  );
}

/** Barre d'actions collée en bas de l'écran sur téléphone. */
export function ActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
      <div className="mx-auto flex max-w-3xl flex-wrap gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">{children}</div>
    </div>
  );
}

/** Formulaire d'une seule action (supprimer, dupliquer…) avec confirmation facultative. */
export function ActionButton({
  action,
  children,
  confirm,
  variant = "small",
  hidden,
}: {
  action: (form: FormData) => void | Promise<void>;
  children: React.ReactNode;
  confirm?: string;
  variant?: keyof typeof btn;
  hidden?: Record<string, string>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <PendingButton variant={variant}>{children}</PendingButton>
    </form>
  );
}

function PendingButton({ children, variant }: { children: React.ReactNode; variant: keyof typeof btn }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={btn[variant]}>
      {pending ? "Un instant…" : children}
    </button>
  );
}
