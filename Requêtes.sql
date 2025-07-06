
  -- ════════════════════════════════════════════════════════
-- █▓▒░   P A R T I E   0 1   ░▒▓█
-- ════════════════════════════════════════════════════════
-- 1. Création de la table administrators
create table public.administrators (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  password text not null,
  role text not null,
  created_at timestamptz not null default now(),
  last_login timestamptz,
  online boolean not null default false
);

-- 2. Ajout d'une contrainte d'unicité sur username
create unique index administrators_username_unique on public.administrators (username);

-- 3. Activation de RLS (Row Level Security) sur la table
alter table public.administrators enable row level security;

-- 4. Création des politiques RLS

-- Politique de lecture pour tous
create policy "Enable read access for all users"
  on public.administrators
  for select
  using (true);

-- Politique d'insertion
create policy "Enable insert for new users"
  on public.administrators
  for insert
  with check (true);

-- Politique de mise à jour
create policy "Enable update for admins"
  on public.administrators
  for update
  using (true);

-- Politique de suppression
create policy "Enable delete for primary admins"
  on public.administrators
  for delete
  using (true);


-- ════════════════════════════════════════════════════════
-- █▓▒░   P A R T I E   0 2   ░▒▓█
-- ════════════════════════════════════════════════════════
-- Création de la table sales_role_assignments
create table public.sales_role_assignments (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.administrators(id) on delete cascade,
  config_type text not null,
  role_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Contrainte pour s'assurer qu'un admin n'a qu'un seul rôle par type de configuration
  unique(admin_id, config_type)
);

-- Activation de RLS (Row Level Security) sur la table
alter table public.sales_role_assignments enable row level security;

-- Création des politiques RLS
-- Politique de lecture pour tous
create policy "Enable read access for all users"
  on public.sales_role_assignments
  for select
  using (true);

-- Politique d'insertion et de mise à jour
create policy "Enable insert and update for all users"
  on public.sales_role_assignments
  for insert
  with check (true);

-- Politique de mise à jour
create policy "Enable update for all users"
  on public.sales_role_assignments
  for update
  using (true);

-- Politique de suppression
create policy "Enable delete for all users"
  on public.sales_role_assignments
  for delete
  using (true);



-- ════════════════════════════════════════════════════════
-- █▓▒░   P A R T I E   0 3   ░▒▓█
-- ════════════════════════════════════════════════════════
-- Création de la table sales_config pour stocker la configuration globale
create table public.sales_config (
  id uuid primary key default gen_random_uuid(),
  config_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Activation de RLS (Row Level Security) sur la table
alter table public.sales_config enable row level security;

-- Création des politiques RLS
-- Politique de lecture pour tous
create policy "Enable read access for all users"
  on public.sales_config
  for select
  using (true);

-- Politique d'insertion
create policy "Enable insert for all users"
  on public.sales_config
  for insert
  with check (true);

-- Politique de mise à jour
create policy "Enable update for all users"
  on public.sales_config
  for update
  using (true);

-- Politique de suppression
create policy "Enable delete for all users"
  on public.sales_config
  for delete
  using (true);

-- Insérer une configuration par défaut si nécessaire
insert into public.sales_config (config_type)
select 'solo'
where not exists (select 1 from public.sales_config);

-- ════════════════════════════════════════════════════════
-- █▓▒░   P A R T I E   0 4   ░▒▓█
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- █▓▒░   P A R T I E   0 5   ░▒▓█
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- █▓▒░   P A R T I E   0 6   ░▒▓█
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- █▓▒░   P A R T I E   0 7   ░▒▓█
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- █▓▒░   P A R T I E   0 8   ░▒▓█
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- █▓▒░   P A R T I E   0 9   ░▒▓█
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- █▓▒░   P A R T I E   1 0   ░▒▓█
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- █▓▒░   P A R T I E   1 1   ░▒▓█
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- █▓▒░   P A R T I E   1 2   ░▒▓█
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- █▓▒░   P A R T I E   1 3   ░▒▓█
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- █▓▒░   P A R T I E   1 4   ░▒▓█
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- █▓▒░   P A R T I E   1 5   ░▒▓█
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- █▓▒░   P A R T I E   1 6   ░▒▓█
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- █▓▒░   P A R T I E   1 7   ░▒▓█
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- █▓▒░   P A R T I E   1 8   ░▒▓█
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- █▓▒░   P A R T I E   1 9   ░▒▓█
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- █▓▒░   P A R T I E   2 0   ░▒▓█
-- ════════════════════════════════════════════════════════