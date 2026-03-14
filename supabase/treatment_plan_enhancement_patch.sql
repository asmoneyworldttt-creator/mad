
-- =============================================================================
-- DentiSphere — Enhanced Treatment Planning Patch
-- Run this in Supabase SQL Editor to support new features.
-- =============================================================================

-- Add metadata to treatment_plans for discounts and breakdown
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add unit_cost to treatment_plan_items
ALTER TABLE public.treatment_plan_items ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(12,2) DEFAULT 0;

-- Ensure paid_amount and total_cost exist in treatment_plans
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS total_cost DECIMAL(12,2) DEFAULT 0;

-- Update RLS (Ensure 'Allow all' or more restrictive as needed)
-- Assuming 'Allow all' policy as per previous files
DROP POLICY IF EXISTS "Allow all" ON public.treatment_plans;
CREATE POLICY "Allow all" ON public.treatment_plans FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON public.treatment_plan_items;
CREATE POLICY "Allow all" ON public.treatment_plan_items FOR ALL USING (true) WITH CHECK (true);
