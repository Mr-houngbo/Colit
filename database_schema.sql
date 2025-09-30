-- ColiSpace Database Schema
-- Execute these scripts in your Supabase SQL editor

-- =================================================
-- 1. COLI_SPACES TABLE
-- =================================================

-- Create coli_spaces table
CREATE TABLE IF NOT EXISTS public.coli_spaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    gp_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    receiver_name TEXT,
    receiver_phone TEXT,
    receiver_email TEXT,
    receiver_address TEXT,
    status TEXT DEFAULT 'created' CHECK (status IN ('created', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.coli_spaces ENABLE ROW LEVEL SECURITY;

-- Policies for coli_spaces
CREATE POLICY "Users can view coli_spaces they participate in" ON public.coli_spaces
    FOR SELECT USING (
        auth.uid() = sender_id OR
        auth.uid() = gp_id OR
        auth.email() = receiver_email
    );

CREATE POLICY "Users can create coli_spaces" ON public.coli_spaces
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Participants can update coli_spaces" ON public.coli_spaces
    FOR UPDATE USING (
        auth.uid() = sender_id OR
        auth.uid() = gp_id OR
        auth.email() = receiver_email
    );

-- =================================================
-- 2. TIMELINE_STEPS TABLE
-- =================================================

-- Create timeline_steps table
CREATE TABLE IF NOT EXISTS public.timeline_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coli_space_id UUID REFERENCES public.coli_spaces(id) ON DELETE CASCADE,
    step_id TEXT NOT NULL, -- 'created', 'validated', 'picked_up', 'in_transit', 'delivered', 'completed'
    label TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    validated_by UUID REFERENCES auth.users(id),
    validated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.timeline_steps ENABLE ROW LEVEL SECURITY;

-- Policies for timeline_steps
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

-- =================================================
-- 3. MESSAGES TABLE (if not exists)
-- =================================================

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coli_space_id UUID REFERENCES public.coli_spaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT,
    attachments JSONB DEFAULT '[]'::jsonb, -- Array of image URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages
CREATE POLICY "Participants can view messages" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.coli_spaces cs
            WHERE cs.id = messages.coli_space_id
            AND (
                auth.uid() = cs.sender_id OR
                auth.uid() = cs.gp_id OR
                auth.email() = cs.receiver_email
            )
        )
    );

CREATE POLICY "Participants can insert messages" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.coli_spaces cs
            WHERE cs.id = messages.coli_space_id
            AND (
                auth.uid() = cs.sender_id OR
                auth.uid() = cs.gp_id OR
                auth.email() = cs.receiver_email
            )
        )
    );

-- =================================================
-- 4. ANNOUNCEMENTS TABLE UPDATES
-- =================================================

-- Add new columns to announcements if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'receiver_name') THEN
        ALTER TABLE public.announcements ADD COLUMN receiver_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'receiver_phone') THEN
        ALTER TABLE public.announcements ADD COLUMN receiver_phone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'receiver_email') THEN
        ALTER TABLE public.announcements ADD COLUMN receiver_email TEXT;
    END IF;
END $$;

-- =================================================
-- 6. FUNCTIONS & TRIGGERS
-- =================================================

-- Function to create initial timeline steps when coli_space is created
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

-- Trigger to create timeline steps when coli_space is created
CREATE TRIGGER create_timeline_steps_trigger
    AFTER INSERT ON public.coli_spaces
    FOR EACH ROW
    EXECUTE FUNCTION create_initial_timeline_steps();

-- Function to get or create coli_space (RPC function)
CREATE OR REPLACE FUNCTION get_or_create_coli_space(
    p_announcement_id UUID,
    p_sender_id UUID,
    p_gp_id UUID
)
RETURNS TABLE (
    id UUID,
    is_new BOOLEAN
) AS $$
DECLARE
    existing_id UUID;
BEGIN
    -- Try to find existing coli_space
    SELECT cs.id INTO existing_id
    FROM public.coli_spaces cs
    WHERE cs.announcement_id = p_announcement_id
      AND cs.sender_id = p_sender_id
      AND cs.gp_id = p_gp_id;

    -- If exists, return it
    IF existing_id IS NOT NULL THEN
        RETURN QUERY SELECT existing_id, FALSE;
        RETURN;
    END IF;

    -- If not exists, create new one
    INSERT INTO public.coli_spaces (announcement_id, sender_id, gp_id, status)
    VALUES (p_announcement_id, p_sender_id, p_gp_id, 'created')
    RETURNING coli_spaces.id INTO existing_id;

    RETURN QUERY SELECT existing_id, TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update coli_space updated_at
CREATE OR REPLACE FUNCTION update_coli_space_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.coli_spaces
    SET updated_at = NOW()
    WHERE id = NEW.coli_space_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update coli_space when timeline steps change
CREATE TRIGGER update_coli_space_on_timeline_change
    AFTER INSERT OR UPDATE ON public.timeline_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_coli_space_updated_at();

-- =================================================
-- 6. INDEXES FOR PERFORMANCE
-- =================================================

-- Indexes for coli_spaces
CREATE INDEX IF NOT EXISTS idx_coli_spaces_announcement_id ON public.coli_spaces(announcement_id);
CREATE INDEX IF NOT EXISTS idx_coli_spaces_sender_id ON public.coli_spaces(sender_id);
CREATE INDEX IF NOT EXISTS idx_coli_spaces_gp_id ON public.coli_spaces(gp_id);
CREATE INDEX IF NOT EXISTS idx_coli_spaces_status ON public.coli_spaces(status);

-- Indexes for timeline_steps
CREATE INDEX IF NOT EXISTS idx_timeline_steps_coli_space_id ON public.timeline_steps(coli_space_id);
CREATE INDEX IF NOT EXISTS idx_timeline_steps_step_id ON public.timeline_steps(step_id);
CREATE INDEX IF NOT EXISTS idx_timeline_steps_completed ON public.timeline_steps(completed);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_coli_space_id ON public.messages(coli_space_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- =================================================
-- 7. REALTIME SUBSCRIPTIONS
-- =================================================

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.coli_spaces;
ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_steps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
