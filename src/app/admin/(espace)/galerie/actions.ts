"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { refreshSite } from "@/lib/admin/revalidate";
import { type ActionState, dateField, invalid, shortId, slugify, TECH_ERROR } from "@/lib/admin/helpers";

const albumSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, "Indiquez un titre.").max(200),
  date: z.string().refine((v) => v === "" || dateField.test(v), "Date invalide."),
  description: z.string().trim().max(500),
  intent: z.enum(["publish", "draft"]),
});

export async function saveAlbum(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireMember();
  const parsed = albumSchema.safeParse({
    id: form.get("id") || undefined,
    title: form.get("title"),
    date: form.get("date") ?? "",
    description: form.get("description") ?? "",
    intent: form.get("intent") ?? "publish",
  });
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const row = {
    title: v.title,
    album_date: v.date || null,
    description: v.description || null,
    status: v.intent === "publish" ? ("published" as const) : ("draft" as const),
  };

  const supabase = await createSessionClient();
  if (v.id) {
    const { data, error } = await supabase.from("albums").update(row).eq("id", v.id).select("slug").single();
    if (error) return TECH_ERROR;
    refreshSite("albums", `album:${data.slug}`);
    return { ok: true, message: row.status === "published" ? "Album enregistré et visible sur le site." : "Album enregistré (non visible sur le site)." };
  }

  let slug = slugify(v.title);
  if ((await supabase.from("albums").select("id").eq("slug", slug).maybeSingle()).data) slug = `${slug}-${shortId()}`;
  // Un nouvel album naît toujours en brouillon : on le publie une fois les photos ajoutées.
  const { data, error } = await supabase
    .from("albums")
    .insert({ ...row, status: "draft", slug })
    .select("id")
    .single();
  if (error) {
    console.error("Création de l'album impossible :", error);
    return TECH_ERROR;
  }
  refreshSite("albums");
  // On enchaîne directement sur l'ajout des photos.
  redirect(`/admin/galerie/${data.id}?message=cree`);
}

const photosSchema = z.array(
  z.object({ path: z.string().min(1).max(300), width: z.number().int().min(0), height: z.number().int().min(0) }),
);

/** Enregistre les photos tout juste envoyées dans le stockage (appelée depuis le navigateur). */
export async function addPhotos(albumId: string, photos: { path: string; width: number; height: number }[]) {
  await requireMember();
  const parsed = photosSchema.safeParse(photos);
  if (!parsed.success || !z.uuid().safeParse(albumId).success) return { ok: false };

  const supabase = await createSessionClient();
  const { count } = await supabase.from("photos").select("id", { count: "exact", head: true }).eq("album_id", albumId);
  const { error } = await supabase.from("photos").insert(
    parsed.data.map((p, i) => ({
      album_id: albumId,
      storage_path: p.path,
      width: p.width || null,
      height: p.height || null,
      sort_order: (count ?? 0) + i + 1,
    })),
  );
  if (error) {
    console.error("Enregistrement des photos impossible :", error);
    return { ok: false };
  }
  const { data: album } = await supabase.from("albums").select("slug").eq("id", albumId).single();
  refreshSite("albums", album && `album:${album.slug}`);
  return { ok: true };
}

export async function deletePhoto(form: FormData) {
  await requireMember();
  const id = String(form.get("id"));
  const albumId = String(form.get("albumId"));
  const supabase = await createSessionClient();
  const { data: photo } = await supabase.from("photos").delete().eq("id", id).select("storage_path").maybeSingle();
  if (photo) await supabase.storage.from("media").remove([photo.storage_path]);
  const { data: album } = await supabase.from("albums").select("slug").eq("id", albumId).single();
  refreshSite("albums", album && `album:${album.slug}`);
  redirect(`/admin/galerie/${albumId}?message=supprime`);
}

export async function setCover(form: FormData) {
  await requireMember();
  const albumId = String(form.get("albumId"));
  const supabase = await createSessionClient();
  const { data: album } = await supabase
    .from("albums")
    .update({ cover_photo_id: String(form.get("id")) })
    .eq("id", albumId)
    .select("slug")
    .single();
  refreshSite("albums", album && `album:${album.slug}`);
  redirect(`/admin/galerie/${albumId}?message=enregistre`);
}

export async function trashAlbum(form: FormData) {
  await requireMember();
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("albums")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", String(form.get("id")))
    .select("slug")
    .maybeSingle();
  refreshSite("albums", data && `album:${data.slug}`);
  redirect("/admin/galerie?message=corbeille");
}
