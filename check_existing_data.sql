-- Vérifier les données problématiques dans coli_spaces
-- Espaces coli où l'expéditeur = transporteur
SELECT id, sender_id, gp_id, receiver_id, status FROM coli_spaces WHERE sender_id = gp_id;

-- Espaces coli où l'expéditeur = destinataire
SELECT id, sender_id, gp_id, receiver_id, status FROM coli_spaces WHERE receiver_id IS NOT NULL AND sender_id = receiver_id;

-- Tous les espaces coli avec leurs participants
SELECT cs.id, cs.sender_id, cs.gp_id, cs.receiver_id, cs.status,
       ps.name as sender_name, pg.name as gp_name, pr.name as receiver_name
FROM coli_spaces cs
LEFT JOIN profiles ps ON cs.sender_id = ps.id
LEFT JOIN profiles pg ON cs.gp_id = pg.id
LEFT JOIN profiles pr ON cs.receiver_id = pr.id
ORDER BY cs.created_at DESC;
