-- Fix pour le bug des clés dupliquées React
-- Contraintes SQL pour interdire la réflexivité dans coli_spaces

-- 1. Interdire qu'expéditeur = transporteur
-- 2. Interdire qu'expéditeur = destinataire (si receiver_id est défini)

-- Supprimer la contrainte si elle existe déjà
ALTER TABLE public.coli_spaces
DROP CONSTRAINT IF EXISTS no_reflexivity;

-- Ajouter la nouvelle contrainte
ALTER TABLE public.coli_spaces
ADD CONSTRAINT no_reflexivity CHECK (
  NOT (
    (sender_id = gp_id) OR
    (receiver_id IS NOT NULL AND sender_id = receiver_id)
  )
);

-- Vérifier que la contrainte a été ajoutée
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM
    information_schema.table_constraints tc
JOIN
    information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE
    tc.table_name = 'coli_spaces'
    AND tc.constraint_name = 'no_reflexivity';

-- Nettoyer les données existantes qui violent la contrainte (si nécessaire)
-- ATTENTION: Cette requête supprimera les espaces coli invalides !
-- À exécuter seulement si vous voulez nettoyer les données existantes

-- SELECT * FROM coli_spaces
-- WHERE (sender_id = gp_id) OR (receiver_id IS NOT NULL AND sender_id = receiver_id);

-- DELETE FROM coli_spaces
-- WHERE (sender_id = gp_id) OR (receiver_id IS NOT NULL AND sender_id = receiver_id);
