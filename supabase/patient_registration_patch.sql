-- =============================================================================
-- DentiSphere — Final Patient Schema Patch
-- Run this in Supabase SQL Editor to fix registration errors.
-- =============================================================================

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS loyalty_points INT DEFAULT 0;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS medical_conditions TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS current_medications TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS tooth_chart_data JSONB DEFAULT '{}'::jsonb;

-- Ensure RLS is updated if needed (Optional, usually already handled)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read/write access" ON public.patients;
CREATE POLICY "Allow anon read/write access" ON public.patients FOR ALL USING (true) WITH CHECK (true);
