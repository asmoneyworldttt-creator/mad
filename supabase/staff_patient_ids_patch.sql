-- Dynamic Staff fields and Unique ID Setup

-- 1. Create Staff ID sequence and update staff table
CREATE SEQUENCE IF NOT EXISTS staff_id_seq START WITH 1;

ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS staff_id TEXT UNIQUE DEFAULT ('STF' || lpad(nextval('staff_id_seq')::text, 3, '0'));
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS profile_photo TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS aadhar_pan TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS bank_details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS role_details JSONB DEFAULT '{}'::jsonb; -- Specialty details stored dynamically

-- 2. Create Patient ID sequence and update patients table
CREATE SEQUENCE IF NOT EXISTS patient_id_seq START WITH 1;

-- If patients already has 'id' as TEXT. We cannot easily alter a primary key to use a default nextval string.
-- Instead, we will add a column 'patient_uid' or simply ensure the application inserts 'PAT' + nextval.
-- But creating a function is easier so application can do: SELECT generate_patient_id()

DROP FUNCTION IF EXISTS generate_patient_id();
CREATE OR REPLACE FUNCTION generate_patient_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'PAT' || lpad(nextval('patient_id_seq')::text, 3, '0');
END;
$$ LANGUAGE plpgsql;
