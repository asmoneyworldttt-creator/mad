-- DENTISPHERE GEOFENCING & FACE RECOGNITION ATTENDANCE SYSTEM PATCH

-- 1. UPDATE BRANCHES TABLE
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS latitude DECIMAL(12,8);
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS longitude DECIMAL(12,8);
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS radius INT DEFAULT 100; -- in meters
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Trigger to maintain single default location
CREATE OR REPLACE FUNCTION public.maintain_single_default_branch()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default THEN
        UPDATE public.branches SET is_default = false WHERE id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_maintain_single_default_branch ON public.branches;
CREATE TRIGGER trg_maintain_single_default_branch
BEFORE INSERT OR UPDATE ON public.branches
FOR EACH ROW EXECUTE FUNCTION public.maintain_single_default_branch();

-- 2. UPDATE STAFF TABLE
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS face_descriptor JSONB; -- serialized float32[128]
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS assigned_location_id TEXT; 
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS assigned_location_type TEXT DEFAULT 'default';
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS custom_latitude DECIMAL(12,8);
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS custom_longitude DECIMAL(12,8);
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS custom_radius INT;

-- 3. UPDATE ATTENDANCE LOGS TABLE
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS latitude DECIMAL(12,8);
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS longitude DECIMAL(12,8);
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS distance_meters FLOAT;
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS location_verified BOOLEAN DEFAULT false;
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS face_verified BOOLEAN DEFAULT false;
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS face_match_score FLOAT;
