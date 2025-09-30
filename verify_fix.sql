-- =================================================
-- QUICK VERIFICATION: Check if timeline fix worked
-- =================================================

-- 1. Check if table exists
SELECT 'Table timeline_steps exists: ' || CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables
                 WHERE table_name = 'timeline_steps' AND table_schema = 'public')
    THEN 'YES ✅' ELSE 'NO ❌' END;

-- 2. Check table structure
SELECT
    'Columns count: ' || COUNT(*) || ' (should be 8)' as structure_check
FROM information_schema.columns
WHERE table_name = 'timeline_steps' AND table_schema = 'public';

-- 3. Check if completed column exists
SELECT 'completed column exists: ' || CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'timeline_steps'
                 AND column_name = 'completed'
                 AND table_schema = 'public')
    THEN 'YES ✅' ELSE 'NO ❌' END;

-- 4. Check if RLS is enabled
SELECT 'RLS enabled: ' || CASE
    WHEN EXISTS (SELECT 1 FROM pg_class c
                 JOIN pg_namespace n ON n.oid = c.relnamespace
                 WHERE c.relname = 'timeline_steps'
                 AND n.nspname = 'public'
                 AND c.relrowsecurity = true)
    THEN 'YES ✅' ELSE 'NO ❌' END;

-- 5. Check if trigger exists
SELECT 'Trigger exists: ' || CASE
    WHEN EXISTS (SELECT 1 FROM pg_trigger
                 WHERE tgname = 'create_timeline_steps_trigger')
    THEN 'YES ✅' ELSE 'NO ❌' END;

-- 6. Check if function exists
SELECT 'Function exists: ' || CASE
    WHEN EXISTS (SELECT 1 FROM pg_proc
                 WHERE proname = 'create_initial_timeline_steps')
    THEN 'YES ✅' ELSE 'NO ❌' END;

-- 7. Check existing coli_spaces and their timelines
SELECT
    'Total coli_spaces: ' || COUNT(*) as spaces_count
FROM public.coli_spaces;

SELECT
    'Coli_spaces with timeline: ' || COUNT(DISTINCT cs.id) as spaces_with_timeline
FROM public.coli_spaces cs
JOIN public.timeline_steps ts ON cs.id = ts.coli_space_id;

SELECT
    'Coli_spaces WITHOUT timeline: ' || COUNT(DISTINCT cs.id) as spaces_without_timeline
FROM public.coli_spaces cs
LEFT JOIN public.timeline_steps ts ON cs.id = ts.coli_space_id
WHERE ts.id IS NULL;
