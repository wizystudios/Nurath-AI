-- Insert sample hospitals
INSERT INTO public.organizations (name, type, description, location, address, phone, email, is_approved, is_featured) VALUES
('Muhimbili National Hospital', 'hospital', 'Tanzania''s largest referral hospital with modern facilities and specialized departments', 'Dar es Salaam', 'Upanga West, Dar es Salaam', '+255 22 215 0596', 'info@muhimbili.go.tz', true, true),
('Aga Khan Hospital', 'hospital', 'Premier private healthcare facility offering world-class medical services', 'Dar es Salaam', 'Ocean Road, Dar es Salaam', '+255 22 211 5151', 'info@agakhanhospitals.org', true, true),
('CCBRT Hospital', 'hospital', 'Comprehensive Community Based Rehabilitation in Tanzania - disability and rehabilitation', 'Dar es Salaam', 'Msasani Peninsula', '+255 22 260 1543', 'info@ccbrt.or.tz', true, false),
('Kairuki Hospital', 'hospital', 'General hospital providing quality healthcare services', 'Dar es Salaam', 'Mikocheni, Dar es Salaam', '+255 22 270 0752', 'info@kairuki.or.tz', true, false),
('Regency Medical Centre', 'hospital', 'Modern multi-specialty hospital with advanced diagnostic facilities', 'Dar es Salaam', 'Masaki, Dar es Salaam', '+255 22 260 1560', 'info@regencymedical.co.tz', true, true),
('Hindu Mandal Hospital', 'hospital', 'Charitable hospital serving the community with affordable healthcare', 'Dar es Salaam', 'Upanga, Dar es Salaam', '+255 22 215 0610', 'info@hindumandal.org', true, false),
('Temeke Regional Hospital', 'hospital', 'Government regional hospital serving Temeke district', 'Dar es Salaam', 'Temeke, Dar es Salaam', '+255 22 285 1234', 'temeke.hospital@moh.go.tz', true, false),
('Mount Meru Hospital', 'hospital', 'Regional referral hospital in Arusha region', 'Arusha', 'Sokoine Road, Arusha', '+255 27 250 3311', 'info@mountmeruhospital.go.tz', true, false);

-- Insert sample polyclinics
INSERT INTO public.organizations (name, type, description, location, address, phone, email, is_approved, is_featured) VALUES
('IST Clinic', 'polyclinic', 'International standard clinic with expat doctors and modern equipment', 'Dar es Salaam', 'Masaki, Dar es Salaam', '+255 22 260 1307', 'info@istclinic.com', true, true),
('Premier Care Clinic', 'polyclinic', 'Full service outpatient clinic with laboratory and pharmacy', 'Dar es Salaam', 'Kinondoni, Dar es Salaam', '+255 22 266 7890', 'info@premiercare.co.tz', true, false),
('Family Care Polyclinic', 'polyclinic', 'Family-oriented healthcare with pediatric specialization', 'Dar es Salaam', 'Mikocheni B, Dar es Salaam', '+255 22 270 4455', 'info@familycare.co.tz', true, false);

-- Insert sample pharmacies
INSERT INTO public.organizations (name, type, description, location, address, phone, email, is_approved, is_featured) VALUES
('Pharma Africa', 'pharmacy', 'Leading pharmaceutical distributor with wide medicine availability', 'Dar es Salaam', 'Kariakoo, Dar es Salaam', '+255 22 218 3456', 'orders@pharmaafrica.co.tz', true, true),
('Shelys Pharmaceuticals', 'pharmacy', 'Established pharmaceutical company and retail pharmacy chain', 'Dar es Salaam', 'Industrial Area, Dar es Salaam', '+255 22 286 2901', 'info@shelys.co.tz', true, true),
('MedPlus Pharmacy', 'pharmacy', '24-hour pharmacy with home delivery services', 'Dar es Salaam', 'Mlimani City, Dar es Salaam', '+255 22 270 1234', 'medplus@pharmacy.co.tz', true, false),
('City Pharmacy', 'pharmacy', 'Central pharmacy with wide range of medicines and health products', 'Dar es Salaam', 'Samora Avenue, Dar es Salaam', '+255 22 211 2233', 'citypharm@pharmacy.co.tz', true, false);

-- Insert sample labs
INSERT INTO public.organizations (name, type, description, location, address, phone, email, is_approved, is_featured) VALUES
('Lancet Laboratories', 'lab', 'International quality diagnostic laboratory services', 'Dar es Salaam', 'Regent Estate, Dar es Salaam', '+255 22 266 8888', 'dsm@lancet.co.tz', true, true),
('Muhimbili University Health Allied Sciences (MUHAS) Lab', 'lab', 'University teaching hospital laboratory with research capabilities', 'Dar es Salaam', 'Upanga, Dar es Salaam', '+255 22 215 0302', 'muhaslab@muhas.ac.tz', true, false),
('PathCare Tanzania', 'lab', 'Comprehensive pathology and diagnostic testing', 'Dar es Salaam', 'Masaki, Dar es Salaam', '+255 22 260 7777', 'info@pathcare.co.tz', true, true),
('Central Pathology Laboratory', 'lab', 'Government central reference laboratory', 'Dar es Salaam', 'Ocean Road, Dar es Salaam', '+255 22 215 1111', 'centralpath@moh.go.tz', true, false);

