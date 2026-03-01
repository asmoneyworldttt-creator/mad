-- DentiSphere Schema Fix & Enhancement
-- This script ensures all tables for Lab and Inventory exist and have proper relationships.

-- 1. Ensure Inventory tables exist
CREATE TABLE IF NOT EXISTS public.inventory_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name TEXT NOT NULL,
    manufacturer TEXT,
    category TEXT,
    type TEXT,
    quantity INTEGER DEFAULT 0,
    rate NUMERIC DEFAULT 0,
    clinic_id TEXT DEFAULT 'Main Clinic',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.inventory_stock(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('in', 'out')),
    quantity INTEGER NOT NULL,
    rate NUMERIC,
    total NUMERIC,
    date DATE DEFAULT CURRENT_DATE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ensure Lab orders table exists and has correct foreign key
CREATE TABLE IF NOT EXISTS public.lab_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT REFERENCES public.patients(id) ON DELETE SET NULL,
    test_name TEXT NOT NULL,
    lab_name TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled', 'Sent', 'Trial Received', 'Delivered to Patient')),
    cost NUMERIC DEFAULT 0,
    result_url TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS and add idempotent policies
ALTER TABLE public.inventory_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow anon read/write inventory_stock" ON public.inventory_stock;
    CREATE POLICY "Allow anon read/write inventory_stock" ON public.inventory_stock FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Allow anon read/write inventory_transactions" ON public.inventory_transactions;
    CREATE POLICY "Allow anon read/write inventory_transactions" ON public.inventory_transactions FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Allow anon read/write lab_orders" ON public.lab_orders;
    CREATE POLICY "Allow anon read/write lab_orders" ON public.lab_orders FOR ALL USING (true) WITH CHECK (true);
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 4. Seed basic inventory if empty
INSERT INTO public.inventory_stock (product_name, manufacturer, category, type, quantity, rate)
SELECT 'Composite Resin A2', '3M ESPE', 'Restorative', 'Consumable', 50, 1200
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_stock WHERE product_name = 'Composite Resin A2');

INSERT INTO public.inventory_stock (product_name, manufacturer, category, type, quantity, rate)
SELECT 'Dental Mirror #4', 'Hu-Friedy', 'Diagnostic', 'Instrument', 20, 450
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_stock WHERE product_name = 'Dental Mirror #4');
