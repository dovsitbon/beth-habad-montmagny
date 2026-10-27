"use client";

import { useActionState } from "react";
import { saveServiceTime, saveServicesNote } from "@/app/admin/(espace)/offices/actions";
import type { ActionState } from "@/lib/admin/helpers";
import { AdminForm, FormMessage, SelectField, SubmitButton, TextField } from "./fields";
import { DAY_OPTIONS, OFFICE_OPTIONS } from "./service-options";

export function ServiceTimeForm({
  values,
  submitLabel,
}: {
  values: { id?: string; office: string; dayType: string; time: string; note: string; sortOrder: string };
  submitLabel: string;
}) {
  const [state, action, pending] = useActionState(saveServiceTime, {} as ActionState);
  const e = state.fieldErrors ?? {};
  return (
    <AdminForm action={action} pending={pending} className="space-y-4">
      <FormMessage state={state} />
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="sortOrder" value={values.sortOrder} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Office" name="office" required defaultValue={values.office} options={OFFICE_OPTIONS} />
        <SelectField label="Quand" name="dayType" required defaultValue={values.dayType} options={DAY_OPTIONS} />
        <TextField label="Heure" name="time" type="time" defaultValue={values.time} error={e.time} />
        <TextField label="Précision" name="note" defaultValue={values.note} placeholder="Ex. : 15 min avant l'allumage" />
      </div>
      <SubmitButton>{submitLabel}</SubmitButton>
    </AdminForm>
  );
}

export function ServicesNoteForm({ note }: { note: string }) {
  const [state, action, pending] = useActionState(saveServicesNote, {} as ActionState);
  return (
    <AdminForm action={action} pending={pending} className="space-y-3">
      <FormMessage state={state} />
      <TextField
        label="Note affichée en haut de la page"
        name="note"
        defaultValue={note}
        maxLength={200}
        placeholder="Ex. : Horaires d'été, à partir du 1er juillet"
        hint="Laissez vide pour ne rien afficher."
      />
      <SubmitButton variant="secondary">Enregistrer la note</SubmitButton>
    </AdminForm>
  );
}
