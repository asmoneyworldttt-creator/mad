-- DentiSphere Full Flow Synchronization Script
-- This script ensures ALL modules have real database tables and permissions.

-- 1. Accounts Table (Income & Expenses)
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT CHECK (type IN ('income', 'expense')),
    category TEXT,
    date DATE DEFAULT CURRENT_DATE,
    remark TEXT,
    amount NUMERIC DEFAULT 0,
    received_amount NUMERIC DEFAULT 0, -- mapping to 'received' in UI
    clinic_id TEXT DEFAULT 'Main Clinic',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Prescriptions Fix (Adding medication_data column if missing)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='prescriptions' AND column_name='medication_data') THEN
        ALTER TABLE public.prescriptions ADD COLUMN medication_data JSONB;
    END IF;
END $$;

-- 3. Patient History Enhancements
ALTER TABLE public.patient_history 
ADD COLUMN IF NOT EXISTS medicine TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. Enable RLS and Policies for new tables
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow anon read/write accounts" ON public.accounts;
    CREATE POLICY "Allow anon read/write accounts" ON public.accounts FOR ALL USING (true) WITH CHECK (true);
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 5. Seed some initial account data if empty
INSERT INTO public.accounts (type, category, remark, amount, received_amount)
SELECT 'income', 'Hospital Visits', 'Initial Consulting Fee', 1500, 1500
WHERE NOT EXISTS (SELECT 1 FROM public.accounts WHERE remark = 'Initial Consulting Fee');

INSERT INTO public.accounts (type, category, remark, amount)
SELECT 'expense', 'Staff Salary', 'March Payout', 45000
WHERE NOT EXISTS (SELECT 1 FROM public.accounts WHERE remark = 'March Payout');
