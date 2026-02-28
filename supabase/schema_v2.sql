-- Update existing patients table with new mandatory fields
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Create staff roles and permissions table
CREATE TABLE IF NOT EXISTS public.staff (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT UNIQUE, -- can be linked to supabase auth later
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    mobile TEXT,
    email TEXT UNIQUE,
    address TEXT,
    qualifications TEXT,
    degree TEXT,
    grad_year INTEGER,
    license_number TEXT,
    permissions JSONB DEFAULT '{"dashboard": true, "appointments": true, "emr": true}'::jsonb,
    is_master BOOLEAN DEFAULT false
);

-- Create clinic branches table
CREATE TABLE IF NOT EXISTS public.branches (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT
);

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_id TEXT REFERENCES public.patients(id) ON DELETE CASCADE,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patient files table
CREATE TABLE IF NOT EXISTS public.patient_files (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_id TEXT REFERENCES public.patients(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bills table
CREATE TABLE IF NOT EXISTS public.bills (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_id TEXT REFERENCES public.patients(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    date DATE DEFAULT CURRENT_DATE
);

-- Create case notes table
CREATE TABLE IF NOT EXISTS public.case_notes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_id TEXT REFERENCES public.patients(id) ON DELETE CASCADE,
    notes TEXT,
    pending_treatments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;

-- Demo mode permissive policies
CREATE POLICY "Allow anon read/write access" ON public.staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write access" ON public.branches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write access" ON public.prescriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write access" ON public.patient_files FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write access" ON public.bills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write access" ON public.case_notes FOR ALL USING (true) WITH CHECK (true);
