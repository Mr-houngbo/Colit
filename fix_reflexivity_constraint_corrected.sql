-- CORRECTION: Nettoyer d'abord les données problématiques puis appliquer la contrainte

-- 1. Identifier et supprimer les espaces coli problématiques
-- (Seulement si vous voulez nettoyer - à exécuter avec précaution)
-- SELECT 'Espaces coli où expéditeur = transporteur:' as info;
-- SELECT id, sender_id, gp_id FROM coli_spaces WHERE sender_id = gp_id;
-- SELECT 'Espaces coli où expéditeur = destinataire:' as info;
-- SELECT id, sender_id, receiver_id FROM coli_spaces WHERE receiver_id IS NOT NULL AND sender_id = receiver_id;

-- SUPPRESSION (ATTENTION: À exécuter seulement si vous voulez supprimer ces données)
-- DELETE FROM coli_spaces WHERE sender_id = gp_id;
-- DELETE FROM coli_spaces WHERE receiver_id IS NOT NULL AND sender_id = receiver_id;

-- 2. Appliquer la contrainte (version alternative plus permissive)
-- Au lieu d'interdire complètement, on peut permettre mais marquer comme invalides

-- VERSION 1: Contrainte stricte (recommandée)
-- ALTER TABLE public.coli_spaces
-- DROP CONSTRAINT IF EXISTS no_reflexivity;

-- ALTER TABLE public.coli_spaces
-- ADD CONSTRAINT no_reflexivity CHECK (
--   NOT (
--     (sender_id = gp_id) OR
--     (receiver_id IS NOT NULL AND sender_id = receiver_id)
--   )
-- );

-- VERSION 2: Ajouter une colonne de validation (plus souple)
-- ALTER TABLE public.coli_spaces
-- ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT true;

-- UPDATE coli_spaces SET is_valid = false
-- WHERE sender_id = gp_id OR (receiver_id IS NOT NULL AND sender_id = receiver_id);

-- VERSION 3: Trigger pour empêcher la création (recommandée)
-- CREATE OR REPLACE FUNCTION check_coli_space_reflexivity()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF NEW.sender_id = NEW.gp_id THEN
--     RAISE EXCEPTION 'Un utilisateur ne peut pas être expéditeur et transporteur';
--   END IF;
--   
--   IF NEW.receiver_id IS NOT NULL AND NEW.sender_id = NEW.receiver_id THEN
--     RAISE EXCEPTION 'Un utilisateur ne peut pas être expéditeur et destinataire';
--   END IF;
--   
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER trigger_check_reflexivity
--   BEFORE INSERT OR UPDATE ON public.coli_spaces
--   FOR EACH ROW EXECUTE FUNCTION check_coli_space_reflexivity();

-- Vérification du trigger
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'coli_spaces' AND trigger_name = 'trigger_check_reflexivity';
