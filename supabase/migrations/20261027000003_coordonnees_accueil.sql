-- =============================================================================
-- Beth Habad Montmagny · Groslay : coordonnées, texte d'accueil, bandeau.
--
--  * Téléphone et WhatsApp : 06 12 83 38 48 ; e-mail : mikelsitbon@gmail.com.
--    (L'adresse qui reçoit les notifications, settings_private, ne change pas.)
--  * Texte de présentation de la bannière d'accueil (modifiable dans l'admin, Textes),
--    seulement s'il est encore à compléter.
--  * L'annonce d'exemple est désactivée : sans annonce, le bandeau du haut affiche
--    automatiquement les horaires (offices du jour, ou Chabbat).
-- =============================================================================

update public.settings
  set phone = '06 12 83 38 48',
      whatsapp = '33612833848',
      email = 'mikelsitbon@gmail.com'
  where id = 1;

update public.pages
  set body = '<p>Un lieu chaleureux et ouvert à tous, au cœur de Montmagny et Groslay. Offices chaque jour, Chabbat, fêtes, cours de Torah et activités pour les enfants et les jeunes : ici, chacun trouve sa place.</p>'
  where slug = 'accueil' and body like '%[À COMPLÉTER]%';

update public.announcements
  set is_active = false
  where message like '[EXEMPLE]%' and is_active;
