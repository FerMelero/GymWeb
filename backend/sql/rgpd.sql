-- Prueba de aceptación de la política de privacidad y los términos de uso
-- (qué versión aceptó cada usuario y cuándo). Ejecutar en el SQL Editor de Supabase.
alter table users
  add column if not exists politica_version     text,
  add column if not exists politica_aceptada_en timestamptz;