-- Insert sample doctors (referencing hospital IDs)
INSERT INTO public.doctors (full_name, specialty, bio, phone, email, location, consultation_fee, is_private, is_approved, is_online) VALUES
('Dr. Amina Mwalimu', 'General Practitioner', 'Experienced GP with 15 years in family medicine. Fluent in Swahili and English.', '+255 754 123 456', 'dr.amina@email.com', 'Dar es Salaam', 50000, false, true, true),
('Dr. John Kimaro', 'Cardiologist', 'Heart specialist trained in UK. Expert in interventional cardiology and heart disease prevention.', '+255 755 234 567', 'dr.kimaro@email.com', 'Dar es Salaam', 100000, false, true, true),
('Dr. Fatma Hassan', 'Pediatrician', 'Children''s health specialist with expertise in neonatal care and childhood development.', '+255 756 345 678', 'dr.fatma@email.com', 'Dar es Salaam', 60000, false, true, false),
('Dr. Peter Mushi', 'Orthopedic Surgeon', 'Bone and joint specialist. Expert in sports injuries and joint replacement surgery.', '+255 757 456 789', 'dr.mushi@email.com', 'Dar es Salaam', 80000, true, true, true),
('Dr. Grace Mwanga', 'Gynecologist', 'Women''s health specialist with focus on maternal health and reproductive medicine.', '+255 758 567 890', 'dr.grace@email.com', 'Dar es Salaam', 70000, false, true, true),
('Dr. Ibrahim Salim', 'Dentist', 'General and cosmetic dentistry. Specializing in root canal treatment and dental implants.', '+255 759 678 901', 'dr.ibrahim@email.com', 'Dar es Salaam', 40000, true, true, true),
('Dr. Rose Kapinga', 'Dermatologist', 'Skin specialist treating acne, eczema, psoriasis, and skin cancer screening.', '+255 760 789 012', 'dr.rose@email.com', 'Dar es Salaam', 65000, false, true, false),
('Dr. Emmanuel Mwakasege', 'ENT Specialist', 'Ear, nose and throat specialist. Expert in hearing loss and sinus problems.', '+255 761 890 123', 'dr.emmanuel@email.com', 'Arusha', 55000, false, true, true),
('Dr. Sarah Nyerere', 'Psychiatrist', 'Mental health specialist offering counseling and treatment for depression, anxiety, and stress.', '+255 762 901 234', 'dr.sarah@email.com', 'Dar es Salaam', 75000, true, true, true),
('Dr. Michael Tarimo', 'Neurologist', 'Brain and nervous system specialist. Expert in migraine, epilepsy, and stroke care.', '+255 763 012 345', 'dr.tarimo@email.com', 'Dar es Salaam', 90000, false, true, false),
('Dr. Halima Mwanga', 'Ophthalmologist', 'Eye specialist offering cataract surgery, glaucoma treatment, and vision care.', '+255 764 123 456', 'dr.halima@email.com', 'Dar es Salaam', 60000, false, true, true),
('Dr. David Kikwete', 'General Surgeon', 'Experienced surgeon specializing in laparoscopic and minimally invasive procedures.', '+255 765 234 567', 'dr.kikwete@email.com', 'Dar es Salaam', 85000, false, true, false);

-- Insert sample chatbot FAQs
INSERT INTO public.chatbot_faqs (question, answer, keywords, category, is_active) VALUES
('How do I book an appointment?', 'To book an appointment, search for a doctor by typing "/doctor" followed by specialty or location. Then click the "Book" button next to your preferred doctor.', ARRAY['book', 'appointment', 'schedule', 'booking'], 'Appointments', true),
('What are your opening hours?', 'Our partner hospitals and clinics have varying hours. Most operate Monday-Friday 8AM-6PM, Saturday 8AM-2PM. Some facilities offer 24-hour emergency services.', ARRAY['hours', 'time', 'open', 'close', 'schedule'], 'General', true),
('Do you accept insurance?', 'Many of our partner facilities accept major health insurance providers including AAR, Jubilee, Resolution, and NHIF. Please confirm with the specific hospital or doctor.', ARRAY['insurance', 'nhif', 'cover', 'payment', 'aar', 'jubilee'], 'Payment', true),
('How can I find a specialist?', 'Type "/doctor [specialty]" to find specialists. For example: "/doctor cardiologist" or "/doctor dentist". You can also search by location.', ARRAY['specialist', 'find', 'search', 'doctor', 'specific'], 'Doctors', true),
('What if I need emergency care?', 'For emergencies, please go directly to the nearest hospital emergency room or call 114 (Tanzania Emergency). Muhimbili and Aga Khan have 24/7 emergency departments.', ARRAY['emergency', 'urgent', 'critical', 'ambulance', '114'], 'Emergency', true),
('Can I get medicine delivered?', 'Some of our partner pharmacies offer home delivery. Search for pharmacies using "/pharmacy" and contact them directly for delivery options.', ARRAY['delivery', 'medicine', 'pharmacy', 'home', 'deliver'], 'Pharmacy', true),
('How do I get lab results?', 'Lab results are typically sent via email or SMS. You can also collect them in person. Contact the lab directly for specific turnaround times.', ARRAY['lab', 'results', 'test', 'report', 'diagnosis'], 'Laboratory', true),
('What documents do I need for an appointment?', 'Bring your ID (passport or national ID), insurance card if applicable, and any previous medical records or prescriptions related to your condition.', ARRAY['documents', 'id', 'papers', 'bring', 'required'], 'Appointments', true);