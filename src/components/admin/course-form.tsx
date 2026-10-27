"use client";

import { useActionState } from "react";
import { saveCourse } from "@/app/admin/(espace)/cours/actions";
import type { ActionState } from "@/lib/admin/helpers";
import { ActionBar, AdminForm, FormMessage, SelectField, SubmitButton, TextField } from "./fields";
import { RichTextEditor } from "./rich-text-editor";

export type CourseFormValues = {
  id?: string;
  title: string;
  audience: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  scheduleText: string;
  speaker: string;
  location: string;
  description: string;
  sortOrder: string;
  status: "draft" | "published";
};

export function CourseForm({ values }: { values: CourseFormValues }) {
  const [state, action, pending] = useActionState(saveCourse, {} as ActionState);
  const e = state.fieldErrors ?? {};

  return (
    <AdminForm action={action} pending={pending}>
      <FormMessage state={state} />
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <TextField label="Titre" name="title" required defaultValue={values.title} error={e.title} placeholder="Ex. : Cours de Torah du mardi soir" />
      <SelectField
        label="Pour qui ?"
        name="audience"
        required
        defaultValue={values.audience}
        options={[
          { value: "tous", label: "Pour tous" },
          { value: "hommes", label: "Hommes" },
          { value: "femmes", label: "Femmes" },
          { value: "jeunes", label: "Jeunes" },
          { value: "enfants", label: "Enfants" },
        ]}
      />
      <fieldset className="grid gap-4 rounded-xl border border-line bg-surface p-4 sm:grid-cols-3">
        <legend className="px-1 font-semibold">Quand ?</legend>
        <SelectField
          label="Jour"
          name="dayOfWeek"
          defaultValue={values.dayOfWeek}
          error={e.dayOfWeek}
          options={[
            { value: "", label: "—" },
            { value: "0", label: "Dimanche" },
            { value: "1", label: "Lundi" },
            { value: "2", label: "Mardi" },
            { value: "3", label: "Mercredi" },
            { value: "4", label: "Jeudi" },
            { value: "5", label: "Vendredi" },
            { value: "6", label: "Samedi" },
          ]}
        />
        <TextField label="Début" name="startTime" type="time" defaultValue={values.startTime} error={e.startTime} />
        <TextField label="Fin" name="endTime" type="time" defaultValue={values.endTime} error={e.endTime} />
        <TextField
          label="Précision"
          name="scheduleText"
          defaultValue={values.scheduleText}
          className="sm:col-span-3"
          placeholder="Ex. : un jeudi sur deux, sauf vacances scolaires"
        />
      </fieldset>
      <TextField label="Intervenant" name="speaker" defaultValue={values.speaker} />
      <TextField label="Lieu" name="location" defaultValue={values.location} hint="Laissez vide si c'est au Beth Habad." />
      <RichTextEditor name="description" label="Description" defaultValue={values.description} />
      <TextField
        label="Ordre d'affichage"
        name="sortOrder"
        type="number"
        inputMode="numeric"
        min={0}
        defaultValue={values.sortOrder}
        hint="Les plus petits nombres s'affichent en premier."
        className="max-w-48"
      />
      <ActionBar>
        <SubmitButton name="intent" value="publish" variant="gold">
          {values.status === "published" ? "Enregistrer" : "Publier"}
        </SubmitButton>
        <SubmitButton name="intent" value="draft" variant="secondary">
          {values.status === "published" ? "Retirer du site" : "Brouillon"}
        </SubmitButton>
      </ActionBar>
    </AdminForm>
  );
}
