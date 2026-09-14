"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  addOrderItem,
  completeSale,
  createOrder,
  getOrder,
  listOrders,
  listSellableProducts,
  removeOrderItem,
  updateOrderItem,
  voidOrder,
} from "@/features/pos/api";
import { ReceiptModal } from "@/features/pos/components/receipt-modal";
import type { ProductRead } from "@/features/inventory/types";
import { ApiError } from "@/lib/api/client";
import { formatMinorUnits, parseMajorToMinor } from "@/lib/money";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  clearPosSale,
  setOpenOrderId,
  setReceiptOrderId,
} from "@/lib/store/slices/pos-slice";

function isSellable(product: ProductRead): boolean {
  return (
    product.status === "active" &&
    product.unit_price_minor != null &&
    product.currency != null
  );
}

function quantityStep(current: string, delta: number): string {
  const next = Number(current) + delta;
  if (!Number.isFinite(next) || next <= 0) return "1";
  return String(next);
}

export function PosScreen() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const openOrderId = useAppSelector((state) => state.pos.openOrderId);
  const receiptOrderId = useAppSelector((state) => state.pos.receiptOrderId);
  const tenantCurrency = useAppSelector(
    (state) => state.auth.tenant?.base_currency ?? "KES",
  );

  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [tenderedMajor, setTenderedMajor] = useState("");
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [voidingOrderId, setVoidingOrderId] = useState<string | null>(null);

  const productsQuery = useQuery({
    queryKey: ["inventory", "products", "pos"],
    queryFn: () => listSellableProducts({ limit: 200 }),
  });

  const orderQuery = useQuery({
    queryKey: ["pos", "order", openOrderId],
    queryFn: () => getOrder(openOrderId!),
    enabled: Boolean(openOrderId),
  });

  const recentSalesQuery = useQuery({
    queryKey: ["pos", "orders", "completed"],
    queryFn: () => listOrders({ status: "completed", limit: 10 }),
  });

  const ensureOrder = useMutation({
    mutationFn: () => createOrder({ currency: tenantCurrency }),
    onSuccess: (order) => {
      dispatch(setOpenOrderId(order.id));
      queryClient.setQueryData(["pos", "order", order.id], order);
    },
  });

  const sellableProducts = useMemo(() => {
    const items = productsQuery.data?.items ?? [];
    const filtered = items.filter(isSellable);
    const q = search.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter(
      (product) =>
        product.name.toLowerCase().includes(q) ||
        product.sku?.toLowerCase().includes(q) ||
        product.category?.toLowerCase().includes(q),
    );
  }, [productsQuery.data?.items, search]);

  async function ensureOpenOrderId(): Promise<string> {
    if (openOrderId) return openOrderId;
    const order = await ensureOrder.mutateAsync();
    return order.id;
  }

  async function handleAddProduct(product: ProductRead) {
    setActionError(null);
    setBusyProductId(product.id);
    try {
      const orderId = await ensureOpenOrderId();
      const order = await addOrderItem(orderId, {
        product_id: product.id,
        quantity: "1",
        unit_id: product.base_unit.id,
      });
      queryClient.setQueryData(["pos", "order", order.id], order);
      dispatch(setOpenOrderId(order.id));
    } catch (error) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : "Could not add item to the order",
      );
    } finally {
      setBusyProductId(null);
    }
  }

  async function handleQuantity(itemId: string, quantity: string) {
    if (!openOrderId) return;
    setActionError(null);
    try {
      const order = await updateOrderItem(openOrderId, itemId, { quantity });
      queryClient.setQueryData(["pos", "order", order.id], order);
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.message : "Could not update quantity",
      );
    }
  }

  async function handleRemove(itemId: string) {
    if (!openOrderId) return;
    setActionError(null);
    try {
      const order = await removeOrderItem(openOrderId, itemId);
      queryClient.setQueryData(["pos", "order", order.id], order);
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.message : "Could not remove item",
      );
    }
  }

  async function handleCompleteCash() {
    if (!openOrderId || !orderQuery.data) return;
    setActionError(null);

    let tenderedMinor: number | undefined;
    if (tenderedMajor.trim()) {
      const parsed = parseMajorToMinor(tenderedMajor);
      if (parsed == null) {
        setActionError("Enter a valid amount tendered (e.g. 500 or 500.50)");
        return;
      }
      tenderedMinor = parsed;
    }

    try {
      const order = await completeSale(openOrderId, {
        payment_method: "cash",
        amount_tendered_minor: tenderedMinor ?? null,
      });
      dispatch(setReceiptOrderId(order.id));
      dispatch(clearPosSale());
      setTenderedMajor("");
      queryClient.removeQueries({ queryKey: ["pos", "order", order.id] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "completed"] });
      queryClient.invalidateQueries({ queryKey: ["kitchen", "tickets"] });
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.message : "Could not complete sale",
      );
    }
  }

  function startNewSale() {
    dispatch(setReceiptOrderId(null));
    dispatch(clearPosSale());
    setTenderedMajor("");
    setActionError(null);
  }

  async function handleCancelOpenOrder() {
    if (!openOrderId) return;
    setActionError(null);
    setVoidingOrderId(openOrderId);
    try {
      await voidOrder(openOrderId, { reason: "Cancelled at POS" });
      dispatch(clearPosSale());
      queryClient.removeQueries({ queryKey: ["pos", "order", openOrderId] });
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.message : "Could not cancel order",
      );
    } finally {
      setVoidingOrderId(null);
    }
  }

  async function handleVoidCompletedSale(orderId: string, receiptNumber: number | null) {
    const label = receiptNumber != null ? `receipt #${receiptNumber}` : "this sale";
    if (!window.confirm(`Void ${label} and refund cash? Stock will be restored.`)) {
      return;
    }
    setActionError(null);
    setVoidingOrderId(orderId);
    try {
      await voidOrder(orderId, { reason: "Voided at POS" });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "completed"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "products", "pos"] });
      queryClient.invalidateQueries({ queryKey: ["kitchen", "tickets"] });
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.message : "Could not void sale",
      );
    } finally {
      setVoidingOrderId(null);
    }
  }

  const order = orderQuery.data;
  const currency = order?.currency ?? tenantCurrency;
  const canCheckout = Boolean(order && order.items.length > 0);

  return (
    <div className="flex h-full min-h-[calc(100vh-8rem)] flex-col gap-4 lg:flex-row">
      <section className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Point of sale</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap products to build an order, then take cash payment.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={startNewSale}
            disabled={!openOrderId && !receiptOrderId}
          >
            New sale
          </Button>
        </div>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
        />

        {productsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading products…</p>
        ) : null}

        {productsQuery.isError ? (
          <p className="text-sm text-red-600">
            {(productsQuery.error as Error).message}
          </p>
        ) : null}

        {!productsQuery.isLoading && sellableProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No sellable products yet. Add products with a unit price (and stock)
            under Inventory, then return here.
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-2 md:grid-cols-3 xl:grid-cols-4">
          {sellableProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              disabled={busyProductId === product.id || ensureOrder.isPending}
              onClick={() => void handleAddProduct(product)}
              className="rounded-xl border border-border bg-card p-4 text-left transition hover:border-brand-rich-teal hover:bg-muted disabled:opacity-60"
            >
              <p className="font-medium text-foreground">{product.name}</p>
              {product.category ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {product.category}
                </p>
              ) : null}
              <p className="mt-3 text-sm font-semibold text-brand-rich-teal">
                {formatMinorUnits(product.unit_price_minor!, product.currency!)}
              </p>
            </button>
          ))}
        </div>
      </section>

      <aside className="flex w-full shrink-0 flex-col rounded-2xl border border-border bg-card p-4 lg:w-96">
        <h2 className="text-lg font-semibold text-foreground">Current order</h2>
        {!order || order.items.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Cart is empty. Select products to start a sale.
          </p>
        ) : (
          <ul className="mt-4 flex-1 space-y-3 overflow-y-auto">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-2 border-b border-border pb-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatMinorUnits(item.unit_price_minor, item.currency)} each
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-border p-1 hover:bg-muted"
                      aria-label="Decrease quantity"
                      onClick={() =>
                        void handleQuantity(
                          item.id,
                          quantityStep(item.quantity, -1),
                        )
                      }
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="min-w-6 text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="rounded-md border border-border p-1 hover:bg-muted"
                      aria-label="Increase quantity"
                      onClick={() =>
                        void handleQuantity(
                          item.id,
                          quantityStep(item.quantity, 1),
                        )
                      }
                    >
                      <Plus className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="ml-1 rounded-md border border-border p-1 text-red-600 hover:bg-muted"
                      aria-label="Remove item"
                      onClick={() => void handleRemove(item.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm font-semibold">
                  {formatMinorUnits(item.line_total_minor, item.currency)}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>
              {formatMinorUnits(order?.total_minor ?? 0, currency)}
            </span>
          </div>

          <div>
            <label
              htmlFor="tendered"
              className="text-sm font-medium text-foreground"
            >
              Cash tendered ({currency})
            </label>
            <input
              id="tendered"
              inputMode="decimal"
              placeholder="Leave blank for exact amount"
              value={tenderedMajor}
              onChange={(event) => setTenderedMajor(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
            />
          </div>

          {actionError ? (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {actionError}
            </p>
          ) : null}

          <Button
            type="button"
            className="w-full"
            disabled={!canCheckout}
            onClick={() => void handleCompleteCash()}
          >
            Complete cash sale
          </Button>

          {openOrderId && order && order.items.length > 0 ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={voidingOrderId === openOrderId}
              onClick={() => void handleCancelOpenOrder()}
            >
              Cancel order
            </Button>
          ) : null}
        </div>

        <div className="mt-6 border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-foreground">Recent sales</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Void a completed sale to refund cash and restore stock.
          </p>
          {recentSalesQuery.isLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
          ) : null}
          {!recentSalesQuery.isLoading &&
          (recentSalesQuery.data?.items.length ?? 0) === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No recent sales.</p>
          ) : null}
          <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
            {(recentSalesQuery.data?.items ?? []).map((sale) => (
              <li
                key={sale.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {sale.receipt_number != null
                      ? `Receipt #${sale.receipt_number}`
                      : `Order ${sale.id.slice(0, 8)}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatMinorUnits(sale.total_minor, sale.currency)}
                    {sale.completed_at
                      ? ` · ${new Date(sale.completed_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : null}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={voidingOrderId === sale.id}
                  onClick={() =>
                    void handleVoidCompletedSale(sale.id, sale.receipt_number)
                  }
                >
                  Void
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {receiptOrderId ? (
        <ReceiptModal
          orderId={receiptOrderId}
          onClose={() => dispatch(setReceiptOrderId(null))}
          onNewSale={startNewSale}
        />
      ) : null}
    </div>
  );
}
