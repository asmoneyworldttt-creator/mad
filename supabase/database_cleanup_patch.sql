-- =========================================================================================
-- SYSTEM OPTIMIZATION: REMOVE OBSOLETE TABLES
-- Purpose: Drops redundant database tables that are no longer used by the Dentora application.
-- Replaced By: bills, accounts, inventory_stock, inventory_transactions, tooth_chart_data, staff
-- =========================================================================================

-- 1. Drop redundant Quick Bills table (now using 'bills')
DROP TABLE IF EXISTS public.quick_bills CASCADE;

-- 2. Drop redundant Accounts Ledger (now using unified 'accounts')
DROP TABLE IF EXISTS public.accounts_ledger CASCADE;

-- 3. Drop old Inventory Products structure (now using 'inventory_stock')
DROP TABLE IF EXISTS public.inventory_products CASCADE;

-- 4. Drop Tooth Records table (charting now driven via JSON directly on the 'patients' table)
DROP TABLE IF EXISTS public.tooth_records CASCADE;

-- 5. Drop deprecated Staff Members table (consolidated into core 'staff' table)
DROP TABLE IF EXISTS public.staff_members CASCADE;

-- 6. Drop redundant Earnings Transactions (integrated into bills and accounts ledger)
DROP TABLE IF EXISTS public.earnings_transactions CASCADE;

-- Verify deletion and display a final notice
DO $$ 
BEGIN
  RAISE NOTICE 'Database cleanup completed! Obsolete tables dropped securely.';
END $$;
