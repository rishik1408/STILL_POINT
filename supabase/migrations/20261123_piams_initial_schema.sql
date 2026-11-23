-- ============================================================
-- PIAMS: Public Infrastructure Asset Monitoring System
-- Supabase PostgreSQL Migration (PostGIS + pgvector + RLS)
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. CUSTOM TYPES
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'official');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE asset_type AS ENUM ('road', 'bus_stop', 'footpath', 'overbridge');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE issue_status AS ENUM ('Reported', 'In Progress', 'Repair Claimed', 'Escalated', 'Verified Closed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE media_stage AS ENUM ('before', 'progress', 'after');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE defect_category AS ENUM (
    'Pothole',
    'Broken Footpath Slab',
    'Damaged Bus Shelter',
    'Missing Railing',
    'Lighting Failure',
    'Drainage Blockage'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE audit_verdict AS ENUM ('Resolved', 'Partially Patched', 'Unresolved');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES

-- Authorities: Municipal wards and responsible departments
CREATE TABLE IF NOT EXISTS public.authorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_name text NOT NULL,
  ward_name text NOT NULL,
  ward_polygon geometry(Polygon, 4326),
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  portal_url text,
  created_at timestamptz DEFAULT now()
);

-- Profiles: Extended user profile linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  authority_id uuid REFERENCES public.authorities(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Assets: Tracked public infrastructure (roads, bus stops, footpaths, overbridges)
CREATE TABLE IF NOT EXISTS public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  asset_type asset_type NOT NULL,
  geom geometry(Point, 4326) NOT NULL,
  authority_id uuid REFERENCES public.authorities(id) ON DELETE SET NULL,
  condition_score int CHECK (condition_score BETWEEN 1 AND 100) DEFAULT 100,
  status text DEFAULT 'Active',
  created_at timestamptz DEFAULT now()
);

-- Issues: Publicly reported defects and tracking tickets
CREATE TABLE IF NOT EXISTS public.issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES public.assets(id) ON DELETE SET NULL,
  reported_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  authority_id uuid REFERENCES public.authorities(id) ON DELETE SET NULL,
  category defect_category NOT NULL,
  severity int NOT NULL CHECK (severity BETWEEN 1 AND 4),
  status issue_status NOT NULL DEFAULT 'Reported',
  ai_raw_json jsonb,
  human_final_json jsonb,
  geom geometry(Point, 4326),
  sla_due_at timestamptz,
  escalation_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Media: Pre-repair, in-progress, and post-repair photos with optional embeddings
CREATE TABLE IF NOT EXISTS public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid REFERENCES public.issues(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  stage media_stage NOT NULL DEFAULT 'before',
  captured_at timestamptz DEFAULT now(),
  exif_geom geometry(Point, 4326),
  embedding vector(512),
  created_at timestamptz DEFAULT now()
);

-- Status Updates: Immutable chronological audit trail
CREATE TABLE IF NOT EXISTS public.status_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid REFERENCES public.issues(id) ON DELETE CASCADE,
  prev_status issue_status,
  new_status issue_status NOT NULL,
  audit_verdict audit_verdict,
  audit_confidence float CHECK (audit_confidence BETWEEN 0 AND 1),
  notes text,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Outbox: Formal emails and SLA notices dispatched to authorities
CREATE TABLE IF NOT EXISTS public.outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid REFERENCES public.issues(id) ON DELETE CASCADE,
  to_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  sent_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  resend_id text,
  created_at timestamptz DEFAULT now()
);

-- 4. SPATIAL & PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_assets_geom ON public.assets USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_authorities_polygon ON public.authorities USING GIST (ward_polygon);
CREATE INDEX IF NOT EXISTS idx_issues_geom ON public.issues USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues (status);
CREATE INDEX IF NOT EXISTS idx_issues_authority ON public.issues (authority_id);
CREATE INDEX IF NOT EXISTS idx_issues_reported_by ON public.issues (reported_by);
CREATE INDEX IF NOT EXISTS idx_media_issue ON public.media (issue_id);
CREATE INDEX IF NOT EXISTS idx_status_updates_issue ON public.status_updates (issue_id);

-- 5. DETERMINISTIC POSTGIS ROUTING FUNCTION
-- Maps any lat/lng GPS point to the exact municipal ward using ST_Contains
CREATE OR REPLACE FUNCTION route_issue_to_authority(lat double precision, lng double precision)
RETURNS TABLE (
  authority_id uuid,
  department_name text,
  ward_name text,
  contact_name text,
  email text,
  phone text,
  portal_url text
) LANGUAGE sql STABLE AS $$
  SELECT
    a.id AS authority_id,
    a.department_name,
    a.ward_name,
    a.contact_name,
    a.email,
    a.phone,
    a.portal_url
  FROM public.authorities a
  WHERE ST_Contains(
    a.ward_polygon,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)
  )
  LIMIT 1;
$$;

-- 6. TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS issues_updated_at ON public.issues;
CREATE TRIGGER issues_updated_at
  BEFORE UPDATE ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile row on user signup in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, authority_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user'),
    (NEW.raw_user_meta_data->>'authority_id')::uuid
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 7. ROW-LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbox ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Authorities policies: Public directory
CREATE POLICY "Authorities are viewable by everyone"
  ON public.authorities FOR SELECT USING (true);

-- Assets policies: Publicly viewable, officials can update in their ward
CREATE POLICY "Assets are viewable by everyone"
  ON public.assets FOR SELECT USING (true);

CREATE POLICY "Officials can update assets in their ward"
  ON public.assets FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'official'
        AND profiles.authority_id = assets.authority_id
    )
  );

-- Issues policies: Publicly viewable, citizens create/update drafts, officials update assigned issues
CREATE POLICY "Issues are viewable by everyone"
  ON public.issues FOR SELECT USING (true);

CREATE POLICY "Authenticated users can report issues"
  ON public.issues FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own reported issues"
  ON public.issues FOR UPDATE USING (reported_by = auth.uid());

CREATE POLICY "Officials can update issues in their assigned ward"
  ON public.issues FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'official'
        AND profiles.authority_id = issues.authority_id
    )
  );

-- Media policies: Publicly viewable, authenticated users upload
CREATE POLICY "Media is viewable by everyone"
  ON public.media FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload media"
  ON public.media FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Status updates policies: Publicly viewable audit trail
CREATE POLICY "Status updates are viewable by everyone"
  ON public.status_updates FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add status updates"
  ON public.status_updates FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Outbox policies: Citizens view their own issue notices, officials view their ward notices
CREATE POLICY "Users can view outbox for own issues"
  ON public.outbox FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.issues
      WHERE issues.id = outbox.issue_id AND issues.reported_by = auth.uid()
    )
  );

CREATE POLICY "Officials can view outbox for ward issues"
  ON public.outbox FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.issues
      JOIN public.profiles ON profiles.id = auth.uid()
      WHERE issues.id = outbox.issue_id
        AND profiles.role = 'official'
        AND profiles.authority_id = issues.authority_id
    )
  );

CREATE POLICY "Authenticated users can queue outbox notices"
  ON public.outbox FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 8. STORAGE SETUP
-- Run in Supabase SQL editor:
INSERT INTO storage.buckets (id, name, public)
VALUES ('infrastructure-media', 'infrastructure-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access to infrastructure-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'infrastructure-media');

CREATE POLICY "Authenticated users can upload to infrastructure-media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'infrastructure-media' AND auth.role() = 'authenticated');
