-- DENTISPHERE FINAL SECURITY HARDENING & LINT FIX PATCH
-- This script addresses critical security errors and warnings identified by the Supabase Linter.

-- 1. FIX EXPOSED AUTH VIEW
-- The view user_access_control exposes auth.users to public. 
-- We drop it to fix the vulnerability. Admins can view users in the Supabase Dashboard.
DROP VIEW IF EXISTS public.user_access_control;

-- 2. SECURE REMAINING PUBLIC TABLES (Enable RLS)
ALTER TABLE IF EXISTS public.quick_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.treatments_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.appointment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.consent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.installment_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.installment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.loyalty_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.patient_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.patient_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payroll_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pending_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.signed_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.treatment_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.treatment_plans ENABLE ROW LEVEL SECURITY;

-- 3. FIX MUTABLE SEARCH PATH ON TRIGGER FUNCTIONS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email), 
    COALESCE(new.raw_user_meta_data->>'role', 'patient'),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. MASSIVE CLEANUP OF ALWAYS-TRUE POLICIES (Security Bypasses)
-- We drop them to ensure the granular role-based policies take effect.

DO $$ 
DECLARE
  policies_to_drop text[][] := ARRAY[
    ['appointment_reminders', 'Allow all'],
    ['branches', 'Allow anon read/write access'],
    ['case_notes', 'Allow anon read/write access'],
    ['consent_templates', 'Allow anon read/write access'],
    ['installment_payments', 'Allow anon read/write access'],
    ['installment_plans', 'Allow anon read/write access'],
    ['inventory_purchase_orders', 'Allow all'],
    ['inventory_transactions', 'Allow all'],
    ['inventory_transactions', 'Allow anon read/write access'],
    ['inventory_transactions', 'Allow anon read/write inventory_transactions'],
    ['lab_orders', 'Allow anon read/write access'],
    ['lab_orders', 'Allow anon read/write lab_orders'],
    ['loyalty_history', 'allow_all'],
    ['loyalty_points', 'Allow anon read/write access'],
    ['patient_files', 'Allow anon read/write access'],
    ['patient_history', 'Allow anon read/write access'],
    ['patients', 'Allow anon read/write access'],
    ['payroll_transactions', 'Allow all'],
    ['pending_appointments', 'Allow anon read/write access'],
    ['prescriptions', 'Allow all'],
    ['prescriptions', 'Allow anon read/write access'],
    ['quick_bills', 'Allow all'],
    ['referrals', 'Allow anon read/write access'],
    ['resources', 'Allow anon read/write access'],
    ['shifts', 'Allow anon read/write access'],
    ['signed_consents', 'Allow anon read/write access'],
    ['staff', 'Allow anon read/write access'],
    ['staff', 'allow_all'],
    ['sterilization_logs', 'Allow anon read/write access'],
    ['sterilization_logs', 'allow_all'],
    ['tasks', 'Allow anon read/write access'],
    ['tasks', 'allow_all'],
    ['treatment_plan_items', 'Allow all'],
    ['treatment_plans', 'Allow all'],
    ['vital_signs', 'Allow all'],
    ['vital_signs', 'Allow anon read/write access'],
    ['vital_signs', 'allow_all']
  ];
  p text[];
BEGIN
  FOREACH p SLICE 1 IN ARRAY policies_to_drop LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p[2], p[1]);
  END LOOP;
END $$;

-- 5. RE-APPLY CLINICAL ACCESS TO NEWLY SECURED TABLES (God Mode)
DO $$ 
DECLARE
  tables text[] := ARRAY[
    'quick_bills', 'treatments_master', 'appointment_reminders', 'branches', 
    'case_notes', 'consent_templates', 'installment_payments', 
    'installment_plans', 'inventory_purchase_orders', 'inventory_transactions', 
    'lab_orders', 'loyalty_history', 'loyalty_points', 'patient_files', 
    'patient_history', 'payroll_transactions', 'pending_appointments', 
    'referrals', 'resources', 'shifts', 'signed_consents', 'staff', 
    'tasks', 'treatment_plan_items', 'treatment_plans'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Admins have full access" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Admins have full access" ON public.%I FOR ALL USING (public.get_auth_role() = ''admin'');', t);
    
    EXECUTE format('DROP POLICY IF EXISTS "Clinicians can access" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Clinicians can access" ON public.%I FOR ALL USING (public.get_auth_role() IN (''doctor'', ''staff''));', t);
  END LOOP;
END $$;
