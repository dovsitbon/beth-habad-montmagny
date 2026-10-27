import { useId } from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

/** Champ de formulaire accessible : label visible, aide et erreur reliées au champ. */
export function Field({ label, hint, error, className = "", ...input }: Props) {
  const id = useId();
  const hintId = hint ? `${id}-aide` : undefined;
  const errorId = error ? `${id}-erreur` : undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="block font-semibold text-ink">
        {label}
        {input.required && <span className="text-ink-muted font-normal"> (obligatoire)</span>}
      </label>
      {hint && (
        <p id={hintId} className="mt-0.5 text-sm text-ink-muted">
          {hint}
        </p>
      )}
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className="mt-1.5 block h-12 w-full rounded-md border border-line bg-surface px-3 text-base text-ink shadow-none transition-colors outline-none placeholder:text-ink-muted/70 focus:border-night focus:ring-2 focus:ring-gold/60 aria-[invalid=true]:border-red-700"
        {...input}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm font-semibold text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
