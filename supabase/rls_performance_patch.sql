-- DENTISPHERE RLS PERFORMANCE & CLEANUP PATCH
-- This script fixes suboptimal policy performance and removes redundant permissive policies.

-- 1. OPTIMIZE AUTH ROLE FUNCTION
-- Wrapping auth.uid() in a subquery or using security definer properly
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  -- Use a selective select to speed up evaluation
  SELECT role INTO user_role FROM public.profiles WHERE id = (SELECT auth.uid()) LIMIT 1;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. CLEANUP REDUNDANT POLICIES (From Dashboard Lint)
-- These broad policies conflict with our new granular clinical policies.

-- Drop broad policies on accounts
DROP POLICY IF EXISTS "Allow anon read/write access" ON public.accounts;
DROP POLICY IF EXISTS "Allow anon read/write accounts" ON public.accounts;

-- Drop broad policies on appointments
DROP POLICY IF EXISTS "Allow anon read/write access" ON public.appointments;

-- Drop broad policies on attendance_logs
DROP POLICY IF EXISTS "Allow anon read/write access" ON public.attendance_logs;
DROP POLICY IF EXISTS "allow_all" ON public.attendance_logs;

-- Drop broad policies on bills
DROP POLICY IF EXISTS "Allow all" ON public.bills;
DROP POLICY IF EXISTS "Allow anon read/write access" ON public.bills;

-- Drop broad policies on clinical_photos
DROP POLICY IF EXISTS "Allow all" ON public.clinical_photos;
DROP POLICY IF EXISTS "allow_all" ON public.clinical_photos;

-- Drop broad policies on equipment
DROP POLICY IF EXISTS "Allow anon read/write access" ON public.equipment;

-- Drop broad policies on inventory_products
-- (Clinicians can manage inventory is our new policy, we keep that)

-- Drop broad policies on inventory_stock
DROP POLICY IF EXISTS "Allow all" ON public.inventory_stock;
DROP POLICY IF EXISTS "Allow anon read/write access" ON public.inventory_stock;
DROP POLICY IF EXISTS "Allow anon read/write inventory_stock" ON public.inventory_stock;

-- 3. RE-DEFINE CORE POLICIES WITH PERFORMANCE OPTIMIZATIONS
-- Replacing auth.uid() with (SELECT auth.uid()) to prevent re-evaluation for every row.

-- Profiles table optimization
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles 
FOR UPDATE USING ((SELECT auth.uid()) = id);

-- Patients table optimization
DROP POLICY IF EXISTS "Patients view own record" ON public.patients;
CREATE POLICY "Patients view own record" ON public.patients
FOR SELECT USING (
  id::text = (SELECT patient_id FROM public.profiles WHERE id = (SELECT auth.uid()))
);

-- Appointments table optimization
DROP POLICY IF EXISTS "Patients view own appointments" ON public.appointments;
CREATE POLICY "Patients view own appointments" ON public.appointments
FOR SELECT USING (
  patient_id::text = (SELECT patient_id FROM public.profiles WHERE id = (SELECT auth.uid()))
);

-- Prescriptions table optimization
DROP POLICY IF EXISTS "Patients view own prescriptions" ON public.prescriptions;
CREATE POLICY "Patients view own prescriptions" ON public.prescriptions
FOR SELECT USING (
  patient_id::text = (SELECT patient_id FROM public.profiles WHERE id = (SELECT auth.uid()))
);

-- Re-run the God Mode Admin policy wrapper with the optimized function
DO $$ 
DECLARE
  tables text[] := ARRAY[
    'patients', 'appointments', 'tooth_records', 'prescriptions', 
    'vital_signs', 'earnings_transactions', 'accounts_ledger', 
    'inventory_products', 'staff_members', 'equipment', 'maintenance_logs',
    'suppliers', 'sterilization_logs', 'kanban_tasks', 'consent_signatures',
    'profiles', 'attendance_logs', 'clinical_photos', 'inventory_stock'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Admins have full access" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Admins have full access" ON public.%I FOR ALL USING (public.get_auth_role() = ''admin'');', t);
  END LOOP;
END $$;
