"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { refreshSite } from "@/lib/admin/revalidate";
import { type ActionState, cleanHtml, invalid, TECH_ERROR } from "@/lib/admin/helpers";

const schema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(2, "Indiquez un titre.").max(120),
  body: z.string(),
  imagePath: z.string().max(300),
});

export async function savePage(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireMember();
  const parsed = schema.safeParse({
    slug: form.get("slug"),
    title: form.get("title"),
    body: form.get("body") ?? "",
    imagePath: form.get("imagePath") ?? "",
  });
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;

  const supabase = await createSessionClient();
  const { data: before } = await supabase.from("pages").select("image_path").eq("slug", v.slug).maybeSingle();
  const { error } = await supabase
    .from("pages")
    .update({ title: v.title, body: cleanHtml(v.body), image_path: v.imagePath || null })
    .eq("slug", v.slug);
  if (error) {
    console.error("Enregistrement de la page impossible :", error);
    return TECH_ERROR;
  }
  if (before?.image_path && before.image_path !== v.imagePath) {
    await supabase.storage.from("media").remove([before.image_path]);
  }
  refreshSite("pages", `page:${v.slug}`);
  redirect("/admin/textes?message=publie");
}
