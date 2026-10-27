// Constantes partagées entre composants serveur et client (hors fichier « use client »).
export const OFFICE_OPTIONS = [
  { value: "chaharit", label: "Chaharit" },
  { value: "minha", label: "Minha" },
  { value: "arvit", label: "Arvit" },
];
// Vendredi soir et Chabbat : calculés chaque semaine dans la page « Ce Chabbat ».
export const DAY_OPTIONS = [
  { value: "semaine", label: "Du lundi au vendredi" },
  { value: "dimanche", label: "Dimanche" },
  { value: "fete", label: "Jours de fête" },
];
