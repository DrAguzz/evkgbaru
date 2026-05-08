
-- Demo role claim helpers (so prototype users can become rider/admin without backend access)
create or replace function public.claim_rider_profile()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rid uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  insert into public.user_roles(user_id, role) values (uid, 'rider')
    on conflict do nothing;
  -- already linked?
  select id into rid from public.riders where user_id = uid limit 1;
  if rid is not null then return rid; end if;
  -- claim first unclaimed rider
  update public.riders set user_id = uid
    where id = (select id from public.riders where user_id is null order by created_at limit 1)
    returning id into rid;
  return rid;
end; $$;

create or replace function public.claim_admin_role()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  insert into public.user_roles(user_id, role) values (uid, 'admin')
    on conflict do nothing;
end; $$;

grant execute on function public.claim_rider_profile() to authenticated;
grant execute on function public.claim_admin_role() to authenticated;
