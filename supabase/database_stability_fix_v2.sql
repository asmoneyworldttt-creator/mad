
-- =============================================================================
-- DentiSphere — Database Stability & RLS Patch (Resilient)
-- =============================================================================

-- 1. Ensure Treatment Plans columns exist
ALTER TABLE IF EXISTS public.treatment_plans ADD COLUMN IF NOT EXISTS total_cost DECIMAL(12,2) DEFAULT 0;
ALTER TABLE IF EXISTS public.treatment_plans ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE IF EXISTS public.treatment_plan_items ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(12,2) DEFAULT 0;

-- 2. Ensure Appointments table has doctor fields
ALTER TABLE IF EXISTS public.appointments ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS public.appointments ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE IF EXISTS public.appointments ADD COLUMN IF NOT EXISTS clinic_id UUID;

-- 3. Fix 'bills' RLS
ALTER TABLE IF EXISTS public.bills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage bills" ON public.bills;
DROP POLICY IF EXISTS "Allow all" ON public.bills;
DROP POLICY IF EXISTS "Allow authenticated staff" ON public.bills;

CREATE POLICY "Allow authenticated staff" 
ON public.bills 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 4. Ensure 'treatment_plans' RLS is permissive
ALTER TABLE IF EXISTS public.treatment_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.treatment_plans;
CREATE POLICY "Allow all" ON public.treatment_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Refresh Cache
NOTIFY pgrst, 'reload schema';
