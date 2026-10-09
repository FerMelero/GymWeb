-- Eliminar un usuario y su historial de accesos en UNA sola transacción,
-- dejando constancia en audit_log. Solo la puede ejecutar el backend (service_role).
create or replace function delete_user_cascade(uid text, actor text, snapshot jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  removed int;
begin
  delete from entries where user_id::text = uid;
  delete from users   where id::text = uid;
  get diagnostics removed = row_count;

  if removed = 0 then
    return false;
  end if;

  insert into audit_log (actor_id, target_id, action, fields)
  values (actor, uid, 'admin_delete_user', snapshot);

  return true;
end;
$$;

revoke all on function delete_user_cascade(text, text, jsonb) from public, anon, authenticated;
grant execute on function delete_user_cascade(text, text, jsonb) to service_role;
