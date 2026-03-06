-- =============================================================================
-- DentiSphere — Missing Tables Schema (No FK Constraints)
-- Run this in Supabase SQL Editor
-- FKs removed to avoid dependency on pre-existing tables
-- =============================================================================

-- Prescriptions
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT,
    medication_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.prescriptions;
CREATE POLICY "Allow all" ON public.prescriptions FOR ALL USING (true) WITH CHECK (true);

-- Treatment Plans
CREATE TABLE IF NOT EXISTS public.treatment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT,
    title TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft',
    total_cost DECIMAL(12,2) DEFAULT 0,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.treatment_plans;
CREATE POLICY "Allow all" ON public.treatment_plans FOR ALL USING (true) WITH CHECK (true);

-- Treatment Plan Items
CREATE TABLE IF NOT EXISTS public.treatment_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID,
    treatment_name TEXT NOT NULL,
    tooth_reference TEXT,
    estimated_sessions INT DEFAULT 1,
    cost DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Pending',
    scheduled_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.treatment_plan_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.treatment_plan_items;
CREATE POLICY "Allow all" ON public.treatment_plan_items FOR ALL USING (true) WITH CHECK (true);

-- Inventory Stock
CREATE TABLE IF NOT EXISTS public.inventory_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name TEXT NOT NULL,
    category VARCHAR(100),
    quantity INT DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'pcs',
    reorder_level INT DEFAULT 10,
    supplier TEXT,
    cost_per_unit DECIMAL(10,2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Patch existing table if it was created without some columns
ALTER TABLE public.inventory_stock ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'pcs';
ALTER TABLE public.inventory_stock ADD COLUMN IF NOT EXISTS reorder_level INT DEFAULT 10;
ALTER TABLE public.inventory_stock ADD COLUMN IF NOT EXISTS supplier TEXT;
ALTER TABLE public.inventory_stock ADD COLUMN IF NOT EXISTS cost_per_unit DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.inventory_stock ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.inventory_stock ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.inventory_stock ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.inventory_stock;
CREATE POLICY "Allow all" ON public.inventory_stock FOR ALL USING (true) WITH CHECK (true);

-- Inventory Transactions
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID,
    product_name TEXT,
    transaction_type VARCHAR(50),
    quantity INT DEFAULT 1,
    grand_total DECIMAL(10,2) DEFAULT 0,
    remarks TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.inventory_transactions;
CREATE POLICY "Allow all" ON public.inventory_transactions FOR ALL USING (true) WITH CHECK (true);

-- Inventory Purchase Orders
CREATE TABLE IF NOT EXISTS public.inventory_purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name TEXT,
    vendor_name TEXT,
    order_status VARCHAR(50) DEFAULT 'Pending',
    grand_total DECIMAL(10,2) DEFAULT 0,
    order_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.inventory_purchase_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.inventory_purchase_orders;
CREATE POLICY "Allow all" ON public.inventory_purchase_orders FOR ALL USING (true) WITH CHECK (true);

-- Payroll Transactions
CREATE TABLE IF NOT EXISTS public.payroll_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id TEXT,
    staff_name TEXT,
    role_title TEXT,
    month_year VARCHAR(7),
    salary_amount DECIMAL(12,2) DEFAULT 0,
    bonus_amount DECIMAL(12,2) DEFAULT 0,
    deductions DECIMAL(12,2) DEFAULT 0,
    net_paid DECIMAL(12,2) DEFAULT 0,
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_status VARCHAR(50) DEFAULT 'Paid',
    payment_method VARCHAR(100) DEFAULT 'Bank Transfer',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payroll_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.payroll_transactions;
CREATE POLICY "Allow all" ON public.payroll_transactions FOR ALL USING (true) WITH CHECK (true);

-- Vital Signs
CREATE TABLE IF NOT EXISTS public.vital_signs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT,
    systolic INT,
    diastolic INT,
    heart_rate INT,
    temperature DECIMAL(4,1),
    spo2 INT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.vital_signs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.vital_signs;
CREATE POLICY "Allow all" ON public.vital_signs FOR ALL USING (true) WITH CHECK (true);

-- Clinical Photos
CREATE TABLE IF NOT EXISTS public.clinical_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT,
    url TEXT NOT NULL,
    caption TEXT,
    category VARCHAR(100) DEFAULT 'General',
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.clinical_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.clinical_photos;
CREATE POLICY "Allow all" ON public.clinical_photos FOR ALL USING (true) WITH CHECK (true);

-- Sample inventory stock removed to avoid column mismatch on pre-existing tables.
-- Add items manually through the Inventory module in the app.
