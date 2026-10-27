"use client";

import { useActionState } from "react";
import { savePage } from "@/app/admin/(espace)/textes/actions";
import type { ActionState } from "@/lib/admin/helpers";
import { ActionBar, AdminForm, FormMessage, SubmitButton, TextField } from "./fields";
import { ImageField } from "./image-field";
import { RichTextEditor } from "./rich-text-editor";

export function PageForm({
  values,
  withImage,
  mediaBaseUrl,
}: {
  values: { slug: string; title: string; body: string; imagePath: string };
  withImage: boolean;
  mediaBaseUrl: string;
}) {
  const [state, action, pending] = useActionState(savePage, {} as ActionState);
  const e = state.fieldErrors ?? {};
  return (
    <AdminForm action={action} pending={pending}>
      <FormMessage state={state} />
      <input type="hidden" name="slug" value={values.slug} />
      <TextField label="Titre" name="title" required defaultValue={values.title} error={e.title} />
      {withImage ? (
        <ImageField name="imagePath" label="Photo" folder="pages" defaultPath={values.imagePath} publicBaseUrl={mediaBaseUrl} />
      ) : (
        <input type="hidden" name="imagePath" value={values.imagePath} />
      )}
      <RichTextEditor
        name="body"
        label="Texte"
        defaultValue={values.body}
        hint="Remplacez les passages marqués [À COMPLÉTER]. Utilisez « Intertitre » pour découper un long texte."
      />
      <ActionBar>
        <SubmitButton variant="gold">Publier</SubmitButton>
      </ActionBar>
    </AdminForm>
  );
}
