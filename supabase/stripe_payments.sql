-- Payments table for Stripe checkout sessions and records
create table if not exists public.payments (
  id bigint primary key generated always as identity,
  formality_id bigint not null references public.formalities(id) on delete cascade,
  stripe_session_id text,
  stripe_payment_intent_id text,
  status text not null default 'created',
  amount integer not null, -- in cents
  currency text not null default 'eur',
  customer_email text,
  url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_formality_id_idx on public.payments(formality_id);
create index if not exists payments_stripe_session_idx on public.payments(stripe_session_id);
create index if not exists payments_stripe_pi_idx on public.payments(stripe_payment_intent_id);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.payments enable row level security;

-- Policy: allow select to authenticated users involved in the formality (formalist or client)
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments
  for select to authenticated
  using (
    exists (
      select 1 from public.formalities f
      where f.id = payments.formality_id
      and (
        f.formalist_id = auth.uid() or
        exists (
          select 1 from public.formality_clients fc
          where fc.formality_id = f.id and fc.client_id = auth.uid()
        )
      )
    )
  );

-- Policy: allow insert by the formalist assigned to the formality
drop policy if exists payments_insert on public.payments;
create policy payments_insert on public.payments
  for insert to authenticated
  with check (
    exists (
      select 1 from public.formalities f
      where f.id = formality_id and f.formalist_id = auth.uid()
    )
  );

-- Policy: allow update by the formalist; webhook with service role bypasses RLS
drop policy if exists payments_update on public.payments;
create policy payments_update on public.payments
  for update to authenticated
  using (
    exists (
      select 1 from public.formalities f
      where f.id = payments.formality_id and f.formalist_id = auth.uid()
    )
  );

-- Optional: when a payment is marked paid, auto-advance formality status to 'paid'
-- This is done by webhook normally. For safety, provide trigger as well.
create or replace function public.mark_formality_paid()
returns trigger as $$
begin
  if new.status in ('paid','succeeded') then
    update public.formalities set status = 'paid' where id = new.formality_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_payments_mark_paid on public.payments;
create trigger trg_payments_mark_paid
after insert or update on public.payments
for each row execute function public.mark_formality_paid();

