-- =============================================================================
-- DentiSphere — Consent Forms & Installment Plans Tables
-- Run in Supabase SQL Editor
-- =============================================================================

-- Consent Forms
CREATE TABLE IF NOT EXISTS public.consent_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT,
    template_id TEXT,
    title TEXT NOT NULL,
    body TEXT,
    doctor_name TEXT,
    status VARCHAR(50) DEFAULT 'Signed',
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.consent_forms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.consent_forms;
CREATE POLICY "Allow all" ON public.consent_forms FOR ALL USING (true) WITH CHECK (true);

-- Installment Plans
CREATE TABLE IF NOT EXISTS public.installment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT,
    total_amount DECIMAL(12,2) DEFAULT 0,
    down_payment DECIMAL(12,2) DEFAULT 0,
    installments INT DEFAULT 3,
    schedule JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Active',
    start_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.installment_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.installment_plans;
CREATE POLICY "Allow all" ON public.installment_plans FOR ALL USING (true) WITH CHECK (true);
