/**
 * Configuration propre au client (un Beth Habad).
 *
 * Pour dupliquer le site pour un autre Beth Habad, on modifie ce fichier
 * puis on remplit la table `settings` dans Supabase (via l'admin).
 *
 * Règle : ici, uniquement des valeurs de départ ou qui ne changent jamais.
 * Tout ce que le rabbin doit pouvoir modifier vit dans la table `settings`,
 * qui a priorité sur ces valeurs dès qu'elle est remplie.
 */

export const siteConfig = {
  /** Identifiant technique court (sans espaces), utilisé pour les noms de fichiers, la PWA, etc. */
  slug: "montmagny",

  /** Nom officiel complet (tel qu'il figure sur le logo). */
  name: "Centre communautaire Beth Habad Montmagny · Groslay",
  /** Nom court (titre de l'accueil, onglets du navigateur). */
  shortName: "Beth Habad Montmagny · Groslay",
  /** Villes desservies, affichées sous « Beth Habad » dans l'en-tête et dans les textes. */
  area: ["Montmagny", "Groslay"],
  /** Phrase de présentation par défaut (SEO). */
  description:
    "Centre communautaire Beth Habad Montmagny · Groslay (Val-d'Oise) : horaires de Chabbat et des offices, événements, cours de Torah, CTeen et vie communautaire.",

  /** Texte de présentation de la bannière d'accueil, si la page « accueil » est vide (modifiable dans l'admin, Textes). */
  intro:
    "Un lieu chaleureux et ouvert à tous, au cœur de Montmagny et Groslay. Offices chaque jour, Chabbat, fêtes, cours de Torah et activités pour les enfants et les jeunes : ici, chacun trouve sa place.",

  /** URL publique du site (sans / final). Remplacée par la variable d'environnement si elle existe. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  locale: "fr-FR",
  timeZone: "Europe/Paris",

  /**
   * Adresse vérifiée dans la Base Adresse Nationale (api-adresse.data.gouv.fr) :
   * la voie s'écrit « Chemin de la Haie Barde ». Le « 4 bis » n'y est pas référencé,
   * les coordonnées sont celles du n° 4 (à confirmer par le Beth Habad).
   */
  address: {
    street: "4 bis, chemin de la Haie Barde",
    postalCode: "95360",
    city: "Montmagny",
    region: "Val-d'Oise",
    country: "FR",
  },
  geo: { latitude: 48.976809, longitude: 2.346422 },

  /** Coordonnées de contact. `null` = information encore inconnue, affichée comme « [À COMPLÉTER] ». */
  contact: {
    email: "mikelsitbon@gmail.com" as string | null,
    /** Affiché tel quel ; le lien tel: est construit au format international (+33…). */
    phone: "06 12 83 38 48" as string | null,
    /** Numéro WhatsApp au format international sans + ni espaces (ex. 33612345678). */
    whatsapp: "33612833848" as string | null,
  },

  /** Lien Allodons pour les dons. `null` tant qu'il n'a pas été fourni. */
  donationUrl: "https://www.allodons.fr/mikve-maayane-montmagny" as string | null,

  /** Couleurs de la charte (modifiables ensuite par l'admin). */
  colors: {
    /** Bleu du logo */
    primary: "#17418B",
    /** Or du logo */
    accent: "#CCAB5A",
  },
} as const;

export type SiteConfig = typeof siteConfig;

/** Liens de navigation principaux (ordre d'affichage). Un lien en https:// s'ouvre dans un nouvel onglet. */
export const mainNav = [
  { href: "/horaires", label: "Chabbat & fêtes" },
  { href: "/offices", label: "Offices" },
  { href: "/evenements", label: "Événements" },
  { href: "/cteen", label: "CTeen" },
  { href: "/cours", label: "Cours" },
  { href: "/galerie", label: "Galerie" },
  { href: "https://beth-habad-montmagny.fr/", label: "Mikvé" },
  { href: "/contact", label: "Contact" },
] as const;

/** « Montmagny · Groslay » (en-tête, logo). */
export const areaLabel = siteConfig.area.join(" · ");
/** « Montmagny et Groslay » (dans une phrase). */
export const areaProse =
  siteConfig.area.length > 1 ? `${siteConfig.area.slice(0, -1).join(", ")} et ${siteConfig.area.at(-1)}` : siteConfig.area[0];
