-- =============================================================================
-- Master Panel Phase 1: Multi-Tenancy & Logic Patch
-- =============================================================================

-- 1. CLINICS TABLE
CREATE TABLE IF NOT EXISTS public.clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id),
    owner_name TEXT,
    branches_count INTEGER DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deactivated', 'blocked', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    package_type TEXT NOT NULL CHECK (package_type IN ('Monthly', 'Yearly')),
    validity_start TIMESTAMPTZ DEFAULT NOW(),
    validity_end TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PURCHASE REQUESTS
CREATE TABLE IF NOT EXISTS public.purchase_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    package_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ADMIN LOGS
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT,
    performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_user_clinic_id()
RETURNS UUID AS $$
  SELECT (auth.jwt()->'user_metadata'->>'clinic_id')::UUID;
$$ LANGUAGE SQL STABLE;

-- 6. MULTI-TENANCY CORE PATCH (COLUMNS & POLICIES)
DO $$ 
DECLARE
    t text;
    tables_to_patch text[] := ARRAY['patients', 'staff', 'bills', 'appointments', 'inventory_stock', 'lab_orders', 'treatment_plans'];
BEGIN
    FOR t IN SELECT unnest(tables_to_patch)
    LOOP
        -- 1. Create column as UUID (safe add)
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id);', t);
        
        -- 2. Force conversion to UUID (handles cases where column was previously TEXT)
        BEGIN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN clinic_id TYPE UUID USING clinic_id::UUID;', t);
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Note: Could not force UUID type on table % - continuing...', t;
        END;

        -- 3. Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);

        -- 4. Create Policy with EXPLICIT CASTING for comparison safety
        EXECUTE format('DROP POLICY IF EXISTS "Clinic-based isolation" ON public.%I;', t);
        EXECUTE format('CREATE POLICY "Clinic-based isolation" ON public.%I FOR ALL USING (
            (auth.jwt()->''user_metadata''->>''role'') = ''master'' OR
            (clinic_id::text)::uuid = public.get_user_clinic_id()
        );', t);
    END LOOP;
END $$;

-- 7. FIXING SPECIFIC USER CONFLICTS (e.g., Audit Log)
-- The user reported a conflict with "Admins read logs" on "audit_log"
ALTER TABLE IF EXISTS public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read logs" ON public.audit_log;
DROP POLICY IF EXISTS "Admins can read audit log" ON public.audit_log;
CREATE POLICY "Admins read logs" ON public.audit_log FOR SELECT USING (
    (auth.jwt()->'user_metadata'->>'role') IN ('master', 'admin')
);
