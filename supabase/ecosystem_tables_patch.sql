-- DENTISPHERE ECOSYSTEM — MISSING RELATIONS PATCH
-- This script creates the tables required for Phase 2, 3, and 5 modules.

-- 1. Asset & Equipment Management
CREATE TABLE IF NOT EXISTS public.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Operational',
    last_service DATE,
    next_service DATE,
    health INT DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id TEXT, -- Changed to TEXT to support both UUIDs and Integer IDs from demo
    date DATE DEFAULT CURRENT_DATE,
    action_taken TEXT,
    technician TEXT,
    cost DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Supply Chain Nexus
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact TEXT,
    phone TEXT,
    email TEXT,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Active',
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Compliance & Sterilization
CREATE TABLE IF NOT EXISTS public.sterilization_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_number TEXT,
    equipment_id UUID,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'Completed',
    technician TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Loyalty & Growth
CREATE TABLE IF NOT EXISTS public.loyalty_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT,
    points INT DEFAULT 0,
    tier VARCHAR(50) DEFAULT 'Silver',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update patients table to include loyalty if not exists
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS loyalty_points INT DEFAULT 0;

-- 5. Kanban & Task Intelligence
CREATE TABLE IF NOT EXISTS public.kanban_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Todo',
    priority VARCHAR(50) DEFAULT 'Medium',
    assigned_to UUID, -- Link to profiles.id
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Consent & Documentation
CREATE TABLE IF NOT EXISTS public.consent_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT,
    form_type TEXT,
    signature_data TEXT, -- Base64 encoded or JSON path
    signed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for all new tables
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sterilization_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_signatures ENABLE ROW LEVEL SECURITY;
