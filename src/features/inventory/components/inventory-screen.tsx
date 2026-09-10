"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  listProducts,
  listStockLevels,
  listStockMovements,
  updateProduct,
} from "@/features/inventory/api";
import { ProductCreateForm } from "@/features/inventory/components/product-create-form";
import {
  StockActionForm,
  type StockActionKind,
} from "@/features/inventory/components/stock-action-form";
import { formatMinorUnits } from "@/lib/money";

type TabKey = "products" | "stock" | "movements";

export function InventoryScreen() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>("products");
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [stockAction, setStockAction] = useState<{
    kind: StockActionKind;
    productId?: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [statusError, setStatusError] = useState<string | null>(null);

  const productsQuery = useQuery({
    queryKey: ["inventory", "products"],
    queryFn: () => listProducts({ limit: 200 }),
  });

  const levelsQuery = useQuery({
    queryKey: ["inventory", "stock-levels"],
    queryFn: () => listStockLevels({ limit: 200 }),
  });

  const movementsQuery = useQuery({
    queryKey: ["inventory", "movements"],
    queryFn: () => listStockMovements({ limit: 50 }),
  });

  const products = useMemo(
    () => productsQuery.data?.items ?? [],
    [productsQuery.data?.items],
  );
  const levels = levelsQuery.data?.items ?? [];
  const movements = movementsQuery.data?.items ?? [];

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(q) ||
        product.sku?.toLowerCase().includes(q) ||
        product.category?.toLowerCase().includes(q),
    );
  }, [products, search]);

  async function invalidateInventory() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["inventory"] }),
      queryClient.invalidateQueries({ queryKey: ["inventory", "products", "pos"] }),
    ]);
  }

  async function toggleStatus(productId: string, status: string) {
    setStatusError(null);
    try {
      await updateProduct(productId, {
        status: status === "active" ? "inactive" : "active",
      });
      await invalidateInventory();
    } catch (error) {
      setStatusError(
        error instanceof Error ? error.message : "Could not update status",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage products, stock levels, and movement history.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setShowCreateProduct(true)}>
            Add product
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setStockAction({ kind: "receipt" })}
          >
            Receive
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setStockAction({ kind: "usage" })}
          >
            Usage
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setStockAction({ kind: "adjustment" })}
          >
            Adjust
          </Button>
        </div>
      </div>

      {(showCreateProduct || stockAction) && (
        <div className="space-y-4">
          {showCreateProduct ? (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-lg font-semibold">New product</h2>
              <div className="mt-4">
                <ProductCreateForm
                  onCancel={() => setShowCreateProduct(false)}
                  onCreated={async () => {
                    setShowCreateProduct(false);
                    await invalidateInventory();
                    setTab("products");
                  }}
                />
              </div>
            </div>
          ) : null}
          {stockAction ? (
            <StockActionForm
              kind={stockAction.kind}
              products={products}
              initialProductId={stockAction.productId}
              onCancel={() => setStockAction(null)}
              onDone={async () => {
                setStockAction(null);
                await invalidateInventory();
                setTab(stockAction.kind === "receipt" ? "stock" : "movements");
              }}
            />
          ) : null}
        </div>
      )}

      <div className="flex gap-2 border-b border-border">
        {(
          [
            ["products", "Products"],
            ["stock", "Stock levels"],
            ["movements", "Movements"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
              tab === key
                ? "border-brand-rich-teal text-brand-rich-teal"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {statusError ? (
        <p className="text-sm text-red-600">{statusError}</p>
      ) : null}

      {tab === "products" ? (
        <section className="space-y-3">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products…"
            className="w-full max-w-md rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
          />
          {productsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading products…</p>
          ) : null}
          {productsQuery.isError ? (
            <p className="text-sm text-red-600">
              {(productsQuery.error as Error).message}
            </p>
          ) : null}
          {!productsQuery.isLoading && filteredProducts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No products yet. Add one to start receiving stock and selling in
              POS.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/60 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">SKU</th>
                    <th className="px-3 py-2 font-medium">Unit</th>
                    <th className="px-3 py-2 font-medium">Price</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-t border-border">
                      <td className="px-3 py-2">
                        <div className="font-medium">{product.name}</div>
                        {product.category ? (
                          <div className="text-xs text-muted-foreground">
                            {product.category}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {product.sku ?? "—"}
                      </td>
                      <td className="px-3 py-2">{product.base_unit.symbol}</td>
                      <td className="px-3 py-2">
                        {product.unit_price_minor != null && product.currency
                          ? formatMinorUnits(
                              product.unit_price_minor,
                              product.currency,
                            )
                          : "—"}
                      </td>
                      <td className="px-3 py-2 capitalize">{product.status}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="text-brand-rich-teal hover:underline"
                            onClick={() =>
                              setStockAction({
                                kind: "receipt",
                                productId: product.id,
                              })
                            }
                          >
                            Receive
                          </button>
                          <button
                            type="button"
                            className="text-muted-foreground hover:underline"
                            onClick={() =>
                              void toggleStatus(product.id, product.status)
                            }
                          >
                            {product.status === "active"
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {tab === "stock" ? (
        <section>
          {levelsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading stock…</p>
          ) : null}
          {levelsQuery.isError ? (
            <p className="text-sm text-red-600">
              {(levelsQuery.error as Error).message}
            </p>
          ) : null}
          {!levelsQuery.isLoading && levels.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No stock levels yet. Receive stock against a product to create
              levels.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/60 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Product</th>
                    <th className="px-3 py-2 font-medium">On hand</th>
                    <th className="px-3 py-2 font-medium">Reorder at</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {levels.map((level) => (
                    <tr key={level.product_id} className="border-t border-border">
                      <td className="px-3 py-2 font-medium">
                        {level.product_name}
                      </td>
                      <td className="px-3 py-2">
                        {level.quantity_base} {level.base_unit.symbol}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {level.reorder_level_base
                          ? `${level.reorder_level_base} ${level.base_unit.symbol}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {level.is_low_stock ? (
                          <span className="font-medium text-amber-700 dark:text-amber-300">
                            Low stock
                          </span>
                        ) : (
                          <span className="text-muted-foreground">OK</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="text-brand-rich-teal hover:underline"
                            onClick={() =>
                              setStockAction({
                                kind: "receipt",
                                productId: level.product_id,
                              })
                            }
                          >
                            Receive
                          </button>
                          <button
                            type="button"
                            className="text-muted-foreground hover:underline"
                            onClick={() =>
                              setStockAction({
                                kind: "usage",
                                productId: level.product_id,
                              })
                            }
                          >
                            Use
                          </button>
                          <button
                            type="button"
                            className="text-muted-foreground hover:underline"
                            onClick={() =>
                              setStockAction({
                                kind: "adjustment",
                                productId: level.product_id,
                              })
                            }
                          >
                            Adjust
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {tab === "movements" ? (
        <section>
          {movementsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading movements…</p>
          ) : null}
          {movementsQuery.isError ? (
            <p className="text-sm text-red-600">
              {(movementsQuery.error as Error).message}
            </p>
          ) : null}
          {!movementsQuery.isLoading && movements.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No movements recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/60 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">When</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Delta</th>
                    <th className="px-3 py-2 font-medium">Entered</th>
                    <th className="px-3 py-2 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => {
                    const productName =
                      products.find((p) => p.id === movement.product_id)
                        ?.name ?? movement.product_id.slice(0, 8);
                    return (
                      <tr key={movement.id} className="border-t border-border">
                        <td className="px-3 py-2 text-muted-foreground">
                          {new Date(movement.created_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium capitalize">
                            {movement.movement_type.replaceAll("_", " ")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {productName}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          {movement.quantity_delta_base}{" "}
                          {movement.entered_unit.symbol}
                        </td>
                        <td className="px-3 py-2">
                          {movement.entered_quantity}{" "}
                          {movement.entered_unit.symbol}
                        </td>
                        <td className="px-3 py-2">{movement.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
