-- =================================================
-- FIX EXISTING COLI SPACES WITHOUT TIMELINE
-- =================================================

-- Créer les étapes de timeline manquantes pour tous les espaces coli existants
INSERT INTO public.timeline_steps (coli_space_id, step_id, label, completed)
SELECT
    cs.id,
    step_data.step_id,
    step_data.label,
    step_data.completed
FROM public.coli_spaces cs
CROSS JOIN (
    VALUES
        ('created', 'Annonce créée', true),
        ('validated', 'Colis validé', false),
        ('picked_up', 'GP prend en charge', false),
        ('in_transit', 'Transport en cours', false),
        ('delivered', 'Livré au destinataire', false),
        ('completed', 'Clôturé', false)
) AS step_data(step_id, label, completed)
WHERE NOT EXISTS (
    SELECT 1 FROM public.timeline_steps ts
    WHERE ts.coli_space_id = cs.id
    AND ts.step_id = step_data.step_id
);

-- Vérifier que ça a marché
SELECT
    cs.id as coli_space_id,
    COUNT(ts.id) as timeline_steps_count,
    STRING_AGG(ts.step_id || ': ' || ts.label, ', ') as steps
FROM public.coli_spaces cs
LEFT JOIN public.timeline_steps ts ON cs.id = ts.coli_space_id
GROUP BY cs.id
ORDER BY cs.created_at DESC
LIMIT 5;
