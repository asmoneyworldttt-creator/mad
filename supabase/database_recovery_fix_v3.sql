
-- =============================================================================
-- DentiSphere — Database & Security Recovery Fix (v3)
-- This script fixes the missing 'status' column in treatment_plans and 
-- resolves RLS policy violations for 'bills' and 'treatment_plans'.
-- =============================================================================

BEGIN;

-- 1. FIX TREATMENT_PLANS TABLE STRUCTURE
DO $$ 
BEGIN
    -- Rename draft_status to status if it exists (legacy schema compatibility)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='treatment_plans' AND column_name='draft_status') 
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='treatment_plans' AND column_name='status') THEN
        ALTER TABLE public.treatment_plans RENAME COLUMN draft_status TO status;
    END IF;

    -- Rename plan_id to id if it exists (legacy schema compatibility)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='treatment_plans' AND column_name='plan_id') 
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='treatment_plans' AND column_name='id') THEN
        ALTER TABLE public.treatment_plans RENAME COLUMN plan_id TO id;
    END IF;
END $$;

-- Ensure all required columns exist for treatment_plans matching the frontend expectations
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Draft';
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS total_cost DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS patient_id TEXT;
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. FIX TREATMENT_PLAN_ITEMS TABLE STRUCTURE
ALTER TABLE public.treatment_plan_items ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.treatment_plan_items ADD COLUMN IF NOT EXISTS cost DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.treatment_plan_items ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending';

-- 3. RESOLVE RLS POLICY VIOLATIONS FOR ALL CRITICAL TABLES
-- We establish a broad "authenticated" access to ensure the app works for all staff/admins.

-- Fix Bills RLS
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.bills;
DROP POLICY IF EXISTS "Allow authenticated staff" ON public.bills;
DROP POLICY IF EXISTS "Staff and Admin Access" ON public.bills;
DROP POLICY IF EXISTS "Staff can manage bills" ON public.bills;
DROP POLICY IF EXISTS "Admins have full access" ON public.bills;
DROP POLICY IF EXISTS "Clinicians can access" ON public.bills;
CREATE POLICY "Authenticated users can manage bills" ON public.bills FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Fix Treatment Plans RLS
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.treatment_plans;
DROP POLICY IF EXISTS "Staff and Admin Access" ON public.treatment_plans;
DROP POLICY IF EXISTS "Admins have full access" ON public.treatment_plans;
DROP POLICY IF EXISTS "Clinicians can access" ON public.treatment_plans;
CREATE POLICY "Authenticated users can manage treatment_plans" ON public.treatment_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Fix Treatment Plan Items RLS
ALTER TABLE public.treatment_plan_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.treatment_plan_items;
DROP POLICY IF EXISTS "Staff and Admin Access" ON public.treatment_plan_items;
DROP POLICY IF EXISTS "Admins have full access" ON public.treatment_plan_items;
DROP POLICY IF EXISTS "Clinicians can access" ON public.treatment_plan_items;
CREATE POLICY "Authenticated users can manage treatment_plan_items" ON public.treatment_plan_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

COMMIT;
