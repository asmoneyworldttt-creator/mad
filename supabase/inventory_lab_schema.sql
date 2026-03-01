-- INVENTORY AND LAB SCHEMA
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
    product_id UUID REFERENCES public.inventory_stock(id),
    type TEXT CHECK (type IN ('in', 'out')),
    quantity INTEGER NOT NULL,
    rate NUMERIC,
    total NUMERIC,
    date DATE DEFAULT CURRENT_DATE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lab_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT REFERENCES public.patients(id),
    test_name TEXT NOT NULL,
    lab_name TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
    cost NUMERIC DEFAULT 0,
    result_url TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEED SOME INVENTORY
INSERT INTO public.inventory_stock (product_name, manufacturer, category, type, quantity, rate)
VALUES 
('Composite Resin A2', '3M ESPE', 'Restorative', 'Consumable', 50, 1200),
('Dental Mirror #4', 'Hu-Friedy', 'Diagnostic', 'Instrument', 20, 450),
('Alginate Powder', 'Zhermack', 'Impression', 'Consumable', 15, 800),
('Lidocaine 2%', 'Septodont', 'Anesthesia', 'Consumable', 100, 45);

-- SEED SOME LAB ORDERS
INSERT INTO public.lab_orders (patient_id, test_name, lab_name, status, cost)
SELECT id, 'Zirconia Crown', 'City Dental Lab', 'Pending', 4500 FROM public.patients LIMIT 5;

-- Enable RLS
ALTER TABLE public.inventory_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read/write inventory_stock" ON public.inventory_stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write inventory_transactions" ON public.inventory_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write lab_orders" ON public.lab_orders FOR ALL USING (true) WITH CHECK (true);
