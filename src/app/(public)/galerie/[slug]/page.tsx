import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { getAlbumBySlug, getAlbumSlugs } from "@/lib/data/content";
import { formatDayLong, mediaUrl } from "@/lib/format";
import { PhotoGrid } from "@/components/gallery/photo-grid";

export async function generateStaticParams() {
  const slugs = await getAlbumSlugs();
  // Cache Components exige au moins un paramètre ; un slug inconnu renvoie une 404.
  return slugs.length > 0 ? slugs.map((slug) => ({ slug })) : [{ slug: "aucun-album" }];
}

export async function generateMetadata({ params }: PageProps<"/galerie/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getAlbumBySlug(slug);
  if (!result) return { title: "Album introuvable" };
  return {
    title: result.album.title,
    alternates: { canonical: `/galerie/${slug}` },
    description: result.album.description ?? `Photos : ${result.album.title}`,
    openGraph: result.photos[0] ? { images: [mediaUrl(result.photos[0].storage_path)] } : undefined,
  };
}

export default function AlbumPage({ params }: PageProps<"/galerie/[slug]">) {
  return (
    <Suspense fallback={<div aria-busy="true" className="h-64 bg-night" />}>
      <AlbumContent params={params} />
    </Suspense>
  );
}

async function AlbumContent({ params }: { params: PageProps<"/galerie/[slug]">["params"] }) {
  const { slug } = await params;
  const result = await getAlbumBySlug(slug);
  if (!result) notFound();
  const { album, photos } = result;

  return (
    <>
      <div className="relative bg-night text-white">
        <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gold" />
        <div className="mx-auto max-w-6xl px-4 pt-8 pb-12 sm:px-6 sm:pt-10">
          <Link href="/galerie" className="inline-flex min-h-11 items-center gap-2 font-semibold text-gold-soft hover:text-white">
            <ArrowLeftIcon aria-hidden weight="bold" className="size-4" />
            Galerie
          </Link>
          <h1 className="mt-2 max-w-3xl text-4xl font-semibold text-white sm:text-5xl">{album.title}</h1>
          <p className="mt-3 text-white/80">
            {album.album_date && <span className="first-letter:uppercase">{formatDayLong(album.album_date, true)} · </span>}
            {photos.length} photo{photos.length > 1 ? "s" : ""}
          </p>
          {album.description && <p className="mt-4 max-w-2xl text-lg text-white/85">{album.description}</p>}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {photos.length === 0 ? (
          <p className="text-ink-muted">Cet album ne contient pas encore de photos.</p>
        ) : (
          <PhotoGrid
            albumTitle={album.title}
            photos={photos.map((p) => ({
              id: p.id,
              src: mediaUrl(p.storage_path),
              width: p.width,
              height: p.height,
              caption: p.caption,
            }))}
          />
        )}
      </div>
    </>
  );
}
