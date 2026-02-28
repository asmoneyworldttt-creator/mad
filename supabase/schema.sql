-- patients table
CREATE TABLE IF NOT EXISTS public.patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT,
    phone TEXT,
    email TEXT,
    blood_group TEXT,
    last_visit DATE,
    total_spent NUMERIC
);

-- patient history (treatments) table
CREATE TABLE IF NOT EXISTS public.patient_history (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES public.patients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    treatment TEXT,
    category TEXT,
    cost NUMERIC,
    notes TEXT,
    tooth INTEGER
);

-- treatments master table
CREATE TABLE IF NOT EXISTS public.treatments_master (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL
);

-- appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    time TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    date TEXT
);

-- pending appointments table
CREATE TABLE IF NOT EXISTS public.pending_appointments (
    id TEXT PRIMARY KEY,
    name TEXT,
    time TEXT,
    type TEXT
);

-- Optionally add row level security (RLS) policies
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_appointments ENABLE ROW LEVEL SECURITY;

-- Anonymous users can read metadata (if needed) but let's allow all for demo purposes:
CREATE POLICY "Allow anon read/write access" ON public.patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write access" ON public.patient_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write access" ON public.treatments_master FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write access" ON public.appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write access" ON public.pending_appointments FOR ALL USING (true) WITH CHECK (true);
