-- DIAGNOSTIC ET CONFIGURATION SUPABASE STORAGE

-- 1. Vérifier les buckets existants
SELECT id, name, public, created_at FROM storage.buckets;

-- 2. Créer le bucket 'avatars' s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Supprimer les anciennes politiques pour le bucket avatars
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- 4. Créer les politiques RLS pour avatars
-- Politique pour upload (utilisateurs authentifiés)
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

-- Politique pour lecture (tout le monde)
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Politique pour suppression (utilisateur propriétaire)
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = split_part(name, '_', 1)
);

-- 5. Vérifier les politiques
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 6. Activer RLS sur la table storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 7. Test : Lister les fichiers dans avatars
SELECT name, bucket_id, created_at FROM storage.objects WHERE bucket_id = 'avatars';
