-- Configuration du bucket Supabase Storage pour les avatars
-- Ce script doit être exécuté dans Supabase SQL Editor

-- 1. Créer le bucket 'avatars' (si pas déjà existant via l'interface)
-- Dans Supabase Dashboard -> Storage -> Create bucket: 'avatars'
-- Configurer les politiques RLS pour permettre l'upload

-- 2. Politiques RLS pour le bucket avatars
-- Permettre aux utilisateurs authentifiés d'uploader leurs propres avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permettre aux utilisateurs de voir les avatars publics
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Permettre aux utilisateurs de supprimer leurs propres avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Vérification
-- Lister tous les buckets
SELECT id, name, public FROM storage.buckets;

-- Lister les politiques du bucket avatars
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';
