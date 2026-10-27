"use client";

import { useActionState, useId, useState } from "react";
import { PlusIcon, TrashIcon, WarningIcon } from "@phosphor-icons/react";
import { saveWeek } from "@/app/admin/(espace)/ce-chabbat/actions";
import type { ActionState } from "@/lib/admin/helpers";
import { AdminForm, FormMessage, SelectField, SubmitButton, TextArea, TextField } from "./fields";
import { btn } from "./styles";

export type WeekFormLine = {
  id: string;
  label: string;
  /** Heure affichée (« HH:MM ») */
  value: string | null;
  prefix: "avant" | "après" | null;
  /** Heure calculée, quand la ligne a été ajustée (« 18h28 ») */
  computed: string | null;
  hidden: boolean;
  warning: string | null;
};

export type WeekFormSection = { id: string; label: string; lines: WeekFormLine[]; kidouch: boolean };

type Extra = { uid: number; section: string; label: string; time: string };

type Props = {
  occasionKey: string;
  sections: WeekFormSection[];
  extras: { section: string; label: string; time: string | null }[];
  kidouch: string;
  note: string;
  title: string;
  computedTitle: string;
  closing: string;
  computedClosing: string;
};

/** Formulaire de la page « Ce Chabbat » : heures de la semaine, Kidouch, lignes ajoutées, note. */
export function WeekForm(props: Props) {
  const [state, action, pending] = useActionState(saveWeek, {} as ActionState);
  const e = state.fieldErrors ?? {};
  const sectionOptions = props.sections.map((s) => ({ value: s.id, label: s.label }));
  const defaultSection = props.sections.find((s) => s.kidouch)?.id ?? props.sections.at(-1)!.id;
  const [extras, setExtras] = useState<Extra[]>(
    props.extras.map((x, i) => ({ uid: i, section: x.section, label: x.label, time: x.time ?? "" })),
  );
  const [nextUid, setNextUid] = useState(props.extras.length);

  return (
    <AdminForm action={action} pending={pending} className="space-y-6">
      <FormMessage state={state} />
      <input type="hidden" name="key" value={props.occasionKey} />

      {props.sections.map((section) => (
        <fieldset key={section.id} className="space-y-2">
          <legend className="mb-2 text-sm font-semibold tracking-[0.12em] text-gold-ink uppercase">{section.label}</legend>
          {section.lines.map((line) => (
            <LineRow key={line.id} line={line} error={e[`time:${line.id}`]} />
          ))}
          {section.kidouch && (
            <TextArea
              label="Kidouch"
              name="kidouch"
              defaultValue={props.kidouch}
              placeholder="Grand Kidouch 🍷 offert par la famille … à l'occasion de …"
              hint="Laissez vide s'il n'y a pas de Kidouch particulier : la ligne n'apparaîtra pas."
              error={e.kidouch}
              maxLength={400}
              className="pt-2"
            />
          )}
        </fieldset>
      ))}

      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-semibold tracking-[0.12em] text-gold-ink uppercase">Lignes ajoutées cette semaine</legend>
        {extras.length === 0 && <p className="text-ink-muted">Aucune. Exemple : un cours spécial, un office supplémentaire.</p>}
        {extras.map((x, i) => (
          <div key={x.uid} className="space-y-3 rounded-lg border border-line bg-surface p-3">
            <SelectField
              label="Où ?"
              name="extra_section"
              required
              options={sectionOptions}
              value={x.section}
              onChange={(ev) => setExtras((all) => all.map((y) => (y.uid === x.uid ? { ...y, section: ev.target.value } : y)))}
            />
            <div className="grid grid-cols-[1fr_8rem] gap-3">
              <TextField
                label="Texte"
                name="extra_label"
                required
                maxLength={80}
                placeholder="Ex. : Cours spécial"
                value={x.label}
                error={e[`extra_label:${i}`]}
                onChange={(ev) => setExtras((all) => all.map((y) => (y.uid === x.uid ? { ...y, label: ev.target.value } : y)))}
              />
              <TextField
                label="Heure"
                name="extra_time"
                type="time"
                value={x.time}
                error={e[`extra_time:${i}`]}
                onChange={(ev) => setExtras((all) => all.map((y) => (y.uid === x.uid ? { ...y, time: ev.target.value } : y)))}
              />
            </div>
            <button
              type="button"
              className={btn.small}
              onClick={() => setExtras((all) => all.filter((y) => y.uid !== x.uid))}
            >
              <TrashIcon aria-hidden className="size-4" />
              Retirer cette ligne
            </button>
          </div>
        ))}
        <button
          type="button"
          className={btn.secondary}
          onClick={() => {
            setExtras((all) => [...all, { uid: nextUid, section: defaultSection, label: "", time: "" }]);
            setNextUid((n) => n + 1);
          }}
        >
          <PlusIcon aria-hidden weight="bold" className="size-5" />
          Ajouter une ligne
        </button>
      </fieldset>

      <TextArea
        label="Note"
        name="note"
        defaultValue={props.note}
        hint="Affichée en bas des horaires, avant la formule finale."
        error={e.note}
        maxLength={600}
      />

      <details className="rounded-lg border border-line bg-surface p-3">
        <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-night">Titre et formule finale</summary>
        <div className="mt-3 space-y-4">
          <TextField
            label="Titre"
            name="title"
            defaultValue={props.title}
            placeholder={props.computedTitle}
            hint={`Par défaut : « ${props.computedTitle} » (écrit en majuscules dans le message).`}
            error={e.title}
            maxLength={80}
          />
          <TextField
            label="Formule finale"
            name="closing"
            defaultValue={props.closing}
            placeholder={props.computedClosing}
            hint={`Par défaut : « ${props.computedClosing} ».`}
            error={e.closing}
            maxLength={80}
          />
        </div>
      </details>

      <SubmitButton className="w-full sm:w-auto">Enregistrer les horaires</SubmitButton>
    </AdminForm>
  );
}

function LineRow({ line, error }: { line: WeekFormLine; error?: string }) {
  const id = useId();
  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label htmlFor={id} className="min-w-0 flex-1 font-semibold">
          {line.label}
          {line.prefix && <span className="font-normal text-ink-muted"> ({line.prefix})</span>}
        </label>
        <input type="hidden" name={`displayed:${line.id}`} value={line.value ?? ""} />
        <input
          id={id}
          type="time"
          name={`time:${line.id}`}
          defaultValue={line.value ?? ""}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-erreur` : undefined}
          className="h-12 w-32 rounded-md border border-line bg-surface px-3 text-base text-ink tabular-nums outline-none focus:border-night focus:ring-2 focus:ring-gold/60 aria-[invalid=true]:border-red-700"
        />
        <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name={`shown:${line.id}`} defaultChecked={!line.hidden} className="size-5 accent-[var(--brand-primary)]" />
          Afficher
        </label>
      </div>
      {line.computed && <p className="mt-1 text-sm text-gold-ink">Ajusté cette semaine (calcul : {line.computed}). Videz l&apos;heure pour revenir au calcul.</p>}
      {line.warning && (
        <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-red-800">
          <WarningIcon aria-hidden weight="fill" className="size-4 shrink-0" />
          Attention : {line.label} {line.warning}.
        </p>
      )}
      {error && (
        <p id={`${id}-erreur`} className="mt-1 text-sm font-semibold text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
