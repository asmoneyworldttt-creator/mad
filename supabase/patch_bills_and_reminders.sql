-- =============================================================================
-- DentiSphere — Patch existing bills table with missing columns
-- Run in Supabase SQL Editor
-- =============================================================================

-- Patch bills table with extra columns used by QuickBills
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS prof_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100) DEFAULT 'Cash';
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS treatment_name TEXT;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS complaint TEXT;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS gst_number TEXT;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- Backfill invoice numbers for existing bills that don't have one
WITH numbered AS (
    SELECT id, 'INV-' || LPAD(CAST(ROW_NUMBER() OVER (ORDER BY date) AS TEXT), 5, '0') AS inv_no
    FROM public.bills
    WHERE invoice_number IS NULL
)
UPDATE public.bills
SET invoice_number = numbered.inv_no
FROM numbered
WHERE public.bills.id = numbered.id;

-- Patch accounts table
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100) DEFAULT 'Cash';
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS reference_id TEXT;

-- Patch patients table
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Reminders table (new)
CREATE TABLE IF NOT EXISTS public.appointment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id TEXT,
    patient_name TEXT NOT NULL,
    patient_phone TEXT,
    appointment_date DATE,
    appointment_time TEXT,
    appointment_type TEXT,
    reminder_type VARCHAR(50) DEFAULT 'WhatsApp',
    status VARCHAR(50) DEFAULT 'Pending',
    sent_at TIMESTAMPTZ,
    message_body TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.appointment_reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.appointment_reminders;
CREATE POLICY "Allow all" ON public.appointment_reminders FOR ALL USING (true) WITH CHECK (true);
