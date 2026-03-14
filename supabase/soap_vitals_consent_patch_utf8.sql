-- SOAP Notes, Vitals, and Consent Forms Patch
BEGIN;

-- 1. Update clinical_notes
ALTER TABLE public.clinical_notes ADD COLUMN IF NOT EXISTS doctor_name TEXT;

-- 2. Update vital_signs
-- Aligning with bp_systolic, bp_diastolic, pulse used in code
ALTER TABLE public.vital_signs ADD COLUMN IF NOT EXISTS bp_systolic INT;
ALTER TABLE public.vital_signs ADD COLUMN IF NOT EXISTS bp_diastolic INT;
ALTER TABLE public.vital_signs ADD COLUMN IF NOT EXISTS pulse INT;
ALTER TABLE public.vital_signs ADD COLUMN IF NOT EXISTS spo2 INT; -- already exists but ensuring
ALTER TABLE public.vital_signs ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.vital_signs ADD COLUMN IF NOT EXISTS doctor_id UUID;
ALTER TABLE public.vital_signs ADD COLUMN IF NOT EXISTS doctor_name TEXT;

-- 3. Update consent_forms
ALTER TABLE public.consent_forms ADD COLUMN IF NOT EXISTS doctor_id UUID;
ALTER TABLE public.consent_forms ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- 4. Set RLS to allow all for authenticated users (as per user's 'always show' requirement)
-- already handled by previous patches mostly, but ensuring the new tables/cols are accessible.
-- CREATE POLICY \
Allow
all
authenticated\ ON public.vital_signs FOR ALL TO authenticated USING (true) WITH CHECK (true);

COMMIT;
