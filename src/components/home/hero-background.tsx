"use client";

import { useEffect, useState } from "react";
import Image, { type StaticImageData } from "next/image";

const VIDEO = "/video/hanoucca-allumage-boucle.mp4";

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

/** Vidéo seulement si l'utilisateur accepte les animations et que la connexion est correcte. */
function canPlayVideo() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (connection?.saveData) return false;
  return !["slow-2g", "2g", "3g"].includes(connection?.effectiveType ?? "");
}

/**
 * Fond de la bannière d'accueil.
 * La photo (préchargée, prioritaire, placeholder flou) s'affiche tout de suite et porte le LCP.
 * La vidéo n'est ajoutée qu'une fois la page entièrement chargée, pour ne rien ralentir,
 * puis apparaît en fondu quand elle joue : la photo lui sert d'affiche en attendant
 * (d'où l'absence d'attribut poster, qui resterait invisible).
 * En « réduire les animations » ou sur connexion lente : photo seule, avec un zoom lent
 * (Ken Burns) lui-même coupé en « réduire les animations ».
 */
export function HeroBackground({ image }: { image: StaticImageData }) {
  const [withVideo, setWithVideo] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!canPlayVideo()) return;
    const start = () => setWithVideo(true);
    if (document.readyState === "complete") {
      const timer = setTimeout(start, 0);
      return () => clearTimeout(timer);
    }
    window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);

  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
      <Image
        src={image}
        alt=""
        fill
        priority
        fetchPriority="high"
        placeholder="blur"
        sizes="100vw"
        quality={60}
        className={`object-cover ${playing ? "" : "ken-burns"}`}
      />
      {withVideo && (
        <video
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${playing ? "opacity-100" : "opacity-0"}`}
          src={VIDEO}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onPlaying={() => setPlaying(true)}
        />
      )}
      {/* Voile bleu de la charte : 88-90 % sous le texte, 65 % à droite sur grand écran. */}
      <div className="absolute inset-0 bg-night/88 lg:bg-transparent lg:bg-linear-to-r lg:from-night/90 lg:from-50% lg:to-night/65" />
    </div>
  );
}
