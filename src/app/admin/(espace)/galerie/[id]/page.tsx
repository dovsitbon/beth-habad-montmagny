import Image from "next/image";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/format";
import { AdminPage, Flash, StatusBadge } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/fields";
import { AlbumForm } from "@/components/admin/album-form";
import { PhotoUploader } from "@/components/admin/photo-uploader";
import { deletePhoto, setCover, trashAlbum } from "../actions";

export const instant = false;
export const metadata = { title: "Album photo" };

export default async function AdminAlbumPage({ params, searchParams }: PageProps<"/admin/galerie/[id]">) {
  await requireMember();
  const [{ id }, { message }] = await Promise.all([params, searchParams]);
  const supabase = await createSessionClient();
  const [{ data: album }, { data: photos }] = await Promise.all([
    supabase.from("albums").select("*").eq("id", id).is("deleted_at", null).maybeSingle(),
    supabase.from("photos").select("*").eq("album_id", id).order("sort_order"),
  ]);
  if (!album) redirect("/admin/galerie?message=introuvable");
  const list = photos ?? [];
  const coverId = album.cover_photo_id ?? list[0]?.id;

  return (
    <AdminPage title={album.title} backHref="/admin/galerie" backLabel="Galerie photos">
      <Flash code={message} />
      {message === "cree" && (
        <p className="-mt-3 mb-6 text-ink-muted">L&apos;album est créé en brouillon. Ajoutez des photos, puis appuyez sur « Publier l&apos;album ».</p>
      )}

      <PhotoUploader albumId={album.id} />

      <section aria-labelledby="photos" className="mt-8">
        <h2 id="photos" className="mb-3 text-2xl text-night">
          {list.length} photo{list.length > 1 ? "s" : ""}
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {list.map((p, i) => (
            <li key={p.id} className="rounded-xl border border-line bg-surface p-2">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-night-tint">
                <Image src={mediaUrl(p.storage_path)} alt={`Photo ${i + 1}`} fill sizes="(min-width: 640px) 33vw, 50vw" className="object-cover" />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.id === coverId ? (
                  <StatusBadge tone="gold">Couverture</StatusBadge>
                ) : (
                  <ActionButton action={setCover} hidden={{ id: p.id, albumId: album.id }}>
                    Couverture
                  </ActionButton>
                )}
                <ActionButton action={deletePhoto} hidden={{ id: p.id, albumId: album.id }} confirm="Supprimer définitivement cette photo ?">
                  Supprimer
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="infos" className="mt-10 rounded-xl border border-line bg-surface p-4">
        <h2 id="infos" className="mb-4 text-2xl text-night">
          Informations de l&apos;album
        </h2>
        <AlbumForm
          values={{
            id: album.id,
            title: album.title,
            date: album.album_date ?? "",
            description: album.description ?? "",
            status: album.status,
          }}
        />
      </section>

      <div className="mt-8">
        <ActionButton
          action={trashAlbum}
          hidden={{ id: album.id }}
          variant="danger"
          confirm={`Mettre l'album « ${album.title} » et ses photos à la corbeille ? Vous pourrez le récupérer pendant 30 jours.`}
        >
          Mettre l&apos;album à la corbeille
        </ActionButton>
      </div>
    </AdminPage>
  );
}
