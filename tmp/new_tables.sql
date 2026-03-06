-- P1-F: Vital Signs table
CREATE TABLE IF NOT EXISTS vital_signs (
    id BIGSERIAL PRIMARY KEY,
    patient_id TEXT REFERENCES patients(id),
    bp_systolic INT,
    bp_diastolic INT,
    pulse INT,
    spo2 INT,
    temperature DECIMAL(4,1),
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all" ON vital_signs;
CREATE POLICY "allow_all" ON vital_signs FOR ALL USING (true);

-- P2-C: Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    priority TEXT DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
    due_date DATE,
    assignee_id BIGINT,
    created_by BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all" ON tasks;
CREATE POLICY "allow_all" ON tasks FOR ALL USING (true);

-- P2-D: Attendance Logs table
CREATE TABLE IF NOT EXISTS attendance_logs (
    id BIGSERIAL PRIMARY KEY,
    staff_id BIGINT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    method TEXT DEFAULT 'manual',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all" ON attendance_logs;
CREATE POLICY "allow_all" ON attendance_logs FOR ALL USING (true);

-- Add allergy / medical condition fields to patients if not present
ALTER TABLE patients ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS medical_conditions TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS current_medications TEXT;

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Staff',
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all" ON staff;
CREATE POLICY "allow_all" ON staff FOR ALL USING (true);

-- P2-B: Sterilization & Equipment Compliance Tracker
CREATE TABLE IF NOT EXISTS sterilization_logs (
    id BIGSERIAL PRIMARY KEY,
    equipment_name TEXT NOT NULL,
    cycle_number TEXT,
    method TEXT DEFAULT 'Autoclave',
    temperature DECIMAL(5,2),
    pressure DECIMAL(5,2),
    duration_minutes INT,
    status TEXT DEFAULT 'Passed' CHECK (status IN ('Passed', 'Failed')),
    operator_id BIGINT,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    expiry_date DATE
);
ALTER TABLE sterilization_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all" ON sterilization_logs;
CREATE POLICY "allow_all" ON sterilization_logs FOR ALL USING (true);

-- P2-F: Clinical Photo Gallery
CREATE TABLE IF NOT EXISTS clinical_photos (
    id BIGSERIAL PRIMARY KEY,
    patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    tag TEXT DEFAULT 'Pre-Op',
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE clinical_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all" ON clinical_photos;
CREATE POLICY "allow_all" ON clinical_photos FOR ALL USING (true);
-- P3-A: Patient Loyalty & Referral Rewards Engine
ALTER TABLE patients ADD COLUMN IF NOT EXISTS loyalty_points INT DEFAULT 0;
CREATE TABLE IF NOT EXISTS loyalty_history (
    id BIGSERIAL PRIMARY KEY,
    patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
    points INT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE loyalty_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all" ON loyalty_history;
CREATE POLICY "allow_all" ON loyalty_history FOR ALL USING (true);
