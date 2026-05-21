-- 001_create_citas.sql
-- Migración: Crear tabla citas en Supabase

-- Habilitar UUID si no está
create extension if not exists "pgcrypto";

-- Tabla principal de citas
create table if not exists public.citas (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  doctor_id       text not null,                          -- ID del doctor en el backend (MongoDB)
  doctor_nombre   text not null default '',
  doctor_apellido text not null default '',
  doctor_especialidad text not null default '',
  fecha           date not null,
  hora_inicio     time not null,
  hora_fin        time not null,
  motivo          text not null default '',
  estado          text not null default 'pendiente'
                    check (estado in ('pendiente','confirmada','finalizada','cancelada')),
  motivo_cancelacion text not null default '',
  created_at      timestamptz not null default now()
);

-- Índices para consultas rápidas
create index if not exists idx_citas_user_id on public.citas(user_id);
create index if not exists idx_citas_doctor_fecha on public.citas(doctor_id, fecha);
create index if not exists idx_citas_estado on public.citas(estado);

-- Habilitar Row Level Security
alter table public.citas enable row level security;

-- Políticas RLS

-- SELECT: un usuario solo puede ver sus propias citas
create policy "Usuarios ven sus propias citas"
  on public.citas for select
  using (auth.uid() = user_id);

-- INSERT: un usuario puede crear citas (suyas)
create policy "Usuarios pueden crear citas"
  on public.citas for insert
  with check (auth.uid() = user_id);

-- UPDATE: un usuario puede actualizar sus propias citas (ej: cancelar)
create policy "Usuarios pueden actualizar sus citas"
  on public.citas for update
  using (auth.uid() = user_id);

-- DELETE: solo el usuario puede borrar sus citas
create policy "Usuarios pueden eliminar sus citas"
  on public.citas for delete
  using (auth.uid() = user_id);
