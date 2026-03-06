-- 🛠️ DentiSphere RLS Comprehensive Cleanup & Consolidation (v5 - Final)
-- This script aggressively drops all known previous policy names and 
-- establishes a clean, single-policy-per-action architecture.

BEGIN;

-- ==========================================
-- 1. APPOINTMENTS CLEANUP
-- ==========================================
DROP POLICY IF EXISTS "Admins have full access" ON appointments;
DROP POLICY IF EXISTS "Clinicians can manage appointments" ON appointments;
DROP POLICY IF EXISTS "Patients view own appointments" ON appointments;
DROP POLICY IF EXISTS "Staff and Admin Access" ON appointments;
DROP POLICY IF EXISTS "Appointments Unified Access" ON appointments;
DROP POLICY IF EXISTS "Appointments Staff Full Access" ON appointments;
DROP POLICY IF EXISTS "Appointments Unified Select" ON appointments;
DROP POLICY IF EXISTS "Appointments Unified Insert" ON appointments;
DROP POLICY IF EXISTS "Appointments Unified Update" ON appointments;
DROP POLICY IF EXISTS "Appointments Unified Delete" ON appointments;
DROP POLICY IF EXISTS "Appointments Staff Insert" ON appointments;
DROP POLICY IF EXISTS "Appointments Staff Update" ON appointments;
DROP POLICY IF EXISTS "Appointments Staff Delete" ON appointments;
DROP POLICY IF EXISTS "Allow all" ON appointments;
DROP POLICY IF EXISTS "Allow anon read/write access" ON appointments;

-- Establishing the NEW CLEAN state for Appointments
CREATE POLICY "Appointments Unified Select" ON appointments FOR SELECT TO public
USING (
  (patient_id::text = (SELECT patient_id FROM public.profiles WHERE id = (SELECT auth.uid()))) OR 
  ((SELECT get_auth_role()) IN ('admin', 'doctor', 'staff'))
);

CREATE POLICY "Appointments Unified Insert" ON appointments FOR INSERT TO public
WITH CHECK (((SELECT get_auth_role()) IN ('admin', 'doctor', 'staff')));

CREATE POLICY "Appointments Unified Update" ON appointments FOR UPDATE TO public
USING (((SELECT get_auth_role()) IN ('admin', 'doctor', 'staff')));

CREATE POLICY "Appointments Unified Delete" ON appointments FOR DELETE TO public
USING (((SELECT get_auth_role()) IN ('admin', 'doctor', 'staff')));


-- ==========================================
-- 2. PATIENTS CLEANUP
-- ==========================================
DROP POLICY IF EXISTS "Admins have full access" ON patients;
DROP POLICY IF EXISTS "Clinicians can manage patients" ON patients;
DROP POLICY IF EXISTS "Patients view own record" ON patients;
DROP POLICY IF EXISTS "Staff and Admin Access" ON patients;
DROP POLICY IF EXISTS "Patients Unified Access" ON patients;
DROP POLICY IF EXISTS "Patients Staff Full Access" ON patients;
DROP POLICY IF EXISTS "Patients Unified Select" ON patients;
DROP POLICY IF EXISTS "Patients Unified Insert" ON patients;
DROP POLICY IF EXISTS "Patients Unified Update" ON patients;
DROP POLICY IF EXISTS "Patients Unified Delete" ON patients;
DROP POLICY IF EXISTS "Patients Staff Insert" ON patients;
DROP POLICY IF EXISTS "Patients Staff Update" ON patients;
DROP POLICY IF EXISTS "Patients Staff Delete" ON patients;
DROP POLICY IF EXISTS "Allow all" ON patients;
DROP POLICY IF EXISTS "Allow anon read/write access" ON patients;

-- Establishing the NEW CLEAN state for Patients
CREATE POLICY "Patients Unified Select" ON patients FOR SELECT TO public
USING (
  (id::text = (SELECT patient_id FROM public.profiles WHERE id = (SELECT auth.uid()))) OR 
  ((SELECT get_auth_role()) IN ('admin', 'doctor', 'staff'))
);

CREATE POLICY "Patients Unified Insert" ON patients FOR INSERT TO public
WITH CHECK (((SELECT get_auth_role()) IN ('admin', 'doctor', 'staff')));

CREATE POLICY "Patients Unified Update" ON patients FOR UPDATE TO public
USING (((SELECT get_auth_role()) IN ('admin', 'doctor', 'staff')));

