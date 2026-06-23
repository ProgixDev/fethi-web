-- Seed data for local Supabase (`supabase db reset` runs this after migrations).
--
-- Keep this idempotent and safe to run repeatedly. No schema lives here — schema
-- is authored only in supabase/migrations/ via an accepted SCR (see
-- docs/db/COORDINATION.md §3). Seeds reference tables that those migrations create.
--
-- Empty for now (WEB-001 stands up the rails only; no schema yet). The first
-- real schema task (WEB-003) adds categories/reference seeds here.
-- VENTE category taxonomy (SCR-001 seed). Idempotent.
-- Sections are top-level categories; items are their children.

insert into public.categories (slug, label, subtitle, parent_id, type, glyph, sort_order) values
  ('maison-jardin', 'Maison & jardin', null, null, 'VENTE', null, 0),
  ('mode', 'Mode', null, null, 'VENTE', null, 1),
  ('beaute-bijoux-accessoires', 'Beauté, bijoux & accessoires', null, null, 'VENTE', null, 2),
  ('famille-enfants', 'Famille & enfants', null, null, 'VENTE', null, 3),
  ('tech-multimedia', 'Tech & multimédia', null, null, 'VENTE', null, 4),
  ('loisirs-culture', 'Loisirs & culture', null, null, 'VENTE', null, 5),
  ('mobilite', 'Mobilité', null, null, 'VENTE', null, 6),
  ('art-collection-autres', 'Art, collection & autres', null, null, 'VENTE', null, 7)
on conflict (type, slug) do nothing;

insert into public.categories (slug, label, subtitle, parent_id, type, glyph, sort_order)
select v.slug, v.label, v.subtitle, p.id, 'VENTE', v.glyph, v.sort_order from (values
  ('maison-deco', 'Maison & déco', 'Mobilier, déco, linge', 'home', 0, 'maison-jardin'),
  ('cuisine', 'Cuisine & électroménager', 'Vaisselle, petit électro', 'kitchen', 1, 'maison-jardin'),
  ('bricolage', 'Bricolage & outils', 'Outillage, quincaillerie', 'tool', 2, 'maison-jardin'),
  ('jardin', 'Jardin & extérieur', 'Mobilier, outils, déco', 'leaf', 3, 'maison-jardin'),
  ('plantes', 'Plantes', 'Intérieur & extérieur', 'leaf', 4, 'maison-jardin'),
  ('animaux', 'Animaux', 'Accessoires, alimentation', 'pet', 5, 'maison-jardin'),
  ('mode-femme', 'Mode femme', 'Vêtements, robes, manteaux', 'garment', 0, 'mode'),
  ('mode-homme', 'Mode homme', 'Vêtements, costumes', 'garment', 1, 'mode'),
  ('mode-enfant', 'Mode enfant', '0–12 ans', 'garment', 2, 'mode'),
  ('chaussures', 'Chaussures', 'Femme, homme, enfant', 'shoe', 3, 'mode'),
  ('sacs', 'Sacs & maroquinerie', 'Sacs à main, sacs à dos', 'bag', 4, 'mode'),
  ('bijoux', 'Bijoux & montres', null, 'jewelry', 0, 'beaute-bijoux-accessoires'),
  ('beaute', 'Beauté & soin', 'Maquillage, parfum, soin', 'beauty', 1, 'beaute-bijoux-accessoires'),
  ('lunettes', 'Lunettes & accessoires', null, 'bag', 2, 'beaute-bijoux-accessoires'),
  ('bebe', 'Bébé & puériculture', 'Poussettes, sièges, lits', 'baby', 0, 'famille-enfants'),
  ('jouets', 'Jouets & jeux', 'Tout âge', 'toy', 1, 'famille-enfants'),
  ('ecole', 'École & papeterie', 'Livres scolaires, fournitures', 'office', 2, 'famille-enfants'),
  ('electronique', 'Électronique', 'Petits appareils', 'chip', 0, 'tech-multimedia'),
  ('telephonie', 'Téléphonie', 'Smartphones, accessoires', 'phone', 1, 'tech-multimedia'),
  ('informatique', 'Informatique', 'Ordinateurs, périphériques', 'laptop', 2, 'tech-multimedia'),
  ('audio-tv', 'Audio & TV', 'Casques, enceintes, télés', 'tv', 3, 'tech-multimedia'),
  ('photo', 'Photo & vidéo', 'Appareils, objectifs', 'camera', 4, 'tech-multimedia'),
  ('jeux-video', 'Jeux vidéo', 'Consoles, jeux, accessoires', 'gamepad', 5, 'tech-multimedia'),
  ('livres', 'Livres', null, 'book', 0, 'loisirs-culture'),
  ('films-musique', 'Films & musique', 'CD, DVD, vinyles', 'book', 1, 'loisirs-culture'),
  ('instruments', 'Instruments de musique', null, 'music', 2, 'loisirs-culture'),
  ('sport', 'Sport & fitness', null, 'sport', 3, 'loisirs-culture'),
  ('camping', 'Camping & plein air', null, 'tent', 4, 'loisirs-culture'),
  ('velos', 'Vélos & mobilité', 'Vélos, trottinettes', 'bike', 0, 'mobilite'),
  ('auto-moto', 'Auto & moto', 'Voitures, scooters', 'car', 1, 'mobilite'),
  ('pieces', 'Pièces auto & moto', null, 'tool', 2, 'mobilite'),
  ('bagages', 'Bagages & voyages', null, 'bag', 3, 'mobilite'),
  ('art', 'Art & collections', null, 'art', 0, 'art-collection-autres'),
  ('antiquites', 'Antiquités', null, 'art', 1, 'art-collection-autres'),
  ('evenementiel', 'Événementiel & déguisements', null, 'gift', 2, 'art-collection-autres'),
  ('services', 'Services & échanges', null, 'service', 3, 'art-collection-autres'),
  ('autre', 'Autre', null, 'other', 4, 'art-collection-autres')
) as v(slug, label, subtitle, glyph, sort_order, parent_slug)
join public.categories p on p.type='VENTE' and p.slug = v.parent_slug
on conflict (type, slug) do nothing;
