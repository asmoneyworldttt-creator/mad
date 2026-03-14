-- Database Patch: Clinical Sync & History Enhancements
-- This patch ensures all clinical records sync to patient history and adds missing columns.

BEGIN;

-- 1. ENHANCE PATIENT HISTORY
-- Support tracking which doctor performed the action
ALTER TABLE public.patient_history ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE public.patient_history ADD COLUMN IF NOT EXISTS doctor_id TEXT;

-- 2. ENHANCE CLINICAL NOTES (SOAP)
CREATE TABLE IF NOT EXISTS public.clinical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id TEXT, -- Link to staff id
    doctor_name TEXT,
    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. ENHANCE VITAL SIGNS
CREATE TABLE IF NOT EXISTS public.vital_signs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id TEXT,
    doctor_name TEXT,
    bp_systolic INTEGER,
    bp_diastolic INTEGER,
    pulse INTEGER,
    spo2 INTEGER,
    temp NUMERIC,
    weight NUMERIC,
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 4. ENHANCE CONSENT FORMS
CREATE TABLE IF NOT EXISTS public.consent_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id TEXT,
    doctor_name TEXT,
    template_id TEXT,
    title TEXT,
    body TEXT,
    signature_url TEXT, -- Base64 for now, storage later
    status TEXT DEFAULT 'Signed',
    signed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LAB ORDERS (Ensure consistency)
CREATE TABLE IF NOT EXISTS public.lab_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT REFERENCES public.patients(id) ON DELETE CASCADE,
    vendor_name TEXT,
    order_status TEXT DEFAULT 'Pending',
    order_date DATE DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RLS POLICIES (Enforce accessibility)
ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to clinical notes" ON public.clinical_notes;
CREATE POLICY "Public access to clinical notes" ON public.clinical_notes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to vital signs" ON public.vital_signs;
CREATE POLICY "Public access to vital signs" ON public.vital_signs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to consent forms" ON public.consent_forms;
CREATE POLICY "Public access to consent forms" ON public.consent_forms FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to lab orders" ON public.lab_orders;
CREATE POLICY "Public access to lab orders" ON public.lab_orders FOR ALL USING (true) WITH CHECK (true);

COMMIT;
