-- =============================================================================
-- DentiSphere — Final System Consolidation SQL Patch
-- Consolidates Phase 3 & 4 data structures, fixes naming conflicts, 
-- and ensures role-based panels have the required data hooks.
-- =============================================================================

-- 1. Standardize Vital Signs (Matching VitalSignsPanel.tsx logic)
ALTER TABLE public.vital_signs 
    ADD COLUMN IF NOT EXISTS bp_systolic INT,
    ADD COLUMN IF NOT EXISTS bp_diastolic INT,
    ADD COLUMN IF NOT EXISTS pulse INT,
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- Migration logic if old columns exist (wrapped in DO to prevent errors)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vital_signs' AND column_name='systolic') THEN
        UPDATE public.vital_signs SET bp_systolic = systolic WHERE bp_systolic IS NULL AND systolic IS NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vital_signs' AND column_name='diastolic') THEN
        UPDATE public.vital_signs SET bp_diastolic = diastolic WHERE bp_diastolic IS NULL AND diastolic IS NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vital_signs' AND column_name='heart_rate') THEN
        UPDATE public.vital_signs SET pulse = heart_rate WHERE pulse IS NULL AND heart_rate IS NOT NULL;
    END IF;
END $$;

-- 2. Enhance Appointments (Matching DoctorPanel & LiveQueue logic)
ALTER TABLE public.appointments 
    ADD COLUMN IF NOT EXISTS patient_id TEXT,
    ADD COLUMN IF NOT EXISTS patient_name TEXT,
    ADD COLUMN IF NOT EXISTS doctor_id UUID,
    ADD COLUMN IF NOT EXISTS doctor_name TEXT DEFAULT 'Dr. Jenkins';

-- Sync patient_name from name if name exists (schema.sql uses 'name')
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='name') THEN
        UPDATE public.appointments SET patient_name = name WHERE patient_name IS NULL;
    END IF;
END $$;

-- 3. Enhance Patients (Matching PatientPortal logic)
ALTER TABLE public.patients 
    ADD COLUMN IF NOT EXISTS membership_tier VARCHAR(50) DEFAULT 'Silver',
    ADD COLUMN IF NOT EXISTS treatment_summary TEXT;

-- 4. Bills Table — Final Structural Check
-- Ensuring QuickBills and MasterPanel targets are correct
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE,
    patient_id TEXT,
    patient_name TEXT,
    doctor_name TEXT DEFAULT 'Dr. Jenkins',
    amount DECIMAL(12,2) DEFAULT 0,
    prof_fee DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Paid',
    payment_method VARCHAR(50) DEFAULT 'Cash',
    treatment_name TEXT,
    complaint TEXT,
    notes TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure policies for bills
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.bills;
CREATE POLICY "Allow all" ON public.bills FOR ALL USING (true) WITH CHECK (true);

-- 5. Staff Role Finalization
-- Adding role field to support role-based landing logic
ALTER TABLE public.staff 
    ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'staff',
    ADD COLUMN IF NOT EXISTS performance_rating DECIMAL(3,2) DEFAULT 4.5;

-- 6. Inventory Alias for consistency
-- Some older components might look for 'unit' vs 'measure_unit'
ALTER TABLE public.inventory_stock ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'pcs';

-- 7. Backfill sample data for Role Panels (Optional but helpful for testing)
-- Un-comment if needed for immediate visualization
/*
INSERT INTO public.bills (invoice_number, patient_name, amount, prof_fee, status, date)
VALUES 
('INV-00001', 'Rahul Sharma', 15000, 9000, 'Paid', CURRENT_DATE),
('INV-00002', 'Priya Singh', 4500, 2700, 'Paid', CURRENT_DATE - INTERVAL '1 day'),
('INV-00003', 'John Doe', 28000, 16800, 'Paid', CURRENT_DATE - INTERVAL '2 days');
*/

-- End of Consolidation.
