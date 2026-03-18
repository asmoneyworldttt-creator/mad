-- Fix for missing metadata and correct column types on lab_orders
-- Run this script in your Supabase Dashboard SQL Editor to solve the "Could not find column metadata" cache issue.

ALTER TABLE IF EXISTS public.lab_orders 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Notify successful execution
COMMENT ON COLUMN public.lab_orders.metadata IS 'Stores full json configuration details for visual tracking on advice matrices.';
