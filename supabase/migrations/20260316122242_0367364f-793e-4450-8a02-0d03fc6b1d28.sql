
-- Prescriptions table
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  patient_id UUID,
  patient_name TEXT,
  diagnosis TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Prescription items (medicines prescribed)
CREATE TABLE public.prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
  medicine_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pharmacy orders
CREATE TABLE public.pharmacy_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID,
  patient_name TEXT,
  patient_phone TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC DEFAULT 0,
  delivery_address TEXT,
  delivery_method TEXT DEFAULT 'pickup',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pharmacy order items
CREATE TABLE public.pharmacy_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.pharmacy_orders(id) ON DELETE CASCADE NOT NULL,
  medicine_id UUID REFERENCES public.medicines(id) ON DELETE SET NULL,
  medicine_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lab bookings
CREATE TABLE public.lab_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID,
  patient_name TEXT,
  patient_phone TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  lab_test_id UUID REFERENCES public.lab_tests(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  appointment_date DATE,
  appointment_time TIME,
  status TEXT NOT NULL DEFAULT 'pending',
  result_status TEXT DEFAULT 'pending',
  result_notes TEXT,
  result_file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID,
  patient_name TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'TZS',
  payment_method TEXT DEFAULT 'cash',
  payment_type TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  transaction_ref TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID,
  patient_name TEXT,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Medical records
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  record_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prescriptions
CREATE POLICY "Patients can view their prescriptions" ON public.prescriptions FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Doctors can manage prescriptions" ON public.prescriptions FOR ALL USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));
CREATE POLICY "Super admins can manage all prescriptions" ON public.prescriptions FOR ALL USING (has_telemed_role(auth.uid(), 'super_admin'));
CREATE POLICY "Org admins can view org prescriptions" ON public.prescriptions FOR SELECT USING (doctor_id IN (SELECT id FROM public.doctors WHERE organization_id = get_user_organization(auth.uid())));

-- RLS for prescription_items
CREATE POLICY "View prescription items via prescription" ON public.prescription_items FOR SELECT USING (prescription_id IN (SELECT id FROM public.prescriptions WHERE patient_id = auth.uid() OR doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())));
CREATE POLICY "Doctors can manage prescription items" ON public.prescription_items FOR ALL USING (prescription_id IN (SELECT id FROM public.prescriptions WHERE doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())));
CREATE POLICY "Super admins manage all prescription items" ON public.prescription_items FOR ALL USING (has_telemed_role(auth.uid(), 'super_admin'));

-- RLS for pharmacy_orders
CREATE POLICY "Patients can view their orders" ON public.pharmacy_orders FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Patients can create orders" ON public.pharmacy_orders FOR INSERT WITH CHECK (patient_id = auth.uid() OR patient_id IS NULL);
CREATE POLICY "Org admins can manage their orders" ON public.pharmacy_orders FOR ALL USING (organization_id = get_user_organization(auth.uid()));
CREATE POLICY "Super admins manage all orders" ON public.pharmacy_orders FOR ALL USING (has_telemed_role(auth.uid(), 'super_admin'));

-- RLS for pharmacy_order_items
CREATE POLICY "View order items via order" ON public.pharmacy_order_items FOR SELECT USING (order_id IN (SELECT id FROM public.pharmacy_orders WHERE patient_id = auth.uid() OR organization_id = get_user_organization(auth.uid())));
CREATE POLICY "Insert order items" ON public.pharmacy_order_items FOR INSERT WITH CHECK (order_id IN (SELECT id FROM public.pharmacy_orders WHERE patient_id = auth.uid() OR organization_id = get_user_organization(auth.uid())));
CREATE POLICY "Super admins manage all order items" ON public.pharmacy_order_items FOR ALL USING (has_telemed_role(auth.uid(), 'super_admin'));

-- RLS for lab_bookings
CREATE POLICY "Patients can view their lab bookings" ON public.lab_bookings FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Patients can create lab bookings" ON public.lab_bookings FOR INSERT WITH CHECK (patient_id = auth.uid() OR patient_id IS NULL);
CREATE POLICY "Org admins can manage their lab bookings" ON public.lab_bookings FOR ALL USING (organization_id = get_user_organization(auth.uid()));
CREATE POLICY "Doctors can view lab bookings they requested" ON public.lab_bookings FOR SELECT USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));
CREATE POLICY "Super admins manage all lab bookings" ON public.lab_bookings FOR ALL USING (has_telemed_role(auth.uid(), 'super_admin'));

-- RLS for payments
CREATE POLICY "Patients can view their payments" ON public.payments FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Patients can create payments" ON public.payments FOR INSERT WITH CHECK (patient_id = auth.uid() OR patient_id IS NULL);
CREATE POLICY "Super admins manage all payments" ON public.payments FOR ALL USING (has_telemed_role(auth.uid(), 'super_admin'));

-- RLS for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Patients can create reviews" ON public.reviews FOR INSERT WITH CHECK (patient_id = auth.uid());
CREATE POLICY "Patients can update own reviews" ON public.reviews FOR UPDATE USING (patient_id = auth.uid());
CREATE POLICY "Super admins manage all reviews" ON public.reviews FOR ALL USING (has_telemed_role(auth.uid(), 'super_admin'));

-- RLS for medical_records
CREATE POLICY "Patients can view their records" ON public.medical_records FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Doctors can manage patient records" ON public.medical_records FOR ALL USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));
CREATE POLICY "Super admins manage all records" ON public.medical_records FOR ALL USING (has_telemed_role(auth.uid(), 'super_admin'));

-- RLS for notifications
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Anyone can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Super admins manage all notifications" ON public.notifications FOR ALL USING (has_telemed_role(auth.uid(), 'super_admin'));

-- Update triggers for updated_at
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION update_telemed_updated_at();
CREATE TRIGGER update_pharmacy_orders_updated_at BEFORE UPDATE ON public.pharmacy_orders FOR EACH ROW EXECUTE FUNCTION update_telemed_updated_at();
CREATE TRIGGER update_lab_bookings_updated_at BEFORE UPDATE ON public.lab_bookings FOR EACH ROW EXECUTE FUNCTION update_telemed_updated_at();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_telemed_updated_at();
CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON public.medical_records FOR EACH ROW EXECUTE FUNCTION update_telemed_updated_at();
