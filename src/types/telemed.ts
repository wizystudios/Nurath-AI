export type TelemedRole = 'super_admin' | 'org_admin' | 'doctor' | 'patient';
export type OrganizationType = 'hospital' | 'pharmacy' | 'lab' | 'polyclinic' | 'clinic' | 'health_center';

export interface UserRole {
  id: string;
  user_id: string;
  role: TelemedRole;
  organization_id: string | null;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  description: string | null;
  location: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  cover_url: string | null;
  license_no: string | null;
  is_featured: boolean;
  is_approved: boolean;
  is_suspended: boolean;
  opening_hours: Record<string, { start: string; end: string }>;
  services: string[];
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  user_id: string | null;
  organization_id: string | null;
  full_name: string;
  specialty: string;
  bio: string | null;
  profile_picture: string | null;
  phone: string | null;
  email: string | null;
  consultation_fee: number | null;
  is_private: boolean;
  is_online: boolean;
  is_approved: boolean;
  schedule: Record<string, { start: string; end: string }>;
  location: string | null;
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

export interface Appointment {
  id: string;
  patient_id: string | null;
  patient_name: string | null;
  patient_phone: string | null;
  patient_email: string | null;
  doctor_id: string;
  organization_id: string | null;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string | null;
  created_at: string;
  updated_at: string;
  doctor?: Doctor;
}

export interface Medicine {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  type: string | null;
  price: number | null;
  stock: number;
  expiry_date: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface LabTest {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  cost: number | null;
  preparation: string | null;
  result_time: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface TelemedChat {
  id: string;
  patient_id: string | null;
  patient_name: string | null;
  doctor_id: string | null;
  organization_id: string | null;
  status: 'active' | 'closed';
  created_at: string;
  updated_at: string;
  doctor?: Doctor;
}

export interface TelemedMessage {
  id: string;
  chat_id: string;
  sender_id: string | null;
  sender_name: string | null;
  sender_role: 'patient' | 'doctor' | 'org_admin' | 'bot';
  content: string;
  message_type: 'text' | 'image' | 'file';
  created_at: string;
}

export interface ChatbotFaq {
  id: string;
  keywords: string[];
  question: string;
  answer: string;
  category: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TelemedSettings {
  id: string;
  key: string;
  value: any;
  updated_at: string;
}

export interface DashboardStats {
  totalHospitals: number;
  totalPharmacies: number;
  totalLabs: number;
  totalPolyclinics: number;
  totalClinics: number;
  totalHealthCenters: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
}
