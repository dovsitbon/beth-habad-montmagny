# Un seul projet Supabase pour tous les sites (multi-tenant)

Tous les sites clients et leurs espaces d'administration partagent **un seul projet Supabase**
(`cqoisssgvkvnovpzrugz`, organisation « Sites Beth Habad »), donc un seul abonnement.
Chaque site a son propre dépôt GitHub et son propre projet Vercel ; seules les données sont mutualisées.

## Principe

| Élément | Règle |
| --- | --- |
| Table `sites` | Un site client par ligne : `id`, `name`, `domain` (unique), `created_at`. |
| Données métier | **Toutes** les tables ont `site_id` (non nul, clé étrangère vers `sites`). Aucune donnée sans site. |
| Équipe | Table `user_sites` (`user_id`, `site_id`, `role` = `admin` / `editor`). Un même compte peut gérer plusieurs sites. |
| Site demandé | Chaque client Supabase de l'application envoie l'en-tête HTTP `x-site-id` = `NEXT_PUBLIC_SITE_ID`. La base le lit avec `public.request_site_id()`. |
| Visiteurs (anon) | Ne lisent que les contenus **publiés** du site demandé. Sans en-tête : rien. |
| Équipe (connectée) | Ne lit et ne modifie que les lignes du site demandé, **et** seulement si elle en est membre (`public.can_edit(site_id)`). Se connecter à l'admin d'un site dont on n'est pas membre ne donne accès à rien. |
| Serveur (clé secrète) | Contourne la RLS : chaque requête filtre elle-même `.eq("site_id", siteId())`. |
| Valeur par défaut | `site_id` vaut par défaut le site demandé : une insertion n'a rien à préciser. Une ligne ne peut jamais changer de site (déclencheur). |
| Liens entre tables | Clés étrangères composées (`event_id, site_id`…) : une inscription ne peut pas viser l'événement d'un autre site. |
| Photos (Storage) | Bucket central `media`, chemins `{site_id}/{catégorie}/{fichier}`. On n'écrit ou ne supprime que dans le dossier d'un site dont on est membre. Lecture publique (URL). |
| RLS | Activée sur 100 % des tables (vérifié par `npm run test:db`). |

Fonctions SQL utiles : `request_site_id()`, `has_site_role(site, rôles)`, `can_edit(site)`, `can_admin(site)`,
`is_editor()` / `is_admin()` (pour le site demandé).

## Variables d'environnement

Identiques pour tous les sites :

```
NEXT_PUBLIC_SUPABASE_URL=https://cqoisssgvkvnovpzrugz.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=…
SUPABASE_SECRET_KEY=…
```

Propres à chaque site :

```
NEXT_PUBLIC_SITE_ID=<id de la ligne dans « sites »>
NEXT_PUBLIC_SITE_URL=https://<domaine>
```

## Créer un nouveau site

Depuis ce dépôt (ou le dépôt du nouveau site, avec le même `.env.local` Supabase) :

```bash
node scripts/creer-site.mjs --nom "Beth Habad de Sarcelles" --court "Beth Habad Sarcelles" --domaine beth-habad-sarcelles.fr --lat 48.99 --lng 2.38 --admin rabbin@exemple.fr
```

`--essai` affiche ce qui serait créé sans rien écrire. Le script :

1. refuse si un site existe déjà pour ce domaine (rien n'est modifié) ;
2. crée la ligne `sites`, les paramètres publics et privés, les textes de départ (`[À COMPLÉTER]`) ;
3. crée (ou réutilise) le compte du premier administrateur et l'ajoute à l'équipe du site ;
4. affiche le `NEXT_PUBLIC_SITE_ID` à mettre dans `.env.local` et sur Vercel.

En cas d'échec à mi-chemin, le site tout juste créé est retiré (suppression en cascade). Les autres sites ne sont jamais touchés.

Ensuite : nouveau dépôt à partir de ce modèle, `NEXT_PUBLIC_SITE_ID` sur Vercel, déploiement.
Les administrateurs supplémentaires s'ajoutent depuis l'admin (Équipe) ou avec `node scripts/create-admin.mjs adresse@exemple.fr`.

## Faire évoluer le schéma

- Une nouvelle table métier prend **toujours** :
  `site_id uuid not null default public.request_site_id() references public.sites (id) on delete cascade`,
  un index sur `site_id`, la RLS activée et des politiques avec `site_id = (select public.request_site_id())`
  (lecture publique) ou `public.can_edit(site_id)` (équipe). Voir `20261028000002_notifications_telephone.sql`.
- Une unicité « métier » (slug, date…) se déclare par site : `unique (site_id, slug)`.
- Les migrations sont communes à tous les sites : elles s'appliquent une fois au projet partagé.
- `npm run test:db` rejoue toutes les migrations dans un Postgres en mémoire (PGlite) et vérifie
  l'isolation entre deux sites, sans toucher à la production. À lancer avant chaque `supabase db push`.

## Passage du site historique au multi-tenant (octobre 2026)

1. `supabase db push` : migration `20261028000001_multi_tenant.sql` (toutes les données existantes
   sont rattachées au site Montmagny, `dba8f5e4-8708-4700-bbae-11cd22048338`).
2. Déploiement du code (en-tête `x-site-id`, `NEXT_PUBLIC_SITE_ID` sur Vercel).
3. `node scripts/migrer-medias.mjs --go` : range les photos existantes sous `{site_id}/`.
