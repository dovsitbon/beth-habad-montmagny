import Image from "next/image";
import Link from "next/link";
import { ImagesIcon } from "@phosphor-icons/react/ssr";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { formatDayLong, mediaUrl } from "@/lib/format";
import { AdminPage, Flash, StatusBadge } from "@/components/admin/ui";
import { AlbumForm } from "@/components/admin/album-form";

export const instant = false;
export const metadata = { title: "Galerie photos" };

export default async function AdminGalleryPage({ searchParams }: PageProps<"/admin/galerie">) {
  await requireMember();
  const { message } = await searchParams;
  const supabase = await createSessionClient();
  const { data: albums } = await supabase
    .from("albums")
    .select("id, title, album_date, status, cover_photo_id, photos!photos_album_id_fkey(id, storage_path, sort_order)")
    .is("deleted_at", null)
    .order("album_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <AdminPage title="Galerie photos">
      <Flash code={message} />

      <details className="mb-6 rounded-xl border-2 border-dashed border-gold bg-surface p-4" open={!albums?.length}>
        <summary className="cursor-pointer text-lg font-bold text-night">Créer un nouvel album</summary>
        <div className="mt-4">
          <AlbumForm values={{ title: "", date: "", description: "", status: "draft" }} />
        </div>
      </details>

      <p className="mb-3 text-ink-muted">Pour ajouter des photos à un album existant, ouvrez-le :</p>
      <ul className="grid grid-cols-2 gap-3">
        {(albums ?? []).map((a) => {
          const photos = [...a.photos].sort((x, y) => x.sort_order - y.sort_order);
          const cover = photos.find((p) => p.id === a.cover_photo_id) ?? photos[0];
          return (
            <li key={a.id}>
              <Link href={`/admin/galerie/${a.id}`} className="block rounded-xl border border-line bg-surface p-2 hover:border-gold">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-night-tint">
                  {cover ? (
                    <Image src={mediaUrl(cover.storage_path)} alt="" fill sizes="50vw" className="object-cover" />
                  ) : (
                    <ImagesIcon aria-hidden className="absolute inset-0 m-auto size-8 text-night/30" />
                  )}
                </div>
                <p className="mt-2 leading-snug font-bold text-night">{a.title}</p>
                <p className="text-sm text-ink-muted">
                  {a.album_date ? formatDayLong(a.album_date, true) : "Sans date"} · {photos.length} photo{photos.length > 1 ? "s" : ""}
                </p>
                <div className="mt-1">
                  {a.status === "published" ? <StatusBadge tone="green">Publié</StatusBadge> : <StatusBadge tone="gray">Brouillon</StatusBadge>}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </AdminPage>
  );
}
