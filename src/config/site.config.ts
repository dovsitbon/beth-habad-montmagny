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

  /** Nom complet affiché partout sur le site. */
  name: "Beth Habad de Montmagny",
  /** Nom court (onglet du navigateur, icône PWA). */
  shortName: "Beth Habad Montmagny",
  /** Phrase de présentation par défaut (SEO). */
  description:
    "Beth Habad de Montmagny (Val-d'Oise) : horaires de Chabbat et des offices, événements, cours de Torah, CTeen et vie communautaire.",

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
    /** E-mail de test : sera remplacé par celui du Beth Habad. */
    email: "dovbersitbon@gmail.com",
    phone: null as string | null,
    /** Numéro WhatsApp au format international sans + ni espaces (ex. 33612345678). */
    whatsapp: null as string | null,
  },

  /** Lien Allodons pour les dons. `null` tant qu'il n'a pas été fourni. */
  donationUrl: null as string | null,

  /** Couleurs de la charte (modifiables ensuite par l'admin). */
  colors: {
    /** Bleu nuit */
    primary: "#0F2444",
    /** Or */
    accent: "#C9A227",
  },
} as const;

export type SiteConfig = typeof siteConfig;

/** Liens de navigation principaux (ordre d'affichage). */
export const mainNav = [
  { href: "/horaires", label: "Chabbat & fêtes" },
  { href: "/offices", label: "Offices" },
  { href: "/evenements", label: "Événements" },
  { href: "/cteen", label: "CTeen" },
  { href: "/cours", label: "Cours" },
  { href: "/galerie", label: "Galerie" },
  { href: "/beth-habad", label: "Le Beth Habad" },
  { href: "/contact", label: "Contact" },
] as const;
