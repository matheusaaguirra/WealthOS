-- User-owned data only. Existing tables and users are not removed.
create table public.wealthos_financial_state (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null default '{"accounts":[],"transactions":[],"budgets":[],"goals":[]}'::jsonb,
 revision integer not null default 1 check (revision > 0),
 updated_at timestamptz not null default now(),
 constraint wealthos_finance_shape check (
  jsonb_typeof(data)='object' and data ?& array['accounts','transactions','budgets','goals']
  and jsonb_typeof(data->'accounts')='array' and jsonb_typeof(data->'transactions')='array'
  and jsonb_typeof(data->'budgets')='array' and jsonb_typeof(data->'goals')='array'
  and jsonb_array_length(data->'accounts')<=100 and jsonb_array_length(data->'transactions')<=2000
  and jsonb_array_length(data->'budgets')<=100 and jsonb_array_length(data->'goals')<=100
  and octet_length(data::text)<=262144
 )
);
create table public.wealthos_portfolios (
 user_id uuid primary key references auth.users(id) on delete cascade,
 holdings jsonb not null default '[]'::jsonb,
 updated_at timestamptz not null default now(),
 constraint wealthos_portfolio_shape check (jsonb_typeof(holdings)='array' and jsonb_array_length(holdings)<=100 and octet_length(holdings::text)<=16384)
);
alter table public.wealthos_financial_state enable row level security;
alter table public.wealthos_portfolios enable row level security;
revoke all on public.wealthos_financial_state,public.wealthos_portfolios from anon,authenticated;
grant select,insert,update,delete on public.wealthos_financial_state,public.wealthos_portfolios to authenticated;
create policy "Read own finances" on public.wealthos_financial_state for select to authenticated using ((select auth.uid())=user_id);
create policy "Insert own finances" on public.wealthos_financial_state for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Update own finances" on public.wealthos_financial_state for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Delete own finances" on public.wealthos_financial_state for delete to authenticated using ((select auth.uid())=user_id);
create policy "Read own portfolio" on public.wealthos_portfolios for select to authenticated using ((select auth.uid())=user_id);
create policy "Insert own portfolio" on public.wealthos_portfolios for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Update own portfolio" on public.wealthos_portfolios for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Delete own portfolio" on public.wealthos_portfolios for delete to authenticated using ((select auth.uid())=user_id);

-- Invoker rights preserve RLS; the user ID is always taken from the verified JWT.
-- Compare-and-swap rejects stale tabs instead of silently overwriting newer data.
create function public.wealthos_save_financial_state(p_data jsonb,p_expected_revision integer)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare saved public.wealthos_financial_state; owner_id uuid;
begin
 owner_id:=auth.uid();
 if owner_id is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_expected_revision<0 then raise exception 'Invalid revision' using errcode='22023'; end if;
 if p_expected_revision=0 then
  insert into public.wealthos_financial_state(user_id,data,revision) values(owner_id,p_data,1)
  on conflict(user_id) do nothing returning * into saved;
 else
  update public.wealthos_financial_state set data=p_data,revision=revision+1,updated_at=now()
  where user_id=owner_id and revision=p_expected_revision returning * into saved;
 end if;
 if saved.user_id is null then raise exception 'Concurrent modification' using errcode='40001'; end if;
 return jsonb_build_object('data',saved.data,'revision',saved.revision);
end;
$$;
revoke all on function public.wealthos_save_financial_state(jsonb,integer) from public,anon;
grant execute on function public.wealthos_save_financial_state(jsonb,integer) to authenticated;
