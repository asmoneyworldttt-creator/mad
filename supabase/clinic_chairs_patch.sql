-- Fix for Dynamic Chair Management and resource state persistencies

-- 1. Add chair_id support to appointments table
ALTER TABLE IF EXISTS public.appointments 
ADD COLUMN IF NOT EXISTS chair_id TEXT;

-- 2. Create clinic_chairs table for Dynamic Chair configs
CREATE TABLE IF NOT EXISTS public.clinic_chairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT DEFAULT 'General',
    color TEXT DEFAULT 'bg-primary shadow-primary/30',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for clinic_chairs
ALTER TABLE public.clinic_chairs ENABLE ROW LEVEL SECURITY;

-- Idempotent policy creation
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public access to clinic_chairs" ON public.clinic_chairs;
    CREATE POLICY "Public access to clinic_chairs" ON public.clinic_chairs FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 3. Seed default chairs if empty
INSERT INTO public.clinic_chairs (name, type, color)
SELECT 'Chair 01', 'Surge', 'bg-primary shadow-primary/30'
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_chairs LIMIT 1);

INSERT INTO public.clinic_chairs (name, type, color)
SELECT 'Chair 02', 'Gen', 'bg-emerald-500 shadow-emerald-500/30'
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_chairs WHERE name = 'Chair 02');

INSERT INTO public.clinic_chairs (name, type, color)
SELECT 'Chair 03', 'Ortho', 'bg-amber-500 shadow-amber-500/30'
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_chairs WHERE name = 'Chair 03');

INSERT INTO public.clinic_chairs (name, type, color)
SELECT 'Chair 04', 'Image', 'bg-rose-500 shadow-rose-500/30'
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_chairs WHERE name = 'Chair 04');

INSERT INTO public.clinic_chairs (name, type, color)
SELECT 'Chair 05', 'Hyg', 'bg-indigo-500 shadow-indigo-500/30'
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_chairs WHERE name = 'Chair 05');
