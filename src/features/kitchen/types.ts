export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export type KitchenStatus = "pending" | "in_progress" | "ready" | "served";

export interface KitchenTicketItemRead {
  id: string;
  product_name: string;
  quantity: string;
}

export interface KitchenTicketRead {
  order_id: string;
  receipt_number: number | null;
  kitchen_status: KitchenStatus;
  note: string | null;
  completed_at: string;
  kitchen_started_at: string | null;
  kitchen_ready_at: string | null;
  items: KitchenTicketItemRead[];
}
