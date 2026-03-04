// Tipos principales del sistema Agendox

export type BusinessType = 
  | 'barberia'
  | 'estetica_canina'
  | 'salon_belleza'
  | 'spa'
  | 'consultorio'
  | 'otro';

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type UserRole = 'owner' | 'employee';

export interface Business {
  id: string;
  slug: string;
  name: string;
  business_type: BusinessType;
  is_active: boolean;
  created_at: string;
}

export interface BusinessTheme {
  id: string;
  business_id: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  banner_url: string | null;
  font: string;
}

export interface BusinessProfile {
  id: string;
  business_id: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  social_links: Record<string, string> | null;
  gallery_urls: string[] | null;
  working_hours: WorkingHours | null;
  post_booking_instructions: string | null;
}

export interface WorkingHours {
  [day: string]: {
    is_open: boolean;
    open_time: string;
    close_time: string;
    break_start?: string;
    break_end?: string;
  };
}

export interface Staff {
  id: string;
  business_id: string;
  name: string;
  role: string;
  photo_url: string | null;
  bio: string | null;
  is_active: boolean;
  working_hours: WorkingHours | null;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  duration_minutes: number;
  price: number;
  image_url: string | null;
  is_active: boolean;
}

export interface StaffService {
  staff_id: string;
  service_id: string;
}

export interface Appointment {
  id: string;
  business_id: string;
  staff_id: string;
  service_id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  scheduled_at: string;
  status: AppointmentStatus;
  notes: string | null;
  confirmation_code: string;
}

export interface BusinessUser {
  id: string;
  business_id: string;
  role: UserRole;
}
