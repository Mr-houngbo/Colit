-- SOLUTION RECOMMANDÉE: Utiliser un trigger au lieu d'une contrainte CHECK

-- Ce trigger empêche la création d'espaces coli réflexifs
-- Avantage: Pas de conflit avec les données existantes

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_check_reflexivity ON public.coli_spaces;
DROP FUNCTION IF EXISTS check_coli_space_reflexivity();

-- Créer la fonction du trigger
CREATE OR REPLACE FUNCTION check_coli_space_reflexivity()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier que l'expéditeur n'est pas le transporteur
  IF NEW.sender_id = NEW.gp_id THEN
    RAISE EXCEPTION 'Un utilisateur ne peut pas être à la fois expéditeur et transporteur pour le même colis.';
  END IF;
  
  -- Vérifier que l'expéditeur n'est pas le destinataire
  IF NEW.receiver_id IS NOT NULL AND NEW.sender_id = NEW.receiver_id THEN
    RAISE EXCEPTION 'Un utilisateur ne peut pas être à la fois expéditeur et destinataire.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
CREATE TRIGGER trigger_check_reflexivity
  BEFORE INSERT OR UPDATE ON public.coli_spaces
  FOR EACH ROW EXECUTE FUNCTION check_coli_space_reflexivity();

-- Vérifier que le trigger a été créé
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'coli_spaces' AND trigger_name = 'trigger_check_reflexivity';

-- Test du trigger (devrait échouer)
-- INSERT INTO coli_spaces (sender_id, gp_id, status) VALUES ('same_user_id', 'same_user_id', 'created');
