import { apiFetch } from "@/lib/api/client";

import type { KitchenStatus, KitchenTicketRead, Page } from "./types";

export function listKitchenTickets(params?: {
  status?: KitchenStatus;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Page<KitchenTicketRead>> {
  const limit = params?.limit ?? 100;
  const offset = params?.offset ?? 0;
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    active_only: String(params?.activeOnly ?? true),
  });
  if (params?.status) query.set("status", params.status);
  return apiFetch<Page<KitchenTicketRead>>(
    `/api/v1/kitchen/tickets?${query.toString()}`,
  );
}

export function getKitchenTicket(orderId: string): Promise<KitchenTicketRead> {
  return apiFetch<KitchenTicketRead>(`/api/v1/kitchen/tickets/${orderId}`);
}

export function updateKitchenTicketStatus(
  orderId: string,
  status: Exclude<KitchenStatus, "pending">,
): Promise<KitchenTicketRead> {
  return apiFetch<KitchenTicketRead>(`/api/v1/kitchen/tickets/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
