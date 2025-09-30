-- Migration SQL pour enrichir la table profiles
-- Exécuter ces commandes dans Supabase SQL Editor

-- Ajouter les nouvelles colonnes à la table profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Mettre à jour les profils existants (optionnel)
-- Copier name vers full_name pour les utilisateurs existants
UPDATE profiles SET full_name = name WHERE full_name IS NULL;

-- Créer un index pour améliorer les performances (optionnel)
CREATE INDEX IF NOT EXISTS profiles_full_name_idx ON profiles (full_name);
CREATE INDEX IF NOT EXISTS profiles_phone_idx ON profiles (phone);
CREATE INDEX IF NOT EXISTS profiles_location_idx ON profiles (location);

-- Vérifier la structure de la table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
