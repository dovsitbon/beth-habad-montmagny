import type { StaticImageData } from "next/image";
import foule from "../../public/images/communaute/01-accueil-hanoucca-foule-nuit.jpg";
import concert from "../../public/images/communaute/02-hanoucca-scene-concert.jpg";
import guirlandes from "../../public/images/communaute/03-hanoucca-ambiance-guirlandes.jpg";
import menorahEnfants from "../../public/images/communaute/04-hanoucca-menorah-geante-enfants.jpg";
import allumage from "../../public/images/communaute/05-hanoucca-allumage-menorah.jpg";
import rabbin from "../../public/images/communaute/06-rabbin-discours-hanoucca.jpg";
import beignets from "../../public/images/communaute/07-hanoucca-stand-beignets-crepes.jpg";
import popcorn from "../../public/images/communaute/08-hanoucca-popcorn-enfants.jpg";
import cadeaux from "../../public/images/communaute/09-hanoucca-cadeaux-enfants.jpg";
import familles from "../../public/images/communaute/10-hanoucca-familles.jpg";
import sourires from "../../public/images/communaute/11-hanoucca-sourires.jpg";
import pourim from "../../public/images/communaute/12-pourim-enfants-deguises.jpg";
import repas from "../../public/images/communaute/13-repas-communautaire-salle.jpg";
import tefillin from "../../public/images/communaute/14-offices-tefillin-talit.jpg";
import conference from "../../public/images/communaute/15-cours-conference-salle-pleine.jpg";
import synagogue from "../../public/images/communaute/17-synagogue-groupe-devant-arche.jpg";
import cteen from "../../public/images/communaute/18-cteen-sortie-tour-eiffel.jpg";

export type CommunityPhoto = {
  src: StaticImageData;
  /** Texte alternatif (photo porteuse de sens). */
  alt: string;
  /** Légende courte (mosaïque de l'accueil). */
  caption: string;
};

/**
 * Photos de la communauté (public/images/communaute), importées statiquement :
 * Next.js connaît leurs dimensions et génère le placeholder flou.
 * Les photos gérées depuis l'admin (galerie, événements) restent dans Supabase.
 */
export const photos = {
  foule: { src: foule, alt: "La foule réunie de nuit dans la cour du Beth Habad pour Hanoucca", caption: "Hanoucca" },
  concert: { src: concert, alt: "Concert de Hanoucca sur une scène illuminée, devant le public", caption: "Hanoucca" },
  guirlandes: { src: guirlandes, alt: "Cour décorée de guirlandes lumineuses le soir de Hanoucca", caption: "Hanoucca" },
  menorahEnfants: { src: menorahEnfants, alt: "Trois enfants posent devant la grande ménorah dorée", caption: "Hanoucca" },
  allumage: { src: allumage, alt: "Allumage de la grande ménorah depuis le balcon", caption: "Hanoucca" },
  rabbin: { src: rabbin, alt: "Le rabbin prend la parole au micro lors de la fête de Hanoucca", caption: "Hanoucca" },
  beignets: { src: beignets, alt: "Stand de beignets et de crêpes pris d'assaut pendant Hanoucca", caption: "Hanoucca" },
  popcorn: { src: popcorn, alt: "Une fillette reçoit une friandise au stand de pop-corn", caption: "Hanoucca" },
  cadeaux: { src: cadeaux, alt: "Deux fillettes souriantes montrent leurs cadeaux de Hanoucca", caption: "Hanoucca" },
  familles: { src: familles, alt: "Des familles de la communauté réunies pour Hanoucca", caption: "En famille" },
  sourires: { src: sourires, alt: "Des jeunes femmes rient ensemble pendant la fête de Hanoucca", caption: "Hanoucca" },
  pourim: { src: pourim, alt: "Enfants déguisés pour Pourim dans la salle décorée de ballons bleus et blancs", caption: "Pourim" },
  repas: { src: repas, alt: "Repas communautaire dans la grande salle décorée de ballons", caption: "Repas communautaire" },
  tefillin: { src: tefillin, alt: "Un jeune homme met les téfilines, entouré de fidèles en talit", caption: "Offices" },
  conference: { src: conference, alt: "Salle comble pendant un cours", caption: "Cours" },
  synagogue: { src: synagogue, alt: "Un groupe de la communauté devant l'arche sainte de la synagogue", caption: "Synagogue" },
  cteen: { src: cteen, alt: "Les jeunes du CTeen en sortie au pied de la tour Eiffel", caption: "CTeen" },
} satisfies Record<string, CommunityPhoto>;
