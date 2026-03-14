-- DENTISPHERE STAFF MANAGEMENT & ATTENDANCE PATCH
-- This script implements advanced staff tracking, unique IDs, and attendance logging.

-- 1. ENHANCE STAFF TABLE
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS staff_external_id TEXT UNIQUE;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS joining_date DATE DEFAULT CURRENT_DATE;

-- Populate existing staff with IDs if they don't have one
-- If ID is already a string like 'DOC-100', use it directly. Otherwise prefix it.
UPDATE public.staff 
SET staff_external_id = CASE 
    WHEN id::text ~ '^[0-9]+$' THEN 'EMP-' || LPAD(id::text, 4, '0')
    ELSE id::text
END
WHERE staff_external_id IS NULL;

-- 2. ENHANCE ATTENDANCE LOGS
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id TEXT REFERENCES public.staff(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    break_start TIMESTAMPTZ,
    break_end TIMESTAMPTZ,
    total_break_minutes INT DEFAULT 0,
    working_hours DECIMAL(5,2) DEFAULT 0,
    status TEXT DEFAULT 'Checked-out', -- 'Checked-in', 'On Break', 'Checked-out'
    method TEXT DEFAULT 'manual',
    location_metadata JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If table existed, add missing columns
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS break_start TIMESTAMPTZ;
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS break_end TIMESTAMPTZ;
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS total_break_minutes INT DEFAULT 0;
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS working_hours DECIMAL(5,2) DEFAULT 0;
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Checked-out';

-- 3. STAFF LEAVE TRACKING (For History view)
CREATE TABLE IF NOT EXISTS public.staff_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id TEXT REFERENCES public.staff(id) ON DELETE CASCADE,
    leave_date DATE NOT NULL,
    leave_type TEXT DEFAULT 'Casual', -- 'Casual', 'Medical', 'Other'
    reason TEXT,
    status TEXT DEFAULT 'Approved',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS POLICIES
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_leaves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.attendance_logs;
CREATE POLICY "Allow all for authenticated" ON public.attendance_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.staff_leaves;
CREATE POLICY "Allow all for authenticated" ON public.staff_leaves FOR ALL USING (true) WITH CHECK (true);

-- 5. FUNCTION TO CALCULATE WORKING HOURS
CREATE OR REPLACE FUNCTION public.calculate_working_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.clock_in IS NOT NULL AND NEW.clock_out IS NOT NULL THEN
        -- Calculate total duration in hours, subtracting break minutes
        NEW.working_hours := ROUND(
            (EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 3600.0) - (COALESCE(NEW.total_break_minutes, 0) / 60.0),
            2
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_working_hours ON public.attendance_logs;
CREATE TRIGGER trg_calculate_working_hours
BEFORE INSERT OR UPDATE ON public.attendance_logs
FOR EACH ROW EXECUTE FUNCTION public.calculate_working_hours();

-- 6. AUTO-GENERATE STAFF ID FOR NEW EMPLOYEES
-- Create a sequence to ensure unique IDs across additions/deletions
CREATE SEQUENCE IF NOT EXISTS public.staff_id_seq START WITH 100;

CREATE OR REPLACE FUNCTION public.generate_staff_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.staff_external_id IS NULL THEN
        -- Use nextval from sequence to guarantee uniqueness
        NEW.staff_external_id := 'EMP-' || LPAD(nextval('public.staff_id_seq')::text, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_staff_id ON public.staff;
CREATE TRIGGER trg_generate_staff_id
BEFORE INSERT ON public.staff
FOR EACH ROW EXECUTE FUNCTION public.generate_staff_id();
