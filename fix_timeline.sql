-- =================================================
-- DIAGNOSTIC & REPAIR SCRIPT for ColiSpace Timeline
-- =================================================

-- 1. Vérifier si la table timeline_steps existe et a la bonne structure
DO $$
BEGIN
    -- Créer la table si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'timeline_steps' AND table_schema = 'public') THEN
        RAISE NOTICE 'Creating timeline_steps table...';

        CREATE TABLE public.timeline_steps (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            coli_space_id UUID REFERENCES public.coli_spaces(id) ON DELETE CASCADE,
            step_id TEXT NOT NULL,
            label TEXT NOT NULL,
            completed BOOLEAN DEFAULT FALSE,
            validated_by UUID REFERENCES auth.users(id),
            validated_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE public.timeline_steps ENABLE ROW LEVEL SECURITY;

        RAISE NOTICE 'timeline_steps table created successfully';
    ELSE
        RAISE NOTICE 'timeline_steps table already exists';
    END IF;

    -- Vérifier et ajouter la colonne completed si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'timeline_steps'
                   AND column_name = 'completed'
                   AND table_schema = 'public') THEN
        RAISE NOTICE 'Adding completed column...';
        ALTER TABLE public.timeline_steps ADD COLUMN completed BOOLEAN DEFAULT FALSE;
    END IF;

    -- Vérifier et ajouter la colonne validated_by si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'timeline_steps'
                   AND column_name = 'validated_by'
                   AND table_schema = 'public') THEN
        RAISE NOTICE 'Adding validated_by column...';
        ALTER TABLE public.timeline_steps ADD COLUMN validated_by UUID REFERENCES auth.users(id);
    END IF;

    -- Vérifier et ajouter la colonne validated_at si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'timeline_steps'
                   AND column_name = 'validated_at'
                   AND table_schema = 'public') THEN
        RAISE NOTICE 'Adding validated_at column...';
        ALTER TABLE public.timeline_steps ADD COLUMN validated_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Créer les politiques RLS si elles n'existent pas
DO $$
BEGIN
    -- Supprimer les politiques existantes pour les recréer
    DROP POLICY IF EXISTS "Participants can view timeline_steps" ON public.timeline_steps;
    DROP POLICY IF EXISTS "Participants can insert timeline_steps" ON public.timeline_steps;
    DROP POLICY IF EXISTS "Participants can update timeline_steps" ON public.timeline_steps;

    -- Recréer les politiques
    CREATE POLICY "Participants can view timeline_steps" ON public.timeline_steps
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.coli_spaces cs
                WHERE cs.id = timeline_steps.coli_space_id
                AND (
                    auth.uid() = cs.sender_id OR
                    auth.uid() = cs.gp_id OR
                    auth.email() = cs.receiver_email
                )
            )
        );

    CREATE POLICY "Participants can insert timeline_steps" ON public.timeline_steps
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.coli_spaces cs
                WHERE cs.id = timeline_steps.coli_space_id
                AND (
                    auth.uid() = cs.sender_id OR
                    auth.uid() = cs.gp_id OR
                    auth.email() = cs.receiver_email
                )
            )
        );

    CREATE POLICY "Participants can update timeline_steps" ON public.timeline_steps
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM public.coli_spaces cs
                WHERE cs.id = timeline_steps.coli_space_id
                AND (
                    auth.uid() = cs.sender_id OR
                    auth.uid() = cs.gp_id OR
                    auth.email() = cs.receiver_email
                )
            )
        );

    RAISE NOTICE 'RLS policies for timeline_steps updated';
END $$;

-- 3. Recréer les fonctions et triggers
CREATE OR REPLACE FUNCTION create_initial_timeline_steps()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.timeline_steps (coli_space_id, step_id, label, completed)
    VALUES
        (NEW.id, 'created', 'Annonce créée', true),
        (NEW.id, 'validated', 'Colis validé', false),
        (NEW.id, 'picked_up', 'GP prend en charge', false),
        (NEW.id, 'in_transit', 'Transport en cours', false),
        (NEW.id, 'delivered', 'Livré au destinataire', false),
        (NEW.id, 'completed', 'Clôturé', false);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer et recréer le trigger
DROP TRIGGER IF EXISTS create_timeline_steps_trigger ON public.coli_spaces;
CREATE TRIGGER create_timeline_steps_trigger
    AFTER INSERT ON public.coli_spaces
    FOR EACH ROW
    EXECUTE FUNCTION create_initial_timeline_steps();

-- 4. Créer les indexes
CREATE INDEX IF NOT EXISTS idx_timeline_steps_coli_space_id ON public.timeline_steps(coli_space_id);
CREATE INDEX IF NOT EXISTS idx_timeline_steps_step_id ON public.timeline_steps(step_id);
CREATE INDEX IF NOT EXISTS idx_timeline_steps_completed ON public.timeline_steps(completed);

-- 5. Activer le realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_steps;

-- 6. Test : Afficher la structure de la table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'timeline_steps'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Test : Compter les espaces coli sans timeline
SELECT
    cs.id as coli_space_id,
    cs.created_at,
    COUNT(ts.id) as timeline_steps_count
FROM public.coli_spaces cs
LEFT JOIN public.timeline_steps ts ON cs.id = ts.coli_space_id
GROUP BY cs.id, cs.created_at
HAVING COUNT(ts.id) = 0
ORDER BY cs.created_at DESC
LIMIT 10;