CREATE POLICY "Patients Unified Delete" ON patients FOR DELETE TO public
USING (((SELECT get_auth_role()) IN ('admin', 'doctor', 'staff')));


-- ==========================================
-- 3. PRESCRIPTIONS CLEANUP
-- ==========================================
DROP POLICY IF EXISTS "Admins have full access" ON prescriptions;
DROP POLICY IF EXISTS "Clinicians can manage prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Patients view own prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Staff and Admin Access" ON prescriptions;
DROP POLICY IF EXISTS "Prescriptions Unified Access" ON prescriptions;
DROP POLICY IF EXISTS "Prescriptions Staff Full Access" ON prescriptions;
DROP POLICY IF EXISTS "Prescriptions Unified Select" ON prescriptions;
DROP POLICY IF EXISTS "Prescriptions Unified Insert" ON prescriptions;
DROP POLICY IF EXISTS "Prescriptions Unified Update" ON prescriptions;
DROP POLICY IF EXISTS "Prescriptions Unified Delete" ON prescriptions;
DROP POLICY IF EXISTS "Prescriptions Staff Insert" ON prescriptions;
DROP POLICY IF EXISTS "Prescriptions Staff Update" ON prescriptions;
DROP POLICY IF EXISTS "Prescriptions Staff Delete" ON prescriptions;
DROP POLICY IF EXISTS "Allow all" ON prescriptions;

-- Establishing the NEW CLEAN state for Prescriptions
CREATE POLICY "Prescriptions Unified Select" ON prescriptions FOR SELECT TO public
USING (
  (patient_id::text = (SELECT patient_id FROM public.profiles WHERE id = (SELECT auth.uid()))) OR 
  ((SELECT get_auth_role()) IN ('admin', 'doctor', 'staff'))
);

CREATE POLICY "Prescriptions Unified Insert" ON prescriptions FOR INSERT TO public
WITH CHECK (((SELECT get_auth_role()) IN ('admin', 'doctor', 'staff')));

CREATE POLICY "Prescriptions Unified Update" ON prescriptions FOR UPDATE TO public
USING (((SELECT get_auth_role()) IN ('admin', 'doctor', 'staff')));

CREATE POLICY "Prescriptions Unified Delete" ON prescriptions FOR DELETE TO public
USING (((SELECT get_auth_role()) IN ('admin', 'doctor', 'staff')));


-- ==========================================
-- 4. PROFILES CLEANUP
-- ==========================================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Staff and Admin Access" ON profiles;
DROP POLICY IF EXISTS "Profiles Unified Select" ON profiles;
DROP POLICY IF EXISTS "Profiles Unified Update" ON profiles;

CREATE POLICY "Profiles Unified Select" ON profiles FOR SELECT TO public
USING (true);

CREATE POLICY "Profiles Unified Update" ON profiles FOR UPDATE TO public
USING (
  (id = (SELECT auth.uid())) OR 
  ((SELECT get_auth_role()) IN ('admin', 'doctor', 'staff'))
);


-- ==========================================
-- 5. OTHER CRITICAL CLEANUP (Redundancy Removal)
-- ==========================================
-- Inventory
DROP POLICY IF EXISTS "Staff and Admin Access" ON inventory_products;
DROP POLICY IF EXISTS "Staff can manage inventory" ON inventory_products;
DROP POLICY IF EXISTS "Admins have full access" ON inventory_products;

-- Maintenance Logs
DROP POLICY IF EXISTS "Staff and Admin Access" ON maintenance_logs;
DROP POLICY IF EXISTS "Staff can manage logs" ON maintenance_logs;
DROP POLICY IF EXISTS "Admins have full access" ON maintenance_logs;

-- Vital Signs
DROP POLICY IF EXISTS "Staff and Admin Access" ON vital_signs;
DROP POLICY IF EXISTS "Clinicians can manage vitals" ON vital_signs;
DROP POLICY IF EXISTS "Admins have full access" ON vital_signs;

-- Re-apply generic "Staff and Admin Access" only if specific write policies are not enough
CREATE POLICY "Staff and Admin Access" ON inventory_products FOR ALL 
USING (((SELECT get_auth_role()) IN ('admin', 'doctor', 'staff')));

CREATE POLICY "Staff and Admin Access" ON maintenance_logs FOR ALL 
USING (((SELECT get_auth_role()) IN ('admin', 'doctor', 'staff')));

CREATE POLICY "Staff and Admin Access" ON vital_signs FOR ALL 
USING (((SELECT get_auth_role()) IN ('admin', 'doctor', 'staff')));

COMMIT;
