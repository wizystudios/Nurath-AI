-- Insert super_admin role for existing user
INSERT INTO public.user_roles (user_id, role)
VALUES ('98841056-4a4f-4558-803d-34e4bc83706a', 'super_admin')
ON CONFLICT DO NOTHING;