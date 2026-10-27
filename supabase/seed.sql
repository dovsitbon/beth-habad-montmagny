-- =============================================================================
-- Données de départ et données d'EXEMPLE
-- -----------------------------------------------------------------------------
-- * settings / settings_private / pages : valeurs de départ réelles ou
--   repères « [À COMPLÉTER] » (rien n'est inventé).
-- * Événements, cours, horaires, annonce : données d'EXEMPLE, toutes préfixées
--   « [EXEMPLE] », à supprimer depuis l'admin avant la mise en ligne.
-- Ce script peut être relancé : il n'écrase rien d'existant.
-- =============================================================================

insert into public.settings (
  id, name, short_name, address_street, address_postal_code, address_city,
  latitude, longitude, email, phone, whatsapp, candle_minutes, end_margin_minutes, color_primary, color_accent
) values (
  1, 'Centre communautaire Beth Habad Montmagny · Groslay', 'Beth Habad Montmagny · Groslay',
  '4 bis, chemin de la Haie Barde', '95360', 'Montmagny',
  -- Allumage 17 min avant le coucher, Fin = nuit (8,5°) + 1 min : les horaires du rabbin.
  48.976809, 2.346422, 'mikelsitbon@gmail.com', '06 12 83 38 48', '33612833848', 17, 1, '#17418B', '#CCAB5A'
) on conflict (id) do nothing;

insert into public.settings_private (id, notification_email)
values (1, 'mikelsitbon@gmail.com')
on conflict (id) do nothing;

insert into public.pages (slug, title, body) values
  ('accueil', 'Présentation (page d''accueil)',
   '<p>Un lieu chaleureux et ouvert à tous, au cœur de Montmagny et Groslay. Offices chaque jour, Chabbat, fêtes, cours de Torah et activités pour les enfants et les jeunes : ici, chacun trouve sa place.</p>'),
  ('beth-habad', 'Le Beth Habad',
   '<p>[À COMPLÉTER] Présentation et histoire du Beth Habad Montmagny · Groslay.</p>'),
  ('rabbin', 'Le Rabbin',
   '<p>[À COMPLÉTER] Présentation du rabbin et de sa famille.</p>'),
  ('cteen', 'CTeen',
   '<p>[À COMPLÉTER] Présentation du CTeen de Montmagny.</p>'),
  ('cours', 'Cours et activités',
   '<p>[À COMPLÉTER] Introduction à la page des cours.</p>'),
  ('faire-un-don', 'Faire un don',
   '<p>[À COMPLÉTER] Quelques mots pour expliquer à quoi servent les dons.</p>'),
  ('mentions-legales', 'Mentions légales',
   $tpl$<h2>Éditeur du site</h2>
<p>Centre communautaire Beth Habad Montmagny · Groslay — forme juridique [À COMPLÉTER] (par exemple : association loi 1901)<br>
Siège : 4 bis, chemin de la Haie Barde, 95360 Montmagny<br>
Numéro RNA ou SIREN : [À COMPLÉTER]<br>
Contact : voir la page <a href="/contact">Contact</a></p>

<h2>Directeur de la publication</h2>
<p>[À COMPLÉTER] (nom et qualité, par exemple : le président de l'association)</p>

<h2>Conception et réalisation</h2>
<p>[À COMPLÉTER] (nom du prestataire)</p>

<h2>Hébergement</h2>
<p>Site hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com.<br>
Base de données et photos hébergées par Supabase, sur des serveurs situés en France (région de Paris).</p>

<h2>Propriété intellectuelle</h2>
<p>Les textes et photos publiés sur ce site appartiennent au Centre communautaire Beth Habad Montmagny · Groslay ou à leurs auteurs, sauf mention contraire. Toute reproduction sans autorisation est interdite.</p>

<h2>Crédits</h2>
<p>Horaires de Chabbat et des fêtes calculés avec Hebcal (hebcal.com). Carte : © les contributeurs d'OpenStreetMap.</p>

<h2>Données personnelles</h2>
<p>Voir la <a href="/confidentialite">politique de confidentialité</a>.</p>$tpl$),
  ('confidentialite', 'Politique de confidentialité',
   $tpl$<p>Le Centre communautaire Beth Habad Montmagny · Groslay attache une grande importance à la protection de vos données. Cette page explique quelles informations le site recueille, pourquoi, combien de temps elles sont gardées et comment exercer vos droits.</p>

<h2>Responsable du traitement</h2>
<p>Centre communautaire Beth Habad Montmagny · Groslay, 4 bis, chemin de la Haie Barde, 95360 Montmagny. Contact : voir la page <a href="/contact">Contact</a>.</p>

<h2>Données recueillies et utilisation</h2>
<ul>
<li><strong>Formulaire de contact</strong> : nom, e-mail et/ou téléphone, message. Utilisés uniquement pour vous répondre. Conservés 2 ans au maximum.</li>
<li><strong>Inscriptions aux événements</strong> : nom, téléphone et/ou e-mail, nombre de personnes. Utilisés uniquement pour organiser l'événement. Supprimés automatiquement 6 mois après l'événement.</li>
<li><strong>Sécurité</strong> : une empreinte chiffrée de votre adresse IP (jamais l'adresse elle-même) est gardée 24 heures pour limiter les envois abusifs.</li>
<li><strong>Espace de gestion</strong> : l'adresse e-mail des membres de l'équipe du Beth Habad qui gèrent le site.</li>
</ul>
<p>Base légale : votre demande (inscription, message) et l'intérêt légitime du Beth Habad à y répondre et à protéger le site.</p>

<h2>Qui a accès à vos données ?</h2>
<p>Seule l'équipe du Beth Habad chargée du site. Vos données ne sont ni vendues ni cédées. Prestataires techniques : Supabase (hébergement des données, en France), Vercel (hébergement du site) et Resend (envoi des e-mails de notification). Certains de ces prestataires sont établis aux États-Unis ; ces transferts sont encadrés par les garanties prévues par le RGPD.</p>

<h2>Cookies</h2>
<p>Ce site n'utilise <strong>aucun cookie de suivi ni de mesure d'audience</strong>. Seuls des cookies strictement nécessaires sont utilisés pour la connexion à l'espace de gestion. La carte de la page Contact est affichée depuis OpenStreetMap, et le bouton de don renvoie vers Allodons, qui ont leurs propres règles de confidentialité.</p>

<h2>Vos droits</h2>
<p>Vous pouvez demander à consulter, corriger ou supprimer vos données, ou vous opposer à leur utilisation, en écrivant au Beth Habad (page <a href="/contact">Contact</a>). Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL (cnil.fr).</p>

<p>Dernière mise à jour : [À COMPLÉTER]</p>$tpl$)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- EXEMPLES (à supprimer avant la mise en ligne)
-- ----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from public.events where title like '[EXEMPLE]%') then
    return;
  end if;

  insert into public.events
    (slug, category, title, summary, description, starts_at, ends_at, location,
     price_text, registration_enabled, capacity, status)
  values
    ('exemple-repas-de-chabbat', 'general', '[EXEMPLE] Repas de Chabbat communautaire',
     'Exemple d''événement avec inscription et nombre de places limité.',
     '<p>Ceci est un événement d''exemple. Il sera supprimé avant la mise en ligne.</p>',
     -- Vendredi soir de la semaine prochaine, 20 h (heure de Paris)
     (date_trunc('week', now() at time zone 'Europe/Paris') + interval '11 days 20 hours') at time zone 'Europe/Paris',
     (date_trunc('week', now() at time zone 'Europe/Paris') + interval '11 days 23 hours') at time zone 'Europe/Paris',
     'Beth Habad Montmagny · Groslay', '[EXEMPLE] 20 € / adulte', true, 40, 'published'),
    ('exemple-soiree-cteen', 'cteen', '[EXEMPLE] Soirée CTeen',
     'Exemple d''activité pour les ados.',
     '<p>Ceci est une activité CTeen d''exemple.</p>',
     -- Mardi de la semaine prochaine, 18 h 30
     (date_trunc('week', now() at time zone 'Europe/Paris') + interval '8 days 18 hours 30 minutes') at time zone 'Europe/Paris',
     (date_trunc('week', now() at time zone 'Europe/Paris') + interval '8 days 20 hours 30 minutes') at time zone 'Europe/Paris',
     'Beth Habad Montmagny · Groslay', null, true, null, 'published'),
    ('exemple-evenement-passe', 'general', '[EXEMPLE] Événement passé',
     'Exemple d''événement terminé (pour l''onglet « passés »).',
     '<p>Ceci est un événement passé d''exemple.</p>',
     -- Dimanche, il y a deux semaines, 20 h
     (date_trunc('week', now() at time zone 'Europe/Paris') - interval '8 days' + interval '20 hours') at time zone 'Europe/Paris',
     null, 'Beth Habad Montmagny · Groslay', null, false, null, 'published'),
    ('exemple-brouillon', 'general', '[EXEMPLE] Événement en brouillon',
     'Invisible pour le public tant qu''il n''est pas publié.',
     '<p>Brouillon d''exemple.</p>',
     (date_trunc('week', now() at time zone 'Europe/Paris') + interval '29 days 20 hours') at time zone 'Europe/Paris',
     null, null, null, false, null, 'draft');

  insert into public.courses
    (title, audience, day_of_week, start_time, end_time, speaker, location, description, sort_order, status)
  values
    ('[EXEMPLE] Cours de Torah hebdomadaire', 'tous', 2, '20:30', '21:30',
     '[EXEMPLE] Intervenant', 'Beth Habad Montmagny · Groslay', '<p>Cours d''exemple.</p>', 1, 'published'),
    ('[EXEMPLE] Activité pour les femmes', 'femmes', 0, '10:00', '11:30',
     '[EXEMPLE] Intervenante', 'Beth Habad Montmagny · Groslay', '<p>Activité d''exemple.</p>', 2, 'published'),
    ('[EXEMPLE] Atelier pour les enfants', 'enfants', 3, '14:00', '16:00',
     null, 'Beth Habad Montmagny · Groslay', '<p>Atelier d''exemple.</p>', 3, 'published');

  insert into public.service_times (office, day_type, time, note, sort_order) values
    ('chaharit', 'semaine', '08:15', null, 1),
    ('chaharit', 'dimanche', '09:00', null, 2),
    ('arvit', 'semaine', '20:00', '[EXEMPLE] horaire à remplacer', 1);

  insert into public.announcements (message, level, is_active, expires_at)
  values ('[EXEMPLE] Ceci est une annonce en bandeau. Elle expire automatiquement.',
          'info', true, now() + interval '14 days');
end;
$$;
