"use server";

import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { refreshSite } from "@/lib/admin/revalidate";

export async function deleteRegistration(form: FormData) {
  await requireMember();
  const id = String(form.get("id"));
  const eventId = String(form.get("eventId"));
  const supabase = await createSessionClient();
  await supabase.from("registrations").delete().eq("id", id);
  // Les places libérées s'affichent tout de suite sur le site.
  refreshSite(`seats:${eventId}`);
  redirect(`/admin/inscriptions/${eventId}?message=supprime`);
}
