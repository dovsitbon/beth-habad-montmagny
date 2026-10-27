# Site du Beth Habad de Montmagny

Site public et espace de gestion d'un Beth Habad, conçu pour être **entièrement administré depuis un téléphone** par une personne non technique. Il sert aussi de **modèle réutilisable** pour d'autres Beth Habad : on change la configuration, pas le code.

- **Site public** : accueil, horaires de Chabbat et des fêtes (calcul automatique), offices, agenda avec inscriptions, CTeen, cours, galerie, présentation, don (Allodons), contact, pages légales.
- **Espace de gestion** (`/admin`) : connexion par lien magique, rôles admin / éditeur, gestion de tous les contenus, photos prises au téléphone, inscriptions (CSV, WhatsApp), messages, corbeille 30 jours, aperçu, application installable sur l'écran d'accueil.

Documents complémentaires :

- [docs/guide-du-rabbin.md](docs/guide-du-rabbin.md) : mode d'emploi très simple pour le rabbin.
- [docs/checklist-mise-en-ligne.md](docs/checklist-mise-en-ligne.md) : tout ce qu'il faut demander au Beth Habad avant la mise en ligne.

---

## Sommaire

1. [Technologies](#technologies)
2. [Organisation du code](#organisation-du-code)
3. [Installation en local](#installation-en-local)
4. [Créer le projet Supabase](#créer-le-projet-supabase)
5. [Variables d'environnement](#variables-denvironnement)
6. [Migrations SQL et données d'exemple](#migrations-sql-et-données-dexemple)
7. [Créer le compte administrateur](#créer-le-compte-administrateur)
8. [Envoi des e-mails (indispensable)](#envoi-des-e-mails-indispensable)
9. [Déploiement sur Vercel](#déploiement-sur-vercel)
10. [Tests](#tests)
11. [Dupliquer le site pour un autre Beth Habad](#dupliquer-le-site-pour-un-autre-beth-habad)
12. [Fonctionnement : points importants](#fonctionnement--points-importants)

---

## Technologies

| Rôle | Outil |
|---|---|
| Framework | Next.js 16 (App Router, Cache Components) + TypeScript |
| Style | Tailwind CSS 4, polices Frank Ruhl Libre et Assistant (auto-hébergées) |
| Base de données, connexion, photos | Supabase (Postgres, Auth, Storage), RLS sur toutes les tables |
| Validation | Zod |
| Horaires juifs | API Hebcal (mise en cache 12 h) |
| E-mails | Resend (facultatif en développement) |
| Hébergement | Vercel (+ tâche planifiée quotidienne) |

## Organisation du code

```
src/
  config/site.config.ts      ← configuration propre au client (nom, adresse, GPS, couleurs…)
  app/(public)/              ← pages du site public
  app/admin/connexion/       ← connexion par lien magique (+ code)
  app/admin/(espace)/        ← espace de gestion (protégé)
  app/auth/confirm/          ← arrivée depuis le lien reçu par e-mail
  app/api/cron/purge/        ← purge quotidienne (corbeille, RGPD)
  app/sitemap.ts, robots.ts, llms.txt/, opengraph-image.tsx  ← SEO
  components/                ← composants (layout, admin, événements, galerie…)
  lib/data/                  ← lectures publiques mises en cache (tags invalidés par l'admin)
  lib/hebcal.ts              ← calcul des horaires de Chabbat et des fêtes
  lib/supabase/              ← clients Supabase (public, session, service, navigateur)
supabase/
  migrations/                ← schéma, RLS, fonctions, purge
  seed.sql                   ← données de départ et d'EXEMPLE
  templates/                 ← e-mail de connexion, mentions légales, confidentialité
scripts/                     ← création de l'admin, tests RLS, tests de bout en bout
docs/                        ← guide du rabbin, checklist
```

## Installation en local

Prérequis : Node.js 20 ou plus récent, un compte Supabase.

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs (voir plus bas)
npm run dev                  # http://localhost:3000
```

> Sous Windows PowerShell, si `npx` est bloqué (« l'exécution de scripts est désactivée »), utilisez `npx.cmd`.

## Créer le projet Supabase

Avec le CLI (inclus dans les dépendances de développement) :

```bash
npx supabase login
npx supabase orgs list                         # repérer l'identifiant de l'organisation
npx supabase projects create beth-habad-<ville> --org-id <org-id> --region eu-west-3 --db-password "<mot de passe fort>"
npx supabase link --project-ref <project-ref> -p "<mot de passe>"
```

Puis récupérer les clés : `npx supabase projects api-keys --project-ref <project-ref> --reveal` (utiliser la clé **publishable** et la clé **secret**).

Réglages d'authentification (fichier `supabase/config.toml`, envoyés avec `npx supabase config push`) :

- inscriptions publiques **fermées** (`[auth] enable_signup = false`) : un compte n'existe que s'il a été ajouté dans l'admin ;
- `[auth.email] enable_signup` doit rester à **true** (sinon la connexion par e-mail est désactivée) ;
- `site_url` et `additional_redirect_urls` doivent contenir l'adresse du site (local et production).

## Variables d'environnement

Voir [.env.example](.env.example). À renseigner dans `.env.local` (local) et dans Vercel (production).

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Adresse publique du site, sans `/` final (sitemap, liens, e-mails) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé publique (protégée par la RLS) |
| `SUPABASE_SECRET_KEY` | Clé secrète, **serveur uniquement** (formulaires publics, invitations, purge) |
| `CRON_SECRET` | Secret de la tâche planifiée `/api/cron/purge` (Vercel l'envoie automatiquement) |
| `RATE_LIMIT_SALT` | Sel pour hacher les adresses IP (anti-spam) |
| `RESEND_API_KEY`, `EMAIL_FROM` | Envoi des notifications (inscriptions, messages, invitations) |
| `TEST_EDITOR_EMAIL`, `TEST_EDITOR_PASSWORD` | Tests de bout en bout uniquement (jamais en production) |

Ne jamais committer `.env.local` (il est ignoré par git).

## Migrations SQL et données d'exemple

```bash
npx supabase db push --linked --include-seed
npm run db:types            # régénère src/lib/supabase/database.types.ts
```

- `supabase/migrations/…_schema.sql` : tables, RLS, fonctions (inscription avec contrôle des places, limitation de débit), bucket `media`.
- `supabase/migrations/…_purge.sql` : purge (corbeille > 30 jours, inscriptions 6 mois après l'événement, messages après 2 ans).
- `supabase/seed.sql` : paramètres, textes des pages (`[À COMPLÉTER]`) et contenus **[EXEMPLE]** à supprimer avant la mise en ligne.

## Créer le compte administrateur

```bash
node scripts/create-admin.mjs prenom.nom@exemple.fr
```

L'administrateur ajoute ensuite le rabbin depuis **Admin → Équipe** (rôle éditeur). Chacun se connecte sur `/admin` avec son adresse e-mail, sans mot de passe.

## Envoi des e-mails (indispensable)

Sans configuration, Supabase n'envoie les e-mails de connexion **qu'aux membres de l'organisation Supabase** (et 2 par heure au maximum) : le rabbin ne pourrait pas se connecter.

1. Créer un compte [Resend](https://resend.com) et **vérifier un domaine** (par exemple le domaine du Beth Habad, ou le vôtre pour tous vos clients).
2. Dans Supabase → **Authentication → SMTP**, renseigner le SMTP de Resend (`smtp.resend.com`, port 465, utilisateur `resend`, mot de passe = clé API).
3. Décommenter dans `supabase/config.toml` la section `[auth.email.template.magic_link]` puis `npx supabase config push` : l'e-mail de connexion passe en français avec un **code à saisir** (pratique depuis l'application installée sur le téléphone).
4. Renseigner `RESEND_API_KEY` et `EMAIL_FROM` dans Vercel pour les notifications.

## Déploiement sur Vercel

1. Pousser le dépôt sur GitHub, puis l'importer dans Vercel (chaque `git push` sur `main` redéploie le site).
2. Ajouter les variables d'environnement ci-dessus (Production).
3. La tâche planifiée est déclarée dans [vercel.json](vercel.json) (tous les jours à 3 h, heure UTC).
4. Dans Supabase, ajouter l'adresse de production : `site_url` et `additional_redirect_urls` (`https://<domaine>/**`), puis `npx supabase config push`.
5. Vérifier : la page d'accueil, `/horaires`, `/sitemap.xml`, la connexion `/admin`.

## Tests

```bash
npm run lint
npm run test:rls   # 33 vérifications des règles de sécurité (visiteur, éditeur, serveur)
npm run test:e2e   # 40 vérifications de l'admin dans Edge, format téléphone (serveur local requis)
```

Les tests créent puis suppriment leurs propres données (préfixées `[E2E]`) et leur compte de test.

## Dupliquer le site pour un autre Beth Habad

1. Copier le dépôt (ou utiliser GitHub « Use this template »).
2. Modifier [src/config/site.config.ts](src/config/site.config.ts) : nom, ville, adresse, coordonnées GPS, e-mail, couleurs.
3. Adapter `supabase/seed.sql` (paramètres de départ) et les modèles de `supabase/templates/` (mentions légales, confidentialité).
4. Créer un nouveau projet Supabase, appliquer les migrations, créer l'admin, puis un nouveau projet Vercel.
5. Tout le reste (textes, horaires, logo, couleurs, liens) se règle ensuite **dans l'admin**.

## Fonctionnement : points importants

- **Mises à jour immédiates** : les pages publiques sont mises en cache ; chaque action de l'admin invalide le tag concerné (`updateTag`), le site est à jour aussitôt.
- **Horaires de Chabbat** : calculés par Hebcal pour la position GPS, fuseau Europe/Paris. Les heures saisies à la main dans l'admin remplacent le calcul pour la date concernée.
- **Sécurité** : RLS sur toutes les tables ; les visiteurs ne lisent que les contenus publiés ; les formulaires publics passent par le serveur (Zod, pot de miel, délai minimal, limite par IP hachée). Le logo, les couleurs, la position GPS et les rôles sont réservés à l'administrateur, y compris au niveau de la base.
- **RGPD** : aucun cookie de suivi ; inscriptions supprimées 6 mois après l'événement ; messages au bout de 2 ans.
- **Contenus** : rien n'est inventé ; les informations manquantes s'affichent `[À COMPLÉTER]`, les données de démonstration sont marquées `[EXEMPLE]`.
