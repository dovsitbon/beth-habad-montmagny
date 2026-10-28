"use client";

import { useCallback, useEffect, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { CaretLeftIcon, CaretRightIcon, PauseIcon, PlayIcon } from "@phosphor-icons/react";

type Slide = { src: StaticImageData; alt: string };

const DELAY = 7000;

/**
 * Bannière d'accueil : carte arrondie, photos en fondu enchaîné (défilement lent),
 * compteur « 01 / 03 », flèches rondes et barre de progression.
 * La première photo est prioritaire (LCP), les autres se chargent ensuite.
 * Le défilement automatique est coupé si l'appareil demande moins d'animations.
 */
export function HeroCarousel({ slides, title, tagline }: { slides: Slide[]; title: string; tagline: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reduced, setReduced] = useState(false);
  const count = slides.length;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count]);
  const playing = !paused && !hovered && !reduced && count > 1;

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => go(1), DELAY);
    return () => clearTimeout(timer);
  }, [playing, index, go]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const round =
    "inline-flex size-11 items-center justify-center rounded-full bg-black/35 text-white ring-1 ring-white/40 transition-colors hover:bg-black/55";

  return (
    <section
      aria-roledescription="carrousel"
      aria-label="Photos de la communauté"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="relative isolate mx-auto h-[min(34svh,22rem)] min-h-[15rem] max-w-6xl overflow-hidden rounded-3xl bg-night shadow-[var(--shadow-lift)] sm:h-[30rem] lg:h-[34rem]"
    >
      {slides.map((slide, i) => (
        <div
          key={slide.src.src}
          role="group"
          aria-roledescription="photo"
          aria-label={`${i + 1} sur ${count}`}
          aria-hidden={i !== index}
          className={`absolute inset-0 -z-10 transition-opacity duration-1000 ${i === index ? "opacity-100" : "opacity-0"}`}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={i === 0}
            fetchPriority={i === 0 ? "high" : "low"}
            loading={i === 0 ? undefined : "lazy"}
            placeholder="blur"
            sizes="(min-width: 1152px) 1152px, 100vw"
            quality={60}
            className={`object-cover ${i === index ? "ken-burns" : ""}`}
          />
        </div>
      ))}
      {/* Voile sombre léger : texte blanc lisible (AA) sur toutes les photos. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-b from-black/45 via-black/35 to-black/60" />

      <div className="flex h-full flex-col items-center justify-center px-6 pb-10 text-center">
        <h1 className="max-w-4xl font-serif text-[1.9rem] leading-[1.08] font-black text-white sm:text-6xl lg:text-7xl">
          {title}
        </h1>
        <p className="mt-4 rounded-full bg-gold px-4 py-1.5 text-sm font-bold text-night-deep sm:mt-6 sm:px-5 sm:text-base">
          {tagline}
        </p>
      </div>

      {count > 1 && (
        <>
          <p aria-hidden className="absolute top-4 right-5 font-serif text-white sm:top-6 sm:right-7">
            <span className="text-2xl font-black sm:text-3xl">{pad(index + 1)}</span>
            <span className="ml-1 text-sm text-white/75">/ {pad(count)}</span>
          </p>

          <div aria-hidden className="absolute bottom-6 left-5 flex gap-1.5 sm:bottom-8 sm:left-7">
            {slides.map((s, i) => (
              <span key={s.src.src} className="h-1 w-8 overflow-hidden rounded-full bg-white/35 sm:w-10">
                {i < index && <span className="block h-full w-full bg-gold" />}
                {i === index && (
                  <span
                    key={`${index}-${playing}`}
                    className={`block h-full w-full origin-left bg-gold ${playing ? "carousel-progress" : ""}`}
                    style={playing ? { animationDuration: `${DELAY}ms` } : undefined}
                  />
                )}
              </span>
            ))}
          </div>

          <div className="absolute right-4 bottom-4 flex gap-2 sm:right-6 sm:bottom-6">
            {!reduced && (
              <button type="button" onClick={() => setPaused((p) => !p)} className={round}>
                {paused ? <PlayIcon aria-hidden weight="fill" className="size-4" /> : <PauseIcon aria-hidden weight="fill" className="size-4" />}
                <span className="sr-only">{paused ? "Relancer le défilement des photos" : "Arrêter le défilement des photos"}</span>
              </button>
            )}
            <button type="button" onClick={() => go(-1)} className={round}>
              <CaretLeftIcon aria-hidden weight="bold" className="size-5" />
              <span className="sr-only">Photo précédente</span>
            </button>
            <button type="button" onClick={() => go(1)} className={round}>
              <CaretRightIcon aria-hidden weight="bold" className="size-5" />
              <span className="sr-only">Photo suivante</span>
            </button>
          </div>
        </>
      )}
    </section>
  );
}
