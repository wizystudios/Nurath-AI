-- Insert super_admin role for the user with email kharifanadhiru01@gmail.com
-- First, we need to get the user's ID from auth.users and create the role
-- This will work once the user signs up with this email

-- Create a function to auto-assign super_admin role for specific email
CREATE OR REPLACE FUNCTION public.assign_super_admin_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'kharifanadhiru01@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-assign on user creation
DROP TRIGGER IF EXISTS on_auth_user_created_super_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_super_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_super_admin_on_signup();