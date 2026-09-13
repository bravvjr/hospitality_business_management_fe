"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChefHat, Clock } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  listKitchenTickets,
  updateKitchenTicketStatus,
} from "@/features/kitchen/api";
import type { KitchenStatus, KitchenTicketRead } from "@/features/kitchen/types";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const COLUMNS: { status: KitchenStatus; label: string; accent: string }[] = [
  { status: "pending", label: "Pending", accent: "border-amber-500/40" },
  { status: "in_progress", label: "In progress", accent: "border-sky-500/40" },
  { status: "ready", label: "Ready", accent: "border-emerald-500/40" },
];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ticketLabel(ticket: KitchenTicketRead): string {
  if (ticket.receipt_number != null) {
    return `Receipt #${ticket.receipt_number}`;
  }
  return `Order ${ticket.order_id.slice(0, 8)}`;
}

function nextAction(
  status: KitchenStatus,
): { label: string; next: Exclude<KitchenStatus, "pending"> } | null {
  if (status === "pending") {
    return { label: "Start prep", next: "in_progress" };
  }
  if (status === "in_progress") {
    return { label: "Mark ready", next: "ready" };
  }
  if (status === "ready") {
    return { label: "Mark served", next: "served" };
  }
  return null;
}

function TicketCard({
  ticket,
  onAdvance,
  busy,
}: {
  ticket: KitchenTicketRead;
  onAdvance: (orderId: string, status: Exclude<KitchenStatus, "pending">) => void;
  busy: boolean;
}) {
  const action = nextAction(ticket.kitchen_status);
  const skipReady =
    ticket.kitchen_status === "pending"
      ? {
          label: "Skip to ready",
          next: "ready" as const,
        }
      : null;

  return (
    <Card className="gap-3 py-4 shadow-sm">
      <CardHeader className="gap-1 px-4">
        <CardTitle className="text-base">{ticketLabel(ticket)}</CardTitle>
        <CardDescription className="flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {formatTime(ticket.completed_at)}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4">
        <ul className="space-y-1 text-sm">
          {ticket.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span className="font-medium">{item.product_name}</span>
              <span className="text-muted-foreground">× {item.quantity}</span>
            </li>
          ))}
        </ul>
        {ticket.note ? (
          <p className="mt-3 rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground">
            {ticket.note}
          </p>
        ) : null}
      </CardContent>
      {action ? (
        <CardFooter className="flex flex-wrap gap-2 px-4">
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => onAdvance(ticket.order_id, action.next)}
          >
            {action.label}
          </Button>
          {skipReady ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => onAdvance(ticket.order_id, skipReady.next)}
            >
              {skipReady.label}
            </Button>
          ) : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}

export function KitchenScreen() {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  const ticketsQuery = useQuery({
    queryKey: ["kitchen", "tickets"],
    queryFn: () => listKitchenTickets({ limit: 200, activeOnly: true }),
    refetchInterval: 5000,
  });

  const advanceMutation = useMutation({
    mutationFn: ({
      orderId,
      status,
    }: {
      orderId: string;
      status: Exclude<KitchenStatus, "pending">;
    }) => updateKitchenTicketStatus(orderId, status),
    onMutate: ({ orderId }) => {
      setBusyOrderId(orderId);
      setActionError(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen", "tickets"] });
    },
    onError: (error) => {
      setActionError(
        error instanceof ApiError ? error.message : "Could not update ticket",
      );
    },
    onSettled: () => {
      setBusyOrderId(null);
    },
  });

  const ticketsByStatus = useMemo(() => {
    const grouped: Record<KitchenStatus, KitchenTicketRead[]> = {
      pending: [],
      in_progress: [],
      ready: [],
      served: [],
    };
    for (const ticket of ticketsQuery.data?.items ?? []) {
      grouped[ticket.kitchen_status].push(ticket);
    }
    return grouped;
  }, [ticketsQuery.data?.items]);

  const activeCount =
    ticketsByStatus.pending.length +
    ticketsByStatus.in_progress.length +
    ticketsByStatus.ready.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <ChefHat className="size-7 text-brand-rich-teal" />
            Kitchen display
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeCount} active ticket{activeCount === 1 ? "" : "s"} · refreshes
            every 5s
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => ticketsQuery.refetch()}
          disabled={ticketsQuery.isFetching}
        >
          Refresh
        </Button>
      </div>

      {actionError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      {ticketsQuery.isError ? (
        <p className="text-sm text-destructive">
          Could not load kitchen tickets. Check your connection and try again.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((column) => {
          const tickets = ticketsByStatus[column.status];
          return (
            <section
              key={column.status}
              className={cn(
                "rounded-xl border bg-muted/20 p-3",
                column.accent,
              )}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {column.label}
                </h2>
                <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium">
                  {tickets.length}
                </span>
              </div>
              <div className="space-y-3">
                {tickets.length === 0 ? (
                  <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                    No tickets
                  </p>
                ) : (
                  tickets.map((ticket) => (
                    <TicketCard
                      key={ticket.order_id}
                      ticket={ticket}
                      busy={busyOrderId === ticket.order_id}
                      onAdvance={(orderId, status) =>
                        advanceMutation.mutate({ orderId, status })
                      }
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
