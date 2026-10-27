import "server-only";
import { updateTag } from "next/cache";

/**
 * Met à jour immédiatement le site public après une modification dans l'admin.
 * Les noms de tags correspondent à ceux posés par les fonctions de lecture (src/lib/data/*).
 */
export function refreshSite(...tags: (string | null | undefined | false)[]) {
  for (const tag of new Set(tags.filter((t): t is string => Boolean(t)))) updateTag(tag);
}
