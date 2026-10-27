"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraPlusIcon } from "@phosphor-icons/react";
import { addPhotos } from "@/app/admin/(espace)/galerie/actions";
import { compressAndUpload } from "@/lib/image-upload";
import { btn } from "./styles";

/**
 * Ajout de photos à un album : plusieurs à la fois, depuis l'appareil photo ou la galerie du téléphone.
 * Chaque photo est compressée puis envoyée l'une après l'autre (plus fiable sur une connexion mobile).
 */
export function PhotoUploader({ albumId }: { albumId: string }) {
  const id = useId();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    setResult(null);
    setProgress({ done: 0, total: list.length });

    const uploaded: { path: string; width: number; height: number }[] = [];
    let failed = 0;
    for (const file of list) {
      try {
        uploaded.push(await compressAndUpload(file, `albums/${albumId}`));
      } catch {
        failed++;
      }
      setProgress({ done: uploaded.length + failed, total: list.length });
    }

    const saved = uploaded.length ? await addPhotos(albumId, uploaded) : { ok: true };
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";

    if (!saved.ok) {
      setResult({ ok: false, text: "Les photos ont été envoyées mais pas enregistrées. Réessayez." });
    } else if (failed) {
      setResult({ ok: false, text: `${uploaded.length} photo(s) ajoutée(s), ${failed} n'ont pas pu être envoyées. Réessayez pour celles-ci.` });
    } else {
      setResult({ ok: true, text: `${uploaded.length} photo${uploaded.length > 1 ? "s ajoutées" : " ajoutée"} à l'album.` });
    }
    router.refresh();
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-gold bg-surface p-5 text-center">
      <label htmlFor={id} className={`${btn.gold} w-full cursor-pointer text-lg sm:w-auto ${progress ? "pointer-events-none opacity-60" : ""}`}>
        <CameraPlusIcon aria-hidden weight="bold" className="size-6" />
        {progress ? "Envoi en cours…" : "Ajouter des photos"}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        disabled={!!progress}
        onChange={(e) => onFiles(e.target.files)}
      />
      <p className="mt-2 text-sm text-ink-muted">Prenez une photo ou choisissez-en plusieurs dans votre galerie.</p>

      {progress && (
        <div className="mt-4" role="status">
          <p className="font-semibold">
            Photo {Math.min(progress.done + 1, progress.total)} sur {progress.total}…
          </p>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-night-tint">
            <div className="h-full bg-gold transition-[width]" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
          <p className="mt-2 text-sm text-ink-muted">Gardez cette page ouverte jusqu&apos;à la fin.</p>
        </div>
      )}
      {result && (
        <p role={result.ok ? "status" : "alert"} className={`mt-4 font-semibold ${result.ok ? "text-[#2C5530]" : "text-red-800"}`}>
          {result.text}
        </p>
      )}
    </div>
  );
}
