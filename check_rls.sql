-- VÉRIFICATION RAPIDE DES POLITIQUES RLS

-- Vérifier si le bucket avatars existe
SELECT id, name, public FROM storage.buckets WHERE name = 'avatars';

-- Vérifier les politiques actuelles
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Si aucune politique, exécuter le script complet fix_supabase_storage.sql
