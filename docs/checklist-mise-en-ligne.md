# Checklist avant la mise en ligne

Ce qu'il faut **demander au Beth Habad** et **faire techniquement** avant d'ouvrir le site au public. Rien n'a été inventé : tout ce qui manque apparaît sur le site avec la mention `[À COMPLÉTER]`.

## À demander au Beth Habad

### Identité et coordonnées
- [ ] Nom officiel exact du Beth Habad (tel qu'il doit apparaître partout)
- [ ] **Adresse exacte** : confirmer « 4 bis, chemin de la Haie Barde, 95360 Montmagny » et la **position du point sur la carte** (le « 4 bis » n'existe pas dans la Base Adresse Nationale, la carte pointe le n° 4)
- [ ] Téléphone à afficher
- [ ] Numéro WhatsApp (pour le bouton « Écrire sur WhatsApp »)
- [ ] E-mail public à afficher sur le site
- [ ] E-mail qui recevra les **inscriptions et messages** (peut être différent, jamais affiché)
- [ ] Liens des réseaux sociaux (Facebook, Instagram, YouTube…)
- [ ] **Lien Allodons** pour les dons

### Le rabbin et l'équipe
- [ ] Nom, prénom et adresse e-mail du rabbin (pour créer son accès)
- [ ] Autres personnes à qui donner accès (nom + e-mail)
- [ ] Texte de présentation du rabbin (et de sa famille, s'il le souhaite)
- [ ] **Photo du rabbin** (bonne qualité, droit de publication)

### Textes du site
- [ ] Présentation courte pour la page d'accueil (2-3 phrases)
- [ ] Présentation et histoire du Beth Habad
- [ ] Présentation du CTeen
- [ ] Introduction de la page « Cours et activités »
- [ ] Quelques mots pour la page « Faire un don »
- [ ] Logo (fichier PNG ou SVG, fond transparent si possible), s'il y en a un

### Horaires
- [ ] **Horaires des offices** : Chaharit, Minha, Arvit, en semaine, le dimanche, le vendredi soir, le Chabbat et les jours de fête
- [ ] **Allumage des bougies** : combien de minutes avant le coucher du soleil ? (réglé par défaut sur **18 min**, à confirmer)
- [ ] **Havdala** : tombée de la nuit (réglage par défaut) ou un nombre de minutes après le coucher ?
- [ ] Liste des cours et activités réguliers (jour, heure, intervenant, public, lieu)

### Mentions légales (obligatoires)
- [ ] Forme juridique (association loi 1901 ? cultuelle ?) et numéro RNA ou SIREN
- [ ] Nom et qualité du **directeur de la publication** (ex. : président de l'association)
- [ ] Accord sur la politique de confidentialité (durées de conservation : inscriptions 6 mois après l'événement, messages 2 ans)
- [ ] Accord pour publier les photos des événements (personnes reconnaissables, **enfants** en particulier)

## À faire techniquement

- [ ] **Nom de domaine** du site (ex. : `habad-montmagny.fr`) : achat, branchement sur Vercel, puis `NEXT_PUBLIC_SITE_URL` à jour
- [ ] **SMTP Resend** configuré dans Supabase avec un domaine vérifié : **indispensable** pour que le rabbin reçoive ses liens de connexion
- [ ] Modèle d'e-mail de connexion en français activé (`supabase/config.toml`, section `magic_link`)
- [ ] `RESEND_API_KEY` et `EMAIL_FROM` renseignés dans Vercel (notifications d'inscriptions et de messages)
- [ ] Adresse de production ajoutée dans Supabase (`site_url` et `additional_redirect_urls`)
- [ ] Remplacer l'e-mail de test (`dovbersitbon@gmail.com`) par celui du Beth Habad dans **Admin → Paramètres** (e-mail affiché et e-mail de réception)
- [ ] Créer le compte du rabbin (**Admin → Équipe**) et faire un essai de connexion avec lui
- [ ] **Supprimer toutes les données `[EXEMPLE]`** : événements, cours, horaires des offices, annonce, album photo
- [ ] Vérifier la page Mentions légales (adresse de l'hébergeur Vercel) et la phrase sur les transferts de données hors UE
- [ ] Déclarer le site dans **Google Search Console** et envoyer `sitemap.xml`
- [ ] Créer ou mettre à jour la fiche **Google Business Profile** (même nom, adresse, téléphone que le site)
- [ ] Remettre au rabbin le **guide** ([guide-du-rabbin.md](guide-du-rabbin.md)) et l'aider à installer l'admin sur son téléphone
- [ ] Prévoir le plan Supabase adapté (l'offre gratuite se met en pause après 7 jours sans activité ; la tâche quotidienne l'évite, mais le plan Pro est recommandé pour un site en production)
