"use client";

import { useActionState } from "react";
import { saveOverride, saveShabbatRules } from "@/app/admin/(espace)/horaires-chabbat/actions";
import type { ActionState } from "@/lib/admin/helpers";
import { AdminForm, FormMessage, SelectField, SubmitButton, TextField } from "./fields";

export function ShabbatRulesForm({ candleMinutes, havdalahMinutes }: { candleMinutes: number; havdalahMinutes: number | null }) {
  const [state, action, pending] = useActionState(saveShabbatRules, {} as ActionState);
  const e = state.fieldErrors ?? {};
  return (
    <AdminForm action={action} pending={pending} className="space-y-4">
      <FormMessage state={state} />
      <TextField
        label="Allumage des bougies : minutes avant le coucher du soleil"
        name="candleMinutes"
        type="number"
        inputMode="numeric"
        min={0}
        max={60}
        required
        defaultValue={String(candleMinutes)}
        error={e.candleMinutes}
        className="max-w-xs"
      />
      <SelectField
        label="Heure de la Havdala"
        name="havdalah"
        required
        defaultValue={havdalahMinutes === null ? "nuit" : String(havdalahMinutes)}
        options={[
          { value: "nuit", label: "À la tombée de la nuit (8,5° sous l'horizon)" },
          { value: "42", label: "42 minutes après le coucher du soleil" },
          { value: "50", label: "50 minutes après le coucher du soleil" },
          { value: "72", label: "72 minutes après le coucher du soleil" },
        ]}
      />
      <SubmitButton variant="secondary">Enregistrer les règles de calcul</SubmitButton>
    </AdminForm>
  );
}

export function OverrideForm() {
  const [state, action, pending] = useActionState(saveOverride, {} as ActionState);
  const e = state.fieldErrors ?? {};
  return (
    <AdminForm action={action} pending={pending} className="space-y-4">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="Date" name="date" type="date" required error={e.date} hint="Le vendredi pour l'allumage, le samedi pour la Havdala." className="sm:col-span-3" />
        <SelectField
          label="Quel horaire ?"
          name="kind"
          required
          options={[
            { value: "allumage", label: "Allumage des bougies" },
            { value: "havdala", label: "Havdala" },
          ]}
        />
        <TextField label="Nouvelle heure" name="time" type="time" required error={e.time} />
        <TextField label="Raison" name="note" placeholder="Ex. : office avancé" />
      </div>
      <SubmitButton>Remplacer l&apos;horaire</SubmitButton>
    </AdminForm>
  );
}
