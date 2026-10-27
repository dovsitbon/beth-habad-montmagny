"use client";

import { useActionState, useState } from "react";
import { saveEvent } from "@/app/admin/(espace)/evenements/actions";
import type { ActionState } from "@/lib/admin/helpers";
import { ActionBar, AdminForm, CheckField, FormMessage, SelectField, SubmitButton, TextArea, TextField } from "./fields";
import { ImageField } from "./image-field";
import { RichTextEditor } from "./rich-text-editor";

export type EventFormValues = {
  id?: string;
  category: "general" | "cteen";
  title: string;
  summary: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  price: string;
  imagePath: string;
  registration: boolean;
  capacity: string;
  deadlineDate: string;
  status: "draft" | "published";
};

export function EventForm({ values, mediaBaseUrl }: { values: EventFormValues; mediaBaseUrl: string }) {
  const [state, action, pending] = useActionState(saveEvent, {} as ActionState);
  const [registration, setRegistration] = useState(values.registration);
  const e = state.fieldErrors ?? {};

  return (
    <AdminForm action={action} pending={pending}>
      <FormMessage state={state} />
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <SelectField
        label="Type d'événement"
        name="category"
        required
        defaultValue={values.category}
        options={[
          { value: "general", label: "Événement du Beth Habad" },
          { value: "cteen", label: "CTeen (pour les ados)" },
        ]}
      />
      <TextField label="Titre" name="title" required defaultValue={values.title} error={e.title} placeholder="Ex. : Repas de Chabbat communautaire" />
      <TextArea
        label="Résumé en une phrase"
        name="summary"
        defaultValue={values.summary}
        error={e.summary}
        maxLength={300}
        hint="Affiché dans l'agenda, sous le titre."
      />

      <fieldset className="grid gap-4 rounded-xl border border-line bg-surface p-4 sm:grid-cols-3">
        <legend className="px-1 font-semibold">Date et heure</legend>
        <TextField label="Date" name="date" type="date" required defaultValue={values.date} error={e.date} />
        <TextField label="Début" name="startTime" type="time" required defaultValue={values.startTime} error={e.startTime} />
        <TextField label="Fin" name="endTime" type="time" defaultValue={values.endTime} error={e.endTime} />
      </fieldset>

      <TextField label="Lieu" name="location" defaultValue={values.location} hint="Laissez vide si c'est au Beth Habad." />
      <TextField label="Prix" name="price" defaultValue={values.price} placeholder="Ex. : 20 € par adulte, gratuit pour les enfants" />
      <ImageField name="imagePath" label="Photo" folder="events" defaultPath={values.imagePath} publicBaseUrl={mediaBaseUrl} />
      <RichTextEditor name="description" label="Description" defaultValue={values.description} hint="Programme, informations pratiques…" />

      <CheckField
        label="Inscription en ligne"
        name="registration"
        defaultChecked={values.registration}
        onChange={setRegistration}
        hint="Les visiteurs pourront s'inscrire depuis la page de l'événement."
      />
      {registration && (
        <div className="grid gap-4 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2">
          <TextField
            label="Nombre de places"
            name="capacity"
            type="number"
            inputMode="numeric"
            min={1}
            defaultValue={values.capacity}
            error={e.capacity}
            hint="Laissez vide pour ne pas limiter."
          />
          <TextField label="Date limite d'inscription" name="deadlineDate" type="date" defaultValue={values.deadlineDate} error={e.deadlineDate} />
        </div>
      )}

      <ActionBar>
        <SubmitButton name="intent" value="publish" variant="gold">
          {values.status === "published" ? "Enregistrer" : "Publier"}
        </SubmitButton>
        <SubmitButton name="intent" value="preview" variant="secondary">
          Aperçu
        </SubmitButton>
        {values.status === "published" ? (
          <SubmitButton name="intent" value="draft" variant="secondary">
            Retirer du site
          </SubmitButton>
        ) : (
          <SubmitButton name="intent" value="draft" variant="secondary">
            Brouillon
          </SubmitButton>
        )}
      </ActionBar>
    </AdminForm>
  );
}
