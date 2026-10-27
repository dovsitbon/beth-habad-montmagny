import type { Metadata } from "next";
import { siteConfig } from "@/config/site.config";
import Image from "next/image";
import Link from "next/link";
import { ImagesIcon } from "@phosphor-icons/react/ssr";
import { PageHeader } from "@/components/ui/page-header";
import { getAlbums } from "@/lib/data/content";
import { formatDayLong, mediaUrl } from "@/lib/format";

export const metadata: Metadata = {
  alternates: { canonical: "/galerie" },
  title: "Galerie photos",
  description: `Les photos des fêtes, repas et activités du ${siteConfig.name}.`,
};

export default async function GaleriePage() {
  const albums = await getAlbums();

  return (
    <>
      <PageHeader eyebrow="Souvenirs" title="Galerie photos">
        <p>Les moments partagés au Beth Habad, album par album.</p>
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {albums.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface px-5 py-12 text-center">
            <ImagesIcon aria-hidden className="mx-auto size-8 text-gold-ink" />
            <p className="mt-3 text-ink-muted">Les premiers albums arrivent bientôt.</p>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album, i) => (
              <li key={album.id}>
                <Link href={`/galerie/${album.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-night-tint">
                    {album.cover ? (
                      <Image
                        src={mediaUrl(album.cover.storage_path)}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        priority={i < 3}
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <ImagesIcon aria-hidden className="absolute inset-0 m-auto size-10 text-night/30" />
                    )}
                  </div>
                  <h2 className="mt-3 text-xl text-night group-hover:underline group-hover:decoration-gold group-hover:underline-offset-4">
                    {album.title}
                  </h2>
                  <p className="text-sm text-ink-muted">
                    {album.album_date && <span className="first-letter:uppercase">{formatDayLong(album.album_date, true)} · </span>}
                    {album.photoCount} photo{album.photoCount > 1 ? "s" : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
