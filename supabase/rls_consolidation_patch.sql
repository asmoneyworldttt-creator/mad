-- DENTISPHERE RLS CONSOLIDATION PATCH
-- This script fixes "Multiple Permissive Policies" warnings by unifying Admin and Clinical access into single policies.

DO $$ 
DECLARE
  tables text[] := ARRAY[
    'patients', 'appointments', 'tooth_records', 'prescriptions', 
    'vital_signs', 'earnings_transactions', 'accounts_ledger', 
    'inventory_products', 'staff_members', 'equipment', 'maintenance_logs',
    'suppliers', 'sterilization_logs', 'kanban_tasks', 'consent_signatures',
    'profiles', 'attendance_logs', 'clinical_photos', 'inventory_stock',
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
    -- Drop old separate policies
    EXECUTE format('DROP POLICY IF EXISTS "Admins have full access" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Clinicians can access" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Clinicians can manage appointments" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Staff can manage equipment" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Clinicians can manage prescriptions" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Clinicians can manage tooth records" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Clinicians can manage inventory" ON public.%I', t);
    
    -- Create Unified Policy (Covers Admin, Doctor, and Staff)
    EXECUTE format('CREATE POLICY "Staff and Admin Access" ON public.%I FOR ALL USING (public.get_auth_role() IN (''admin'', ''doctor'', ''staff''));', t);
  END LOOP;
END $$;

-- SPECIAL CASES: Ensure Patient Access is preserved but remains distinct where necessary
-- If a table has a patient-specific policy, the "Staff and Admin Access" handles the clinical side, 
-- and the existing patient policies handle the self-service side.
-- Since the roles overlap (authenticator/authenticated), the linter might still warn, 
-- but we have reduced the policy count from 3+ to 2 per table.

-- Re-verify specific patient self-access policies (already optimized in previous steps)
-- Patients only need SELECT access on their specific rows.
