-- Datos editables de perfil y facturación + registro de auditoría
alter table users
  add column if not exists direccion       text,
  add column if not exists nombre_fiscal   text,
  add column if not exists nif_cif         text,
  add column if not exists direccion_cobro text;

-- Quién cambió qué y cuándo (solo nombres de campo, no los valores)
create table if not exists audit_log (
  id         uuid primary key default gen_random_uuid(),
  actor_id   text not null,
  target_id  text not null,
  action     text not null,
  fields     jsonb,
  created_at timestamptz not null default now()
);

-- Sin políticas: solo accesible desde el backend con la service_role key
alter table audit_log enable row level security;
