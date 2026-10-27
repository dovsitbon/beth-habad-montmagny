"use client";

import { useActionState } from "react";
import { inviteMember } from "@/app/admin/(espace)/equipe/actions";
import type { ActionState } from "@/lib/admin/helpers";
import { AdminForm, FormMessage, SubmitButton, TextField } from "./fields";

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteMember, {} as ActionState);
  const e = state.fieldErrors ?? {};
  return (
    <AdminForm action={action} pending={pending} className="space-y-4">
      <FormMessage state={state} />
      <TextField label="Prénom et nom" name="fullName" required autoComplete="off" error={e.fullName} />
      <TextField label="Adresse e-mail" name="email" type="email" required autoComplete="off" error={e.email} />
      <SubmitButton variant="gold">Ajouter à l&apos;équipe</SubmitButton>
    </AdminForm>
  );
}
