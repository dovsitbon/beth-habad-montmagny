"use client";

import { useActionState, useState } from "react";
import { saveAnnouncement } from "@/app/admin/(espace)/annonces/actions";
import type { ActionState } from "@/lib/admin/helpers";
import { ActionBar, AdminForm, CheckField, FormMessage, SelectField, SubmitButton, TextArea, TextField } from "./fields";

export type AnnouncementValues = {
  id?: string;
  message: string;
  linkUrl: string;
  linkLabel: string;
  level: "info" | "important";
  active: boolean;
  expiresDate: string;
  expiresTime: string;
};

export function AnnouncementForm({ values }: { values: AnnouncementValues }) {
  const [state, action, pending] = useActionState(saveAnnouncement, {} as ActionState);
  const [text, setText] = useState(values.message);
  const [level, setLevel] = useState(values.level);
  const e = state.fieldErrors ?? {};

  return (
    <AdminForm action={action} pending={pending}>
      <FormMessage state={state} />
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <TextArea
        label="Texte de l'annonce"
        name="message"
        required
        maxLength={280}
        defaultValue={values.message}
        onChange={(ev) => setText(ev.target.value)}
        error={e.message}
        hint={`${text.length} / 280 caractères`}
      />

      {/* Aperçu direct du bandeau tel qu'il apparaîtra en haut du site. */}
      <div>
        <p className="font-semibold">Aperçu</p>
        <p className={`mt-1.5 rounded-md p-3 font-semibold ${level === "important" ? "bg-gold text-night-deep" : "bg-gold-tint text-ink"}`}>
          {text || "Votre annonce apparaîtra ici."}
        </p>
      </div>

      <SelectField
        label="Couleur du bandeau"
        name="level"
        required
        defaultValue={values.level}
        onChange={(ev) => setLevel(ev.target.value as "info" | "important")}
        options={[
          { value: "info", label: "Discrète (doré clair)" },
          { value: "important", label: "Importante (doré vif)" },
        ]}
      />
      <TextField label="Lien" name="linkUrl" defaultValue={values.linkUrl} error={e.linkUrl} placeholder="https://… ou /evenements" hint="Par exemple vers un événement du site." />
      <TextField label="Texte du lien" name="linkLabel" defaultValue={values.linkLabel} placeholder="En savoir plus" />

      <fieldset className="grid gap-4 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2">
        <legend className="px-1 font-semibold">Disparition automatique</legend>
        <TextField label="Le" name="expiresDate" type="date" defaultValue={values.expiresDate} error={e.expiresDate} />
        <TextField label="À" name="expiresTime" type="time" defaultValue={values.expiresTime} hint="23 h 59 si vous laissez vide." />
      </fieldset>

      <CheckField label="Afficher sur le site" name="active" defaultChecked={values.active} hint="Décochez pour masquer l'annonce sans la supprimer." />

      <ActionBar>
        <SubmitButton variant="gold">Enregistrer</SubmitButton>
      </ActionBar>
    </AdminForm>
  );
}
