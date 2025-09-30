-- DIAGNOSTIC RAPIDE SUPABASE STORAGE

-- 1. Vérifier l'existence du bucket avatars
SELECT id, name, public, created_at FROM storage.buckets WHERE id = 'avatars';

-- 2. Lister les politiques actuelles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 3. Tester un upload simple (remplacer YOUR_USER_ID)
-- Cette requête devrait échouer si les politiques sont mal configurées
-- SELECT * FROM storage.objects WHERE bucket_id = 'avatars' LIMIT 1;

-- 4. Vérifier la session utilisateur actuelle
-- Dans ton app, vérifie que l'utilisateur est bien authentifié :
-- const { data: session } = await supabase.auth.getSession()
-- console.log('Session:', session)
