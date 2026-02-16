-- Add new organization types to the enum
ALTER TYPE public.organization_type ADD VALUE IF NOT EXISTS 'clinic';
ALTER TYPE public.organization_type ADD VALUE IF NOT EXISTS 'health_center';