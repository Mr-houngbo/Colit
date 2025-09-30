-- =================================================
-- SIMPLE FIX: Create timeline_steps table from scratch
-- =================================================

-- 1. Drop everything first (safe approach)
DROP TABLE IF EXISTS public.timeline_steps CASCADE;
DROP FUNCTION IF EXISTS create_initial_timeline_steps() CASCADE;
DROP FUNCTION IF EXISTS update_coli_space_updated_at() CASCADE;

-- 2. Create table with correct structure
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

-- 3. Enable RLS
ALTER TABLE public.timeline_steps ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "timeline_steps_select_policy" ON public.timeline_steps
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

CREATE POLICY "timeline_steps_insert_policy" ON public.timeline_steps
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

CREATE POLICY "timeline_steps_update_policy" ON public.timeline_steps
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

-- 5. Create function to create timeline steps
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

-- 6. Create trigger
CREATE TRIGGER create_timeline_steps_trigger
    AFTER INSERT ON public.coli_spaces
    FOR EACH ROW
    EXECUTE FUNCTION create_initial_timeline_steps();

-- 7. Create indexes
CREATE INDEX idx_timeline_steps_coli_space_id ON public.timeline_steps(coli_space_id);
CREATE INDEX idx_timeline_steps_step_id ON public.timeline_steps(step_id);
CREATE INDEX idx_timeline_steps_completed ON public.timeline_steps(completed);

-- 8. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_steps;

-- 9. Verify table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'timeline_steps' AND table_schema = 'public'
ORDER BY ordinal_position;
