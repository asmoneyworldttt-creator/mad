
-- =============================================================================
-- DentiSphere — Database Stability & RLS Patch
-- Run this in Supabase SQL Editor to fix 'paid_amount' missing and RLS errors.
-- =============================================================================

-- 1. Ensure Treatment Plans columns exist (Fixes 'paid_amount' error)
ALTER TABLE IF EXISTS public.treatment_plans ADD COLUMN IF NOT EXISTS total_cost DECIMAL(12,2) DEFAULT 0;
ALTER TABLE IF EXISTS public.treatment_plans ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE IF EXISTS public.treatment_plan_items ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(12,2) DEFAULT 0;

-- 2. Fix 'bills' RLS (Fixes 'new row violates row-level security' error)
-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.bills ENABLE ROW LEVEL SECURITY;

-- Drop restricting policies and create a permissive one for staff
DROP POLICY IF EXISTS "Staff can manage bills" ON public.bills;
DROP POLICY IF EXISTS "Allow all" ON public.bills;

CREATE POLICY "Allow authenticated staff" 
ON public.bills 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 3. Ensure 'treatment_plans' RLS is permissive enough
ALTER TABLE IF EXISTS public.treatment_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.treatment_plans;
CREATE POLICY "Allow all" ON public.treatment_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Refresh PostgREST Schema Cache
-- This helps if columns were recently added but aren't showing up in API
NOTIFY pgrst, 'reload schema';
