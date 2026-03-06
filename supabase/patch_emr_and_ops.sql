-- =============================================================================
-- DentiSphere — Phase 3 SQL Patch (EMR & Operations)
-- Run in Supabase SQL Editor
-- =============================================================================

-- 1. Tasks Table (Kanban)
CREATE TABLE IF NOT EXISTS public.tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo', -- todo, in_progress, done
    priority VARCHAR(50) DEFAULT 'Normal', -- Low, Normal, High, Urgent
    due_date DATE,
    assignee_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.tasks;
CREATE POLICY "Allow all" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

-- 2. Sterilization Logs Table
CREATE TABLE IF NOT EXISTS public.sterilization_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_name TEXT,
    cycle_number TEXT,
    method TEXT DEFAULT 'Autoclave',
    temperature DECIMAL(5,2),
    pressure DECIMAL(5,2),
    duration_minutes INT,
    status VARCHAR(50) DEFAULT 'Passed',
    expiry_date DATE,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.sterilization_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.sterilization_logs;
CREATE POLICY "Allow all" ON public.sterilization_logs FOR ALL USING (true) WITH CHECK (true);

-- 3. Loyalty History Table
CREATE TABLE IF NOT EXISTS public.loyalty_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT,
    points INT,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.loyalty_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.loyalty_history;
CREATE POLICY "Allow all" ON public.loyalty_history FOR ALL USING (true) WITH CHECK (true);

-- 4. Clinical Photos Table
CREATE TABLE IF NOT EXISTS public.clinical_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT,
    url TEXT NOT NULL,
    tag TEXT DEFAULT 'General',
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.clinical_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.clinical_photos;
CREATE POLICY "Allow all" ON public.clinical_photos FOR ALL USING (true) WITH CHECK (true);

-- 5. Clinical (SOAP) Notes Table
CREATE TABLE IF NOT EXISTS public.clinical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT,
    doctor_id UUID,
    subjective TEXT, -- Patient's chief complaints
    objective TEXT,  -- Doctor's findings
    assessment TEXT, -- Diagnosis
    plan TEXT,       -- Treatment plan progress
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.clinical_notes;
CREATE POLICY "Allow all" ON public.clinical_notes FOR ALL USING (true) WITH CHECK (true);

-- 6. Add Loyalty Points + Missing Patient Fields
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS loyalty_points INT DEFAULT 0;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS medical_conditions TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS current_medications TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS tooth_chart_data JSONB DEFAULT '{}'::jsonb;

-- 7. Ensure Storage Buckets (Run individually if this fails due to restricted storage access)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('clinical-assets', 'clinical-assets', true) ON CONFLICT (id) DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('patient-records', 'patient-records', true) ON CONFLICT (id) DO NOTHING;
