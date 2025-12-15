-- Create role enum for telemed system
CREATE TYPE public.telemed_role AS ENUM ('super_admin', 'org_admin', 'doctor', 'patient');

-- Create organization type enum
CREATE TYPE public.organization_type AS ENUM ('hospital', 'pharmacy', 'lab', 'polyclinic');

-- Create user roles table (separate from profiles as per security guidelines)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role telemed_role NOT NULL,
    organization_id UUID, -- NULL for super_admin and patients
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create organizations table (hospitals, pharmacies, labs, polyclinics)
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type organization_type NOT NULL,
    description TEXT,
    location TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    logo_url TEXT,
    cover_url TEXT,
    license_no TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    is_suspended BOOLEAN DEFAULT false,
    opening_hours JSONB DEFAULT '{}',
    services JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create doctors table
CREATE TABLE public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    bio TEXT,
    profile_picture TEXT,
    phone TEXT,
    email TEXT,
    consultation_fee DECIMAL(10,2),
    is_private BOOLEAN DEFAULT false, -- true if not under any organization
    is_online BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    schedule JSONB DEFAULT '{}', -- {monday: {start: "09:00", end: "17:00"}, ...}
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    patient_name TEXT,
    patient_phone TEXT,
    patient_email TEXT,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, confirmed, cancelled, completed
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create medicines table (for pharmacies)
CREATE TABLE public.medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT,
    price DECIMAL(10,2),
    stock INTEGER DEFAULT 0,
    expiry_date DATE,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create lab tests table
CREATE TABLE public.lab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    cost DECIMAL(10,2),
    preparation TEXT,
    result_time TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create telemed chats table for patient-doctor/org communication
CREATE TABLE public.telemed_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    patient_name TEXT,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active', -- active, closed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create chat messages for telemed
CREATE TABLE public.telemed_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES public.telemed_chats(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sender_name TEXT,
    sender_role TEXT, -- patient, doctor, org_admin, bot
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text', -- text, image, file
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create chatbot FAQs table
CREATE TABLE public.chatbot_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keywords TEXT[] NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create system settings table
CREATE TABLE public.telemed_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemed_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemed_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemed_settings ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_telemed_role(_user_id UUID, _role telemed_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_telemed_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policies for organizations
CREATE POLICY "Anyone can view approved organizations"
ON public.organizations FOR SELECT
USING (is_approved = true AND is_suspended = false);

CREATE POLICY "Super admins can manage all organizations"
ON public.organizations FOR ALL
USING (public.has_telemed_role(auth.uid(), 'super_admin'));

CREATE POLICY "Org admins can update their organization"
ON public.organizations FOR UPDATE
USING (id = public.get_user_organization(auth.uid()));

-- RLS Policies for doctors
CREATE POLICY "Anyone can view approved doctors"
ON public.doctors FOR SELECT
USING (is_approved = true);

CREATE POLICY "Super admins can manage all doctors"
ON public.doctors FOR ALL
USING (public.has_telemed_role(auth.uid(), 'super_admin'));

CREATE POLICY "Org admins can manage their doctors"
ON public.doctors FOR ALL
USING (organization_id = public.get_user_organization(auth.uid()));

CREATE POLICY "Doctors can update their own profile"
ON public.doctors FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for appointments
CREATE POLICY "Patients can view their appointments"
ON public.appointments FOR SELECT
USING (patient_id = auth.uid());

CREATE POLICY "Patients can create appointments"
ON public.appointments FOR INSERT
WITH CHECK (patient_id = auth.uid() OR patient_id IS NULL);

CREATE POLICY "Doctors can view their appointments"
ON public.appointments FOR SELECT
USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can update their appointments"
ON public.appointments FOR UPDATE
USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE POLICY "Super admins can manage all appointments"
ON public.appointments FOR ALL
USING (public.has_telemed_role(auth.uid(), 'super_admin'));

-- RLS Policies for medicines
CREATE POLICY "Anyone can view available medicines"
ON public.medicines FOR SELECT
USING (is_available = true);

CREATE POLICY "Super admins can manage all medicines"
ON public.medicines FOR ALL
USING (public.has_telemed_role(auth.uid(), 'super_admin'));

CREATE POLICY "Org admins can manage their medicines"
ON public.medicines FOR ALL
USING (organization_id = public.get_user_organization(auth.uid()));

-- RLS Policies for lab_tests
CREATE POLICY "Anyone can view available lab tests"
ON public.lab_tests FOR SELECT
USING (is_available = true);

CREATE POLICY "Super admins can manage all lab tests"
ON public.lab_tests FOR ALL
USING (public.has_telemed_role(auth.uid(), 'super_admin'));

CREATE POLICY "Org admins can manage their lab tests"
ON public.lab_tests FOR ALL
USING (organization_id = public.get_user_organization(auth.uid()));

-- RLS Policies for telemed_chats
CREATE POLICY "Patients can view their chats"
ON public.telemed_chats FOR SELECT
USING (patient_id = auth.uid() OR patient_id IS NULL);

CREATE POLICY "Patients can create chats"
ON public.telemed_chats FOR INSERT
WITH CHECK (true);

CREATE POLICY "Doctors can view their chats"
ON public.telemed_chats FOR SELECT
USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE POLICY "Super admins can view all chats"
ON public.telemed_chats FOR ALL
USING (public.has_telemed_role(auth.uid(), 'super_admin'));

-- RLS Policies for telemed_messages
CREATE POLICY "Chat participants can view messages"
ON public.telemed_messages FOR SELECT
USING (
  chat_id IN (
    SELECT id FROM public.telemed_chats 
    WHERE patient_id = auth.uid() 
    OR doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
  )
  OR public.has_telemed_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Anyone can insert messages"
ON public.telemed_messages FOR INSERT
WITH CHECK (true);

-- RLS Policies for chatbot_faqs
CREATE POLICY "Anyone can view active FAQs"
ON public.chatbot_faqs FOR SELECT
USING (is_active = true);

CREATE POLICY "Super admins can manage FAQs"
ON public.chatbot_faqs FOR ALL
USING (public.has_telemed_role(auth.uid(), 'super_admin'));

-- RLS Policies for settings
CREATE POLICY "Anyone can view settings"
ON public.telemed_settings FOR SELECT
USING (true);

CREATE POLICY "Super admins can manage settings"
ON public.telemed_settings FOR ALL
USING (public.has_telemed_role(auth.uid(), 'super_admin'));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_telemed_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.update_telemed_updated_at();

CREATE TRIGGER update_doctors_updated_at
BEFORE UPDATE ON public.doctors
FOR EACH ROW EXECUTE FUNCTION public.update_telemed_updated_at();

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_telemed_updated_at();

CREATE TRIGGER update_medicines_updated_at
BEFORE UPDATE ON public.medicines
FOR EACH ROW EXECUTE FUNCTION public.update_telemed_updated_at();

CREATE TRIGGER update_lab_tests_updated_at
BEFORE UPDATE ON public.lab_tests
FOR EACH ROW EXECUTE FUNCTION public.update_telemed_updated_at();

CREATE TRIGGER update_telemed_chats_updated_at
BEFORE UPDATE ON public.telemed_chats
FOR EACH ROW EXECUTE FUNCTION public.update_telemed_updated_at();

-- Insert default system settings
INSERT INTO public.telemed_settings (key, value) VALUES
('system_name', '"Telemed Chatbot"'),
('default_greeting', '"Hello! Welcome to the Telemed Health Management System. How can I help you today?"'),
('languages', '["en", "sw"]'),
('theme_color', '"#0ea5e9"');