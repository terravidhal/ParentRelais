-- Vidéo et sous-titres de démonstration : références perdues au passage
-- « contenu dans le bundle » → « contenu dans Supabase ».
--
-- L'ancien seed local (lib/content/seed.ts) portait video_url et
-- subtitles_url sur les langues fr/en ; le seed serveur 0004, lui, n'a
-- jamais inséré que audio_url. Tant que Dexie était rempli depuis le
-- bundle, l'écart ne se voyait pas. Depuis que Supabase est la source de
-- vérité, le lecteur vidéo et le badge « Sous-titres disponibles » ont
-- disparu de l'app facilitateur (constaté : 4 tests e2e en échec).
--
-- Les fichiers existent bien dans /public (video/module-1.mp4,
-- video/module-1-fr.vtt) et sont servis par le service worker : il ne
-- manquait que les lignes qui les désignent.
--
-- On ne touche QUE les cases fr/en encore dépourvues de vidéo : les vidéos
-- réelles déjà envoyées en langue des signes (modules 1 et 2, uploadées vers
-- Storage) ne doivent surtout pas être écrasées.

update public.module_translations
set
  video_url = '/video/module-1.mp4',
  subtitles_url = '/video/module-1-fr.vtt'
where lang in ('fr', 'en')
  and video_url is null;
