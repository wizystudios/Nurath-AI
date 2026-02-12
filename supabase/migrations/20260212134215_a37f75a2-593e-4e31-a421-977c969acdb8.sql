
-- Fix doctors RLS: drop restrictive SELECT and create permissive ones
DROP POLICY IF EXISTS "Anyone can view approved doctors" ON public.doctors;
CREATE POLICY "Anyone can view approved doctors" ON public.doctors FOR SELECT USING (is_approved = true);

-- Fix organizations RLS
DROP POLICY IF EXISTS "Anyone can view approved organizations" ON public.organizations;
CREATE POLICY "Anyone can view approved organizations" ON public.organizations FOR SELECT USING (is_approved = true AND is_suspended = false);
