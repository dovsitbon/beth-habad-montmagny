"use server";

import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";

export async function toggleRead(form: FormData) {
  await requireMember();
  const supabase = await createSessionClient();
  const read = form.get("read") === "1";
  await supabase
    .from("contact_messages")
    .update({ read_at: read ? new Date().toISOString() : null })
    .eq("id", String(form.get("id")));
  redirect("/admin/messages");
}

export async function trashMessage(form: FormData) {
  await requireMember();
  const supabase = await createSessionClient();
  await supabase.from("contact_messages").update({ deleted_at: new Date().toISOString() }).eq("id", String(form.get("id")));
  redirect("/admin/messages?message=corbeille");
}
