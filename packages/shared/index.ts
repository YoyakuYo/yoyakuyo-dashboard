// packages/shared/index.ts

export type Booking = {
  id: string;
  shop_id: string;
  service_id: string;
  customer_id: string;
  staff_id: string;
  start_time: string;
  end_time: string;
  notes?: string;
};

export type Shop = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
};
