-- Dentora — Complete Supabase Database SQL
-- Run each SECTION in order in the Supabase SQL Editor.

-- ════════════════════════════════════════════════════════════
-- SECTION 1: Audit Log Table (HIPAA / DPDP Compliance)
-- ════════════════════════════════════════════════════════════

create table if not exists public.audit_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete set null,
  user_email    text,
  action        text not null,          -- e.g. 'view_patient', 'export_report'
  entity_type   text,                   -- e.g. 'patient', 'appointment'
  entity_id     text,                   -- the record ID that was accessed
  metadata      jsonb,                  -- extra context (search query, filters, etc.)
  ip_address    inet,
  user_agent    text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_audit_log_user_id    on public.audit_log(user_id);
create index if not exists idx_audit_log_created_at on public.audit_log(created_at desc);
create index if not exists idx_audit_log_action     on public.audit_log(action);

alter table public.audit_log enable row level security;

create policy "Admins can read audit log"
  on public.audit_log for select
  using ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

create policy "Any authenticated user can insert audit log"
  on public.audit_log for insert
  with check (auth.uid() is not null);

-- ════════════════════════════════════════════════════════════
-- SECTION 2: Core Medical Tables & RLS
-- ════════════════════════════════════════════════════════════

-- PATIENTS
alter table public.patients enable row level security;
create policy "Staff can manage patients" on public.patients for all using (auth.uid() is not null);

-- APPOINTMENTS
alter table public.appointments enable row level security;
create policy "Staff can manage appointments" on public.appointments for all using (auth.uid() is not null);

-- BILLS & INVOICES
alter table public.bills enable row level security;
create policy "Staff can manage bills" on public.bills for all using (auth.uid() is not null);

-- EMR (PATIENT HISTORY)
alter table public.patient_history enable row level security;
create policy "Medical staff can manage history" on public.patient_history for all using (auth.uid() is not null);

-- PRESCRIPTIONS
alter table public.prescriptions enable row level security;
create policy "Medical staff can manage prescriptions" on public.prescriptions for all using (auth.uid() is not null);

-- LAB ORDERS
alter table public.lab_orders enable row level security;
create policy "Staff can manage lab orders" on public.lab_orders for all using (auth.uid() is not null);

-- ════════════════════════════════════════════════════════════
-- SECTION 3: Inventory Sub-System
-- ════════════════════════════════════════════════════════════

-- STOCK LEVELS
alter table public.inventory_stock enable row level security;
create policy "Staff can view stock" on public.inventory_stock for select using (auth.uid() is not null);
create policy "Admin can manage stock" on public.inventory_stock for all using ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

-- STOCK TRANSACTIONS
alter table public.inventory_transactions enable row level security;
create policy "Staff can manage transactions" on public.inventory_transactions for all using (auth.uid() is not null);

-- PURCHASE ORDERS
alter table public.inventory_purchase_orders enable row level security;
create policy "Admin can manage purchase orders" on public.inventory_purchase_orders for all using ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

-- ════════════════════════════════════════════════════════════
-- SECTION 4: Compliance & Digital Consent
-- ════════════════════════════════════════════════════════════

-- DIGITAL CONSENT FORMS & SIGNATURES
create table if not exists public.consent_forms (
    id uuid default gen_random_uuid() primary key,
    patient_id uuid references public.patients(id) on delete cascade,
    template_id text not null,
    title text not null,
    body text not null,
    doctor_name text not null,
    status text default 'Signed',
    signed_at timestamp with time zone default now(),
    created_at timestamp with time zone default now()
);

alter table public.consent_forms enable row level security;

create policy "staff can manage consent forms"
    on public.consent_forms for all
    using ( (auth.jwt()->'user_metadata'->>'role')::text in ('admin', 'staff', 'doctor') );

create policy "patients can view their own consent forms"
    on public.consent_forms for select
    using ( auth.uid() = patient_id );

-- SESSION TRACKING (GDPR / DPDP Compliance)
create table if not exists public.session_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id),
  event       text,
  created_at  timestamptz default now()
);
alter table public.session_log enable row level security;
create policy "Any user can log session" on public.session_log for insert with check (auth.uid() is not null);
create policy "Admin can view session logs" on public.session_log for select using ( (auth.jwt()->'user_metadata'->>'role') = 'admin' );

-- PATIENT RECTIFICATION (DPDP Article 11)
-- Identifies patients inactive for >7 years
create or replace view public.patients_eligible_for_deletion as
select * from public.patients
where last_visit < now() - interval '7 years'
or (last_visit is null and created_at < now() - interval '7 years');

-- PATIENT DATA PORTABILITY (DPDP Article 11)
create or replace function public.export_patient_data(p_patient_id uuid)
  returns json language plpgsql security definer as $$
declare result json;
begin
  select json_build_object(
    'patient', (select row_to_json(p) from public.patients p where p.id = p_patient_id),
    'appointments', (select json_agg(a) from public.appointments a where a.patient_id = p_patient_id),
    'medical_records', (select json_agg(h) from public.patient_history h where h.patient_id = p_patient_id),
    'billing', (select json_agg(b) from public.bills b where b.patient_id = p_patient_id),
    'consent_forms', (select json_agg(c) from public.consent_forms c where c.patient_id = p_patient_id)
  ) into result;
  return result;
end; $$;

-- ════════════════════════════════════════════════════════════
-- SECTION 5: Performance Optimization (Indexes)
-- ════════════════════════════════════════════════════════════

create index if not exists idx_patients_name on public.patients(name);
create index if not exists idx_appointments_date on public.appointments(date);
create index if not exists idx_bills_date on public.bills(date);
create index if not exists idx_history_patient on public.patient_history(patient_id);
create index if not exists idx_inventory_sku on public.inventory_stock(sku);

-- ════════════════════════════════════════════════════════════
-- END OF SCRIPT
-- ════════════════════════════════════════════════════════════
