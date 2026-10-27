"use client";

import { useActionState } from "react";
import { saveShabbatRules } from "@/app/admin/(espace)/horaires-chabbat/actions";
import type { ActionState } from "@/lib/admin/helpers";
import type { ScheduleRules } from "@/lib/horaires/calcul";
import { AdminForm, FormMessage, SelectField, SubmitButton, TextField } from "./fields";

const MODE_OPTIONS = [
  { value: "fixe", label: "À heure fixe" },
  { value: "avant_fin", label: "Un nombre de minutes avant la Fin" },
];

/** Règles de calcul : ce que la page « Ce Chabbat » propose par défaut chaque semaine. */
export function ShabbatRulesForm({ rules }: { rules: ScheduleRules }) {
  const [state, action, pending] = useActionState(saveShabbatRules, {} as ActionState);
  const e = state.fieldErrors ?? {};
  const hhmm = (t: string) => t.slice(0, 5);
  return (
    <AdminForm action={action} pending={pending} className="space-y-8">
      <FormMessage state={state} />

      <Group title="Vendredi soir">
        <TextField
          label="Allumage : minutes avant le coucher du soleil"
          name="candleMinutes"
          type="number"
          inputMode="numeric"
          min={0}
          max={60}
          required
          defaultValue={String(rules.candleMinutes)}
          error={e.candleMinutes}
          className="max-w-xs"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Minha suivi d'Arvit : minutes après l'allumage"
            name="fridayMinhaOffset"
            type="number"
            inputMode="numeric"
            min={0}
            max={60}
            required
            defaultValue={String(rules.fridayMinhaOffset)}
            error={e.fridayMinhaOffset}
          />
          <SelectField
            label="… arrondi aux"
            name="fridayMinhaRounding"
            required
            defaultValue={String(rules.fridayMinhaRounding)}
            options={[
              { value: "1", label: "minutes près (pas d'arrondi)" },
              { value: "5", label: "5 minutes supérieures" },
              { value: "10", label: "10 minutes supérieures" },
              { value: "15", label: "15 minutes supérieures" },
            ]}
          />
        </div>
        <p className="text-sm text-ink-muted">Exemple : allumage 18h28, + 2 min, arrondi aux 5 min → Minha 18h30.</p>
      </Group>

      <Group title="Chabbat matin">
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Tania" name="taniaTime" type="time" required defaultValue={hhmm(rules.taniaTime)} error={e.taniaTime} />
          <TextField label="Chaharit" name="chaharitTime" type="time" required defaultValue={hhmm(rules.chaharitTime)} error={e.chaharitTime} />
        </div>
      </Group>

      <Group title="Chabbat après-midi">
        <ModeFields
          label="Cours"
          prefix="cours"
          mode={rules.coursBeforeEnd === null ? "fixe" : "avant_fin"}
          time={hhmm(rules.coursTime)}
          before={rules.coursBeforeEnd ?? 90}
          errors={e}
        />
        <ModeFields
          label="Minha"
          prefix="minha"
          mode={rules.minhaBeforeEnd === null ? "fixe" : "avant_fin"}
          time={hhmm(rules.minhaTime)}
          before={rules.minhaBeforeEnd ?? 30}
          errors={e}
        />
        <p className="text-sm text-ink-muted">
          « Avant la Fin » suit les saisons (l&apos;heure est arrondie aux 5 minutes inférieures). Une heure fixe ne bouge
          pas : en hiver, vérifiez qu&apos;elle reste avant la Fin.
        </p>
      </Group>

      <Group title="Fin de Chabbat">
        <SelectField
          label="Heure de la Fin"
          name="havdalah"
          required
          defaultValue={rules.havdalahMinutes === null ? "nuit" : String(rules.havdalahMinutes)}
          options={[
            { value: "nuit", label: "À la tombée de la nuit (8,5° sous l'horizon)" },
            { value: "42", label: "42 minutes après le coucher du soleil" },
            { value: "50", label: "50 minutes après le coucher du soleil" },
            { value: "72", label: "72 minutes après le coucher du soleil" },
          ]}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Marge ajoutée à la Fin (minutes)"
            name="endMargin"
            type="number"
            inputMode="numeric"
            min={0}
            max={15}
            required
            defaultValue={String(rules.endMarginMinutes)}
            hint="La Fin est déjà arrondie à la minute supérieure."
            error={e.endMargin}
          />
          <TextField
            label="Arvit : minutes après la Fin"
            name="arvitAfterEnd"
            type="number"
            inputMode="numeric"
            min={0}
            max={60}
            required
            defaultValue={String(rules.arvitAfterEnd)}
            error={e.arvitAfterEnd}
          />
        </div>
      </Group>

      <SubmitButton>Enregistrer les règles de calcul</SubmitButton>
    </AdminForm>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 text-xl text-night">{title}</legend>
      {children}
    </fieldset>
  );
}

function ModeFields({
  label,
  prefix,
  mode,
  time,
  before,
  errors,
}: {
  label: string;
  prefix: "cours" | "minha";
  mode: "fixe" | "avant_fin";
  time: string;
  before: number;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-line p-3">
      <SelectField label={label} name={`${prefix}Mode`} required defaultValue={mode} options={MODE_OPTIONS} />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Heure fixe" name={`${prefix}Time`} type="time" required defaultValue={time} error={errors[`${prefix}Time`]} />
        <TextField
          label="Minutes avant la Fin"
          name={`${prefix}BeforeEnd`}
          type="number"
          inputMode="numeric"
          min={5}
          max={240}
          required
          defaultValue={String(before)}
          error={errors[`${prefix}BeforeEnd`]}
        />
      </div>
    </div>
  );
}
