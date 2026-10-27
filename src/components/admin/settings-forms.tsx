"use client";

import { useActionState } from "react";
import { saveAdminSettings, saveSettings } from "@/app/admin/(espace)/parametres/actions";
import type { ActionState } from "@/lib/admin/helpers";
import { ActionBar, AdminForm, FormMessage, SubmitButton, TextField } from "./fields";
import { ImageField } from "./image-field";

export type SettingsValues = {
  name: string;
  shortName: string;
  tagline: string;
  street: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  notificationEmail: string;
  whatsapp: string;
  donationUrl: string;
  facebook: string;
  instagram: string;
  youtube: string;
};

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-xl border border-line bg-surface p-4">
      <legend className="px-1 text-lg font-bold text-night">{title}</legend>
      {children}
    </fieldset>
  );
}

export function SettingsForm({ values }: { values: SettingsValues }) {
  const [state, action, pending] = useActionState(saveSettings, {} as ActionState);
  const e = state.fieldErrors ?? {};
  const v = values;
  return (
    <AdminForm action={action} pending={pending}>
      <FormMessage state={state} />
      <Group title="Nom et présentation">
        <TextField label="Nom complet" name="name" required defaultValue={v.name} error={e.name} />
        <TextField label="Nom court" name="shortName" required defaultValue={v.shortName} error={e.shortName} hint="Utilisé quand la place manque." />
        <TextField label="Phrase de présentation" name="tagline" defaultValue={v.tagline} hint="Affichée dans les résultats Google." />
      </Group>
      <Group title="Adresse">
        <TextField label="Rue" name="street" defaultValue={v.street} />
        <div className="grid grid-cols-[8rem_1fr] gap-3">
          <TextField label="Code postal" name="postalCode" defaultValue={v.postalCode} inputMode="numeric" />
          <TextField label="Ville" name="city" defaultValue={v.city} />
        </div>
      </Group>
      <Group title="Contact">
        <TextField label="Téléphone" name="phone" type="tel" defaultValue={v.phone} error={e.phone} />
        <TextField label="E-mail affiché sur le site" name="email" type="email" defaultValue={v.email} error={e.email} />
        <TextField
          label="E-mail qui reçoit les messages et inscriptions"
          name="notificationEmail"
          type="email"
          required
          defaultValue={v.notificationEmail}
          error={e.notificationEmail}
          hint="Jamais affiché sur le site."
        />
        <TextField label="Numéro WhatsApp" name="whatsapp" type="tel" defaultValue={v.whatsapp} error={e.whatsapp} placeholder="06 12 34 56 78" />
      </Group>
      <Group title="Dons">
        <TextField
          label="Lien Allodons"
          name="donationUrl"
          type="url"
          defaultValue={v.donationUrl}
          error={e.donationUrl}
          placeholder="https://www.allodons.fr/…"
          hint="Le bouton « Faire un don » de toutes les pages ouvrira ce lien."
        />
      </Group>
      <Group title="Réseaux sociaux">
        <TextField label="Facebook" name="facebook" type="url" defaultValue={v.facebook} error={e.facebook} placeholder="https://facebook.com/…" />
        <TextField label="Instagram" name="instagram" type="url" defaultValue={v.instagram} error={e.instagram} placeholder="https://instagram.com/…" />
        <TextField label="YouTube" name="youtube" type="url" defaultValue={v.youtube} error={e.youtube} placeholder="https://youtube.com/…" />
      </Group>
      <ActionBar>
        <SubmitButton variant="gold">Enregistrer les paramètres</SubmitButton>
      </ActionBar>
    </AdminForm>
  );
}

export function AdminSettingsForm({
  values,
  mediaBaseUrl,
}: {
  values: { colorPrimary: string; colorAccent: string; latitude: string; longitude: string; logoPath: string };
  mediaBaseUrl: string;
}) {
  const [state, action, pending] = useActionState(saveAdminSettings, {} as ActionState);
  const e = state.fieldErrors ?? {};
  return (
    <AdminForm action={action} pending={pending}>
      <FormMessage state={state} />
      <ImageField name="logoPath" label="Logo" folder="settings" defaultPath={values.logoPath} publicBaseUrl={mediaBaseUrl} hint="Emblème affiché à gauche du nom, en haut du site (de préférence sur fond transparent)." />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Couleur principale (bleu nuit)" name="colorPrimary" type="color" required defaultValue={values.colorPrimary} error={e.colorPrimary} className="[&_input]:h-14" />
        <TextField label="Couleur d'accent (or)" name="colorAccent" type="color" required defaultValue={values.colorAccent} error={e.colorAccent} className="[&_input]:h-14" />
        <TextField label="Latitude" name="latitude" inputMode="decimal" required defaultValue={values.latitude} error={e.latitude} />
        <TextField label="Longitude" name="longitude" inputMode="decimal" required defaultValue={values.longitude} error={e.longitude} />
      </div>
      <p className="text-sm text-ink-muted">La position GPS sert à la carte et au calcul des horaires de Chabbat.</p>
      <SubmitButton>Enregistrer les paramètres techniques</SubmitButton>
    </AdminForm>
  );
}
