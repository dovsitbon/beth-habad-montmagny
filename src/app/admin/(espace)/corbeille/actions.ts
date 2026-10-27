"use server";

import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { refreshSite } from "@/lib/admin/revalidate";

/** Tables qui ont une corbeille, et le cache du site à rafraîchir quand on restaure. */
const TRASHABLE = {
  events: "events",
  courses: "courses",
  announcements: "announcements",
  albums: "albums",
  service_times: "service_times",
  contact_messages: null,
} as const;

export async function restoreItem(form: FormData) {
  await requireMember();
  const table = String(form.get("table")) as keyof typeof TRASHABLE;
  if (!(table in TRASHABLE)) redirect("/admin/corbeille");

  const supabase = await createSessionClient();
  await supabase.from(table).update({ deleted_at: null }).eq("id", String(form.get("id")));
  refreshSite(TRASHABLE[table]);
  redirect("/admin/corbeille?message=restaure");
}
