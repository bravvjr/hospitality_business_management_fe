"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  recordStockAdjustment,
  recordStockReceipt,
  recordStockUsage,
} from "@/features/inventory/api";
import {
  stockAdjustmentFormSchema,
  stockMovementFormSchema,
  type StockAdjustmentFormValues,
  type StockMovementFormValues,
} from "@/features/inventory/schemas";
import type { ProductRead } from "@/features/inventory/types";
import { ApiError } from "@/lib/api/client";

const fieldClassName =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2";

export type StockActionKind = "receipt" | "usage" | "adjustment";

type StockActionFormProps = {
  kind: StockActionKind;
  products: ProductRead[];
  initialProductId?: string;
  onDone: () => void;
  onCancel: () => void;
};

export function StockActionForm({
  kind,
  products,
  initialProductId,
  onDone,
  onCancel,
}: StockActionFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const isAdjustment = kind === "adjustment";

  const movementForm = useForm<StockMovementFormValues>({
    resolver: zodResolver(stockMovementFormSchema),
    defaultValues: {
      product_id: initialProductId ?? "",
      quantity: "",
      unit_id: "",
      reason: kind === "receipt" ? "purchase" : "usage",
      note: "",
    },
  });

  const adjustmentForm = useForm<StockAdjustmentFormValues>({
    resolver: zodResolver(stockAdjustmentFormSchema),
    defaultValues: {
      product_id: initialProductId ?? "",
      quantity: "",
      unit_id: "",
      reason: "correction",
      note: "",
    },
  });

  const productId = isAdjustment
    ? adjustmentForm.watch("product_id")
    : movementForm.watch("product_id");

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId),
    [products, productId],
  );

  useEffect(() => {
    const unitId = selectedProduct?.base_unit.id ?? "";
    if (isAdjustment) {
      adjustmentForm.setValue("unit_id", unitId);
    } else {
      movementForm.setValue("unit_id", unitId);
    }
  }, [selectedProduct, isAdjustment, adjustmentForm, movementForm]);

  async function submitMovement(values: StockMovementFormValues) {
    setFormError(null);
    const payload = {
      product_id: values.product_id,
      quantity: values.quantity,
      unit_id: values.unit_id,
      reason: values.reason,
      note: values.note?.trim() || null,
    };
    try {
      if (kind === "receipt") {
        await recordStockReceipt(payload);
      } else {
        await recordStockUsage(payload);
      }
      onDone();
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Could not record movement",
      );
    }
  }

  async function submitAdjustment(values: StockAdjustmentFormValues) {
    setFormError(null);
    try {
      await recordStockAdjustment({
        product_id: values.product_id,
        quantity: values.quantity,
        unit_id: values.unit_id,
        reason: values.reason,
        note: values.note?.trim() || null,
      });
      onDone();
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Could not record adjustment",
      );
    }
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        Quantities use the product base unit for now.
      </p>
      <div className="mt-4">
        {isAdjustment ? (
          <form
            onSubmit={adjustmentForm.handleSubmit(submitAdjustment)}
            className="space-y-4"
          >
            <div>
              <label htmlFor="adj-product" className="text-sm font-medium">
                Product
              </label>
              <select
                id="adj-product"
                className={fieldClassName}
                {...adjustmentForm.register("product_id")}
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              {adjustmentForm.formState.errors.product_id ? (
                <p className="mt-1 text-sm text-red-600">
                  {adjustmentForm.formState.errors.product_id.message}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="adj-qty" className="text-sm font-medium">
                Signed quantity ({selectedProduct?.base_unit.symbol ?? "base"})
              </label>
              <input
                id="adj-qty"
                className={fieldClassName}
                placeholder="e.g. 2 or -1"
                {...adjustmentForm.register("quantity")}
              />
              {adjustmentForm.formState.errors.quantity ? (
                <p className="mt-1 text-sm text-red-600">
                  {adjustmentForm.formState.errors.quantity.message}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="adj-reason" className="text-sm font-medium">
                Reason
              </label>
              <input
                id="adj-reason"
                className={fieldClassName}
                {...adjustmentForm.register("reason")}
              />
            </div>
            <div>
              <label htmlFor="adj-note" className="text-sm font-medium">
                Note
              </label>
              <input
                id="adj-note"
                className={fieldClassName}
                {...adjustmentForm.register("note")}
              />
            </div>
            {formError ? <ErrorBanner message={formError} /> : null}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={adjustmentForm.formState.isSubmitting}
              >
                {adjustmentForm.formState.isSubmitting
                  ? "Saving…"
                  : "Save adjustment"}
              </Button>
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={movementForm.handleSubmit(submitMovement)}
            className="space-y-4"
          >
            <div>
              <label htmlFor="mov-product" className="text-sm font-medium">
                Product
              </label>
              <select
                id="mov-product"
                className={fieldClassName}
                {...movementForm.register("product_id")}
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              {movementForm.formState.errors.product_id ? (
                <p className="mt-1 text-sm text-red-600">
                  {movementForm.formState.errors.product_id.message}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="mov-qty" className="text-sm font-medium">
                Quantity ({selectedProduct?.base_unit.symbol ?? "base"})
              </label>
              <input
                id="mov-qty"
                className={fieldClassName}
                {...movementForm.register("quantity")}
              />
              {movementForm.formState.errors.quantity ? (
                <p className="mt-1 text-sm text-red-600">
                  {movementForm.formState.errors.quantity.message}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="mov-reason" className="text-sm font-medium">
                Reason
              </label>
              <input
                id="mov-reason"
                className={fieldClassName}
                {...movementForm.register("reason")}
              />
            </div>
            <div>
              <label htmlFor="mov-note" className="text-sm font-medium">
                Note
              </label>
              <input
                id="mov-note"
                className={fieldClassName}
                {...movementForm.register("note")}
              />
            </div>
            {formError ? <ErrorBanner message={formError} /> : null}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={movementForm.formState.isSubmitting}
              >
                {movementForm.formState.isSubmitting
                  ? "Saving…"
                  : kind === "receipt"
                    ? "Receive"
                    : "Record usage"}
              </Button>
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function stockActionTitle(kind: StockActionKind): string {
  return kind === "receipt"
    ? "Receive stock"
    : kind === "usage"
      ? "Record usage"
      : "Adjust stock";
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
      {message}
    </p>
  );
}
