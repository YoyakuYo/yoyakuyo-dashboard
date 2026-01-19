// apps/api/src/types.ts

export interface User {
  id: string;
  email: string;
}

export interface Shop {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string | null;
  google_place_id?: string | null;
  city?: string | null;
  country?: string | null;
  zip_code?: string | null;
  description?: string | null;
  language_code?: string | null;
  logo_url?: string | null;
  cover_photo_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  opening_hours?: any | null; // JSONB
  business_status?: string | null;
  category_id?: string | null;
  owner_user_id?: string | null;
  claim_status?: 'unclaimed' | 'pending' | 'approved' | 'rejected';
  claimed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Service {
  id: string;
  shop_id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

export interface Staff {
  id: string;
  shop_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
}

export interface Timeslot {
  id: string;
  staff_id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

export interface Booking {
  id: string;
  shop_id: string;
  service_id: string;
  customer_id: string;
  staff_id: string;
  start_time: string;
  end_time: string;
  notes: string;
}
