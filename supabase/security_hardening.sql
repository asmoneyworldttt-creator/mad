-- DENTISPHERE SECURITY HARDENING & RLS POLICY SUITE
-- This script secures the database for HIPAA compliance by enabling RLS on all clinical tables.

-- 1. UTILITY: FUNCTION TO GET USER ROLE FROM PROFILES
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = (SELECT auth.uid()) LIMIT 1;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. ENABLE RLS ON ALL CORE TABLES
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tooth_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sterilization_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_signatures ENABLE ROW LEVEL SECURITY;

-- 3. GLOBAL ADMIN POLICY (God Mode)
-- Admin can do anything to any table
DO $$ 
DECLARE
  tables text[] := ARRAY[
    'patients', 'appointments', 'tooth_records', 'prescriptions', 
    'vital_signs', 'earnings_transactions', 'accounts_ledger', 
    'inventory_products', 'staff_members', 'equipment', 'maintenance_logs',
    'suppliers', 'sterilization_logs', 'kanban_tasks', 'consent_signatures'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('CREATE POLICY "Admins have full access" ON public.%I FOR ALL USING (public.get_auth_role() = ''admin'');', t);
  END LOOP;
END $$;

-- 4. CLINICAL STAFF POLICIES (Doctors & Staff)
-- Can view and manage clinical data, but maybe not delete everything
-- For simplicity in this clinical demo, we give them broad clinical access

-- Patients & Appointments (View & Update)
CREATE POLICY "Clinicians can manage patients" ON public.patients 
FOR ALL USING (public.get_auth_role() IN ('doctor', 'staff'));

CREATE POLICY "Clinicians can manage appointments" ON public.appointments 
FOR ALL USING (public.get_auth_role() IN ('doctor', 'staff'));

-- Clinical Records (Doctor focus)
CREATE POLICY "Clinicians can manage tooth records" ON public.tooth_records 
FOR ALL USING (public.get_auth_role() IN ('doctor', 'staff'));

CREATE POLICY "Clinicians can manage prescriptions" ON public.prescriptions 
FOR ALL USING (public.get_auth_role() IN ('doctor', 'staff'));

CREATE POLICY "Clinicians can manage vitals" ON public.vital_signs 
FOR ALL USING (public.get_auth_role() IN ('doctor', 'staff'));

-- Logistics (Staff focus)
CREATE POLICY "Staff can manage inventory" ON public.inventory_products 
FOR ALL USING (public.get_auth_role() IN ('doctor', 'staff'));

CREATE POLICY "Staff can manage equipment" ON public.equipment 
FOR ALL USING (public.get_auth_role() IN ('doctor', 'staff'));

CREATE POLICY "Staff can manage logs" ON public.maintenance_logs 
FOR ALL USING (public.get_auth_role() IN ('doctor', 'staff'));

-- 5. PATIENT SELF-ACCESS POLICIES
-- Patients should ONLY see their own records

-- Patient can see their own profile in patients table
-- We match by patient_id stored in user's profile metadata or email
CREATE POLICY "Patients view own record" ON public.patients
FOR SELECT USING (
  id::text = (SELECT patient_id FROM public.profiles WHERE id = (SELECT auth.uid()))
);

-- Appointments (Patient's own)
CREATE POLICY "Patients view own appointments" ON public.appointments
FOR SELECT USING (
  patient_id::text = (SELECT patient_id FROM public.profiles WHERE id = (SELECT auth.uid()))
);

-- Prescriptions (Patient's own)
CREATE POLICY "Patients view own prescriptions" ON public.prescriptions
FOR SELECT USING (
  patient_id::text = (SELECT patient_id FROM public.profiles WHERE id = (SELECT auth.uid()))
);

-- 6. FINANCE PROTECTION (Admin Only)
-- Ensure only admins see the earnings and ledger
-- (Already covered by Admin Global Policy, but we ensure no others have access)
-- No additional policies for non-admins on earnings and ledger.
