
-- ============================================================
-- 1. Organization Services table (hospital services with price)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.org_services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text,         -- e.g. 'general', 'maternity', 'dental', 'imaging', 'ambulance'
  price numeric,
  is_available boolean DEFAULT true,
  duration_minutes integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.org_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available org services"
  ON public.org_services FOR SELECT
  USING (is_available = true);

CREATE POLICY "Org admins can manage their services"
  ON public.org_services FOR ALL
  USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Super admins can manage all services"
  ON public.org_services FOR ALL
  USING (has_telemed_role(auth.uid(), 'super_admin'::telemed_role));

-- ============================================================
-- 2. Updated_at trigger for org_services
-- ============================================================
CREATE TRIGGER update_org_services_updated_at
  BEFORE UPDATE ON public.org_services
  FOR EACH ROW EXECUTE FUNCTION public.update_telemed_updated_at();

-- ============================================================
-- 3. Make ambulance_phone available on organizations
--    (store it as part of phone or add a column)
-- ============================================================
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS ambulance_phone text;

-- ============================================================
-- 4. Add 'experience_years' to doctors for display
-- ============================================================
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS experience_years integer;

-- ============================================================
-- 5. Appointments - add org_admin can view appointments for their org
-- ============================================================
-- Allow org admins to view appointments in their organization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'appointments'
      AND policyname = 'Org admins can view their org appointments'
  ) THEN
    CREATE POLICY "Org admins can view their org appointments"
      ON public.appointments FOR ALL
      USING (organization_id = get_user_organization(auth.uid()));
  END IF;
END $$;
