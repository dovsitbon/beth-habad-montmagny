"use client";

import { useActionState } from "react";
import { saveAlbum } from "@/app/admin/(espace)/galerie/actions";
import type { ActionState } from "@/lib/admin/helpers";
import { ActionBar, AdminForm, FormMessage, SubmitButton, TextArea, TextField } from "./fields";

export function AlbumForm({
  values,
}: {
  values: { id?: string; title: string; date: string; description: string; status: "draft" | "published" };
}) {
  const [state, action, pending] = useActionState(saveAlbum, {} as ActionState);
  const e = state.fieldErrors ?? {};
  const isNew = !values.id;

  return (
    <AdminForm action={action} pending={pending}>
      <FormMessage state={state} />
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <TextField label="Titre de l'album" name="title" required defaultValue={values.title} error={e.title} placeholder="Ex. : Fête de Hanoukah 5787" />
      <TextField label="Date" name="date" type="date" defaultValue={values.date} error={e.date} className="max-w-xs" />
      <TextArea label="Description" name="description" defaultValue={values.description} maxLength={500} />
      {isNew ? (
        <ActionBar>
          <SubmitButton name="intent" value="draft" variant="gold">
            Créer l&apos;album et ajouter des photos
          </SubmitButton>
        </ActionBar>
      ) : (
        <div className="flex flex-wrap gap-2">
          <SubmitButton name="intent" value="publish" variant="gold">
            {values.status === "published" ? "Enregistrer" : "Publier l'album"}
          </SubmitButton>
          <SubmitButton name="intent" value="draft" variant="secondary">
            {values.status === "published" ? "Retirer du site" : "Garder en brouillon"}
          </SubmitButton>
        </div>
      )}
    </AdminForm>
  );
}
