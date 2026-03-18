-- SQL Patch: Create medical_clearances table
-- Run this in the Supabase SQL Editor

create table if not exists public.medical_clearances (
    id uuid default gen_random_uuid() primary key,
    patient_id text references public.patients(id) on delete cascade,
    doctor_id text,
    doctor_name text not null,
    physician_name text not null,
    provisional_diagnosis text,
    proposed_treatment text,
    medical_history text,
    current_medications text,
    fitness_status text default 'Pending', -- Fit, Fit with Precautions, Unfit
    special_instructions text,
    status text default 'Pending', -- Pending / Received
    signature_url text, -- Base64
    signed_at timestamp with time zone,
    created_at timestamp with time zone default now()
);

alter table public.medical_clearances enable row level security;

-- RLS Policy: Authenticated staff can manage
create policy "Staff can manage medical clearances"
    on public.medical_clearances for all
    using (auth.uid() is not null);

-- Optional: Indexing
create index if not exists idx_med_clearance_patient on public.medical_clearances(patient_id);
create index if not exists idx_med_clearance_created_at on public.medical_clearances(created_at desc);
