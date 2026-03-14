
-- =============================================================================
-- DentiSphere — Database & Security Recovery Fix (v4)
-- This script fixes schema mismatches and RLS policy violations.
-- Run this in the Supabase SQL Editor.
-- =============================================================================

BEGIN;

-- 1. FIX TREATMENT_PLANS TABLE
-- Ensure the table exists (fallback)
CREATE TABLE IF NOT EXISTS public.treatment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

DO $$ 
BEGIN
    -- Rename 'plan_id' to 'id' if 'id' is missing
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='treatment_plans' AND column_name='plan_id') 
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='treatment_plans' AND column_name='id') THEN
        ALTER TABLE public.treatment_plans RENAME COLUMN plan_id TO id;
    END IF;

    -- Rename 'draft_status' to 'status' if 'status' is missing
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='treatment_plans' AND column_name='draft_status') 
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='treatment_plans' AND column_name='status') THEN
        ALTER TABLE public.treatment_plans RENAME COLUMN draft_status TO status;
    END IF;
END $$;

-- Ensure all required columns for TreatmentPlans.tsx are present with correct types
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS patient_id TEXT;
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Draft';
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS total_cost DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. FIX TREATMENT_PLAN_ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.treatment_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID
);

ALTER TABLE public.treatment_plan_items ADD COLUMN IF NOT EXISTS treatment_name TEXT;
ALTER TABLE public.treatment_plan_items ADD COLUMN IF NOT EXISTS tooth_reference TEXT;
ALTER TABLE public.treatment_plan_items ADD COLUMN IF NOT EXISTS estimated_sessions INT DEFAULT 1;
ALTER TABLE public.treatment_plan_items ADD COLUMN IF NOT EXISTS cost DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.treatment_plan_items ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.treatment_plan_items ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending';
ALTER TABLE public.treatment_plan_items ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE public.treatment_plan_items ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.treatment_plan_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 3. FIX BILLS TABLE
-- Some scripts use TEXT for ID, some use UUID. Ensure robustness.
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS prof_fee DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Paid';
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;

-- 4. FIX RLS POLICIES (Aggressive Reset)
-- This ensures 'authenticated' users (Doctor, Admin, Staff) can always perform operations.

-- Bills
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.bills;
DROP POLICY IF EXISTS "Allow authenticated staff" ON public.bills;
DROP POLICY IF EXISTS "Staff and Admin Access" ON public.bills;
DROP POLICY IF EXISTS "Authenticated users can manage bills" ON public.bills;
CREATE POLICY "RLS_FIX_BILLS_2024" ON public.bills FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Treatment Plans
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.treatment_plans;
DROP POLICY IF EXISTS "Staff and Admin Access" ON public.treatment_plans;
DROP POLICY IF EXISTS "Authenticated users can manage treatment_plans" ON public.treatment_plans;
CREATE POLICY "RLS_FIX_TP_2024" ON public.treatment_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Treatment Plan Items
ALTER TABLE public.treatment_plan_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.treatment_plan_items;
DROP POLICY IF EXISTS "Staff and Admin Access" ON public.treatment_plan_items;
DROP POLICY IF EXISTS "Authenticated users can manage treatment_plan_items" ON public.treatment_plan_items;
CREATE POLICY "RLS_FIX_TPI_2024" ON public.treatment_plan_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

COMMIT;
