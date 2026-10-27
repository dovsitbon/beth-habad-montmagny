"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CaretLeftIcon, CaretRightIcon, XIcon } from "@phosphor-icons/react";

export type GridPhoto = { id: string; src: string; width: number | null; height: number | null; caption: string | null };

/**
 * Grille de photos + visionneuse plein écran.
 * <dialog> natif : focus piégé et touche Échap gérés par le navigateur ;
 * flèches du clavier et glissement du doigt pour passer d'une photo à l'autre.
 */
export function PhotoGrid({ photos, albumTitle }: { photos: GridPhoto[]; albumTitle: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const touchStart = useRef<number | null>(null);

  const open = (i: number) => {
    setIndex(i);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();
  const go = useCallback(
    (delta: number) => setIndex((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    const onClose = () => setIndex(null);
    dialog.addEventListener("keydown", onKey);
    dialog.addEventListener("close", onClose);
    return () => {
      dialog.removeEventListener("keydown", onKey);
      dialog.removeEventListener("close", onClose);
    };
  }, [go]);

  const current = index !== null ? photos[index] : null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {photos.map((photo, i) => (
          <li key={photo.id}>
            <button
              type="button"
              onClick={() => open(i)}
              className="relative block aspect-square w-full overflow-hidden rounded-lg bg-night-tint"
            >
              <Image
                src={photo.src}
                alt={photo.caption ?? `${albumTitle}, photo ${i + 1}`}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                // Les premières photos sont visibles dès l'ouverture : chargées tout de suite.
                priority={i < 4}
                className="object-cover transition-transform duration-300 hover:scale-[1.03]"
              />
              <span className="sr-only">Agrandir la photo {i + 1}</span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label={`Photo ${index !== null ? index + 1 : ""} sur ${photos.length}`}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-black/95 p-0 text-white backdrop:bg-black/80"
        onClick={(e) => e.target === dialogRef.current && close()}
        onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStart.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStart.current;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          touchStart.current = null;
        }}
      >
        {current && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-sm text-white/80" aria-live="polite">
                {index! + 1} / {photos.length}
              </p>
              <button
                type="button"
                onClick={close}
                autoFocus
                className="inline-flex size-12 items-center justify-center rounded-full hover:bg-white/10"
              >
                <XIcon weight="bold" className="size-6" aria-hidden />
                <span className="sr-only">Fermer</span>
              </button>
            </div>
            <div className="relative flex-1">
              <Image
                key={current.id}
                src={current.src}
                alt={current.caption ?? `${albumTitle}, photo ${index! + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <button
                type="button"
                onClick={() => go(-1)}
                className="inline-flex size-12 items-center justify-center rounded-full hover:bg-white/10"
              >
                <CaretLeftIcon weight="bold" className="size-6" aria-hidden />
                <span className="sr-only">Photo précédente</span>
              </button>
              <p className="flex-1 text-center text-sm text-white/85">{current.caption}</p>
              <button
                type="button"
                onClick={() => go(1)}
                className="inline-flex size-12 items-center justify-center rounded-full hover:bg-white/10"
              >
                <CaretRightIcon weight="bold" className="size-6" aria-hidden />
                <span className="sr-only">Photo suivante</span>
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
