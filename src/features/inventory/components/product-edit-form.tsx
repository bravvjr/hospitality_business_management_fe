"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  addProductUnit,
  listProductUnits,
  listUnits,
  updateProduct,
} from "@/features/inventory/api";
import {
  productEditSchema,
  productUnitFormSchema,
  type ProductEditFormValues,
  type ProductUnitFormValues,
} from "@/features/inventory/schemas";
import type { ProductRead } from "@/features/inventory/types";
import { ApiError } from "@/lib/api/client";
import { formatMinorUnits, parseMajorToMinor } from "@/lib/money";
import { useAppSelector } from "@/lib/store/hooks";

const fieldClassName =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2";

type ProductEditFormProps = {
  product: ProductRead;
  onSaved: () => void;
  onCancel: () => void;
};

function formatMinorAsMajor(amountMinor: number | null): string {
  if (amountMinor == null) return "";
  return (amountMinor / 100).toFixed(2);
}

export function ProductEditForm({
  product,
  onSaved,
  onCancel,
}: ProductEditFormProps) {
  const queryClient = useQueryClient();
  const tenantCurrency = useAppSelector(
    (state) => state.auth.tenant?.base_currency ?? "KES",
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [unitError, setUnitError] = useState<string | null>(null);

  const unitsQuery = useQuery({
    queryKey: ["inventory", "units"],
    queryFn: listUnits,
  });

  const productUnitsQuery = useQuery({
    queryKey: ["inventory", "product-units", product.id],
    queryFn: () => listProductUnits(product.id),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductEditFormValues>({
    resolver: zodResolver(productEditSchema),
    defaultValues: {
      name: product.name,
      sku: product.sku ?? "",
      category: product.category ?? "",
      reorder_level_base: product.reorder_level_base ?? "",
      unit_cost_major: formatMinorAsMajor(product.unit_cost_minor),
      cost_currency: product.cost_currency ?? tenantCurrency,
    },
  });

  const unitForm = useForm<ProductUnitFormValues>({
    resolver: zodResolver(productUnitFormSchema),
    defaultValues: { unit_id: "", to_base_factor: "" },
  });

  const existingUnitIds = useMemo(
    () => new Set((productUnitsQuery.data ?? []).map((row) => row.unit.id)),
    [productUnitsQuery.data],
  );

  const availableUnits = useMemo(
    () =>
      (unitsQuery.data ?? []).filter((unit) => !existingUnitIds.has(unit.id)),
    [unitsQuery.data, existingUnitIds],
  );

  async function onSubmit(values: ProductEditFormValues) {
    setFormError(null);
    const costMajor = values.unit_cost_major?.trim() ?? "";
    let unitCostMinor: number | null = null;
    if (costMajor) {
      unitCostMinor = parseMajorToMinor(costMajor);
      if (unitCostMinor == null) {
        setFormError("Enter a valid unit cost");
        return;
      }
    }

    try {
      await updateProduct(product.id, {
        name: values.name.trim(),
        sku: values.sku?.trim() || null,
        category: values.category?.trim() || null,
        reorder_level_base: values.reorder_level_base?.trim() || null,
        unit_cost_minor: unitCostMinor,
        cost_currency:
          unitCostMinor != null
            ? (values.cost_currency || tenantCurrency).toUpperCase()
            : null,
      });
      await queryClient.invalidateQueries({ queryKey: ["inventory"] });
      onSaved();
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Could not update ingredient",
      );
    }
  }

  async function onAddUnit(values: ProductUnitFormValues) {
    setUnitError(null);
    try {
      await addProductUnit(product.id, {
        unit_id: values.unit_id,
        to_base_factor: values.to_base_factor,
        is_recipe: true,
        is_stock: false,
        is_purchase: false,
        is_sales: false,
      });
      unitForm.reset({ unit_id: "", to_base_factor: "" });
      await productUnitsQuery.refetch();
    } catch (error) {
      setUnitError(
        error instanceof ApiError
          ? error.message
          : "Could not add recipe unit",
      );
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="edit-name" className="text-sm font-medium">
            Ingredient name
          </label>
          <input
            id="edit-name"
            className={fieldClassName}
            {...register("name")}
          />
          {errors.name ? (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="edit-sku" className="text-sm font-medium">
              SKU
            </label>
            <input
              id="edit-sku"
              className={fieldClassName}
              {...register("sku")}
            />
          </div>
          <div>
            <label htmlFor="edit-category" className="text-sm font-medium">
              Category
            </label>
            <input
              id="edit-category"
              className={fieldClassName}
              {...register("category")}
            />
          </div>
        </div>

        <div>
          <label htmlFor="edit-reorder" className="text-sm font-medium">
            Reorder level ({product.base_unit.symbol})
          </label>
          <input
            id="edit-reorder"
            inputMode="decimal"
            placeholder={`e.g. 5 ${product.base_unit.symbol}`}
            className={fieldClassName}
            {...register("reorder_level_base")}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Low-stock alerts trigger when on-hand stock falls to this amount in
            the base unit ({product.base_unit.name}).
          </p>
          {errors.reorder_level_base ? (
            <p className="mt-1 text-sm text-red-600">
              {errors.reorder_level_base.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="edit-cost" className="text-sm font-medium">
              Unit cost (per {product.base_unit.symbol})
            </label>
            <input
              id="edit-cost"
              inputMode="decimal"
              className={fieldClassName}
              {...register("unit_cost_major")}
            />
          </div>
          <div>
            <label htmlFor="edit-cost-currency" className="text-sm font-medium">
              Cost currency
            </label>
            <input
              id="edit-cost-currency"
              maxLength={3}
              className={`${fieldClassName} uppercase`}
              {...register("cost_currency")}
            />
          </div>
        </div>

        {product.unit_price_minor != null && product.currency ? (
          <p className="text-xs text-muted-foreground">
            Current listed sell price:{" "}
            {formatMinorUnits(product.unit_price_minor, product.currency)}{" "}
            (menu meals should be priced on Recipes, not ingredients).
          </p>
        ) : null}

        {formError ? (
          <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {formError}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>

      <div className="space-y-3 border-t border-border pt-4">
        <div>
          <h3 className="text-sm font-semibold">Recipe measuring units</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Stock may be tracked in {product.base_unit.symbol}, while recipes
            often need a smaller unit (e.g. g when base is kg). Factor = how many
            base units one of this unit equals (g → kg = 0.001).
          </p>
        </div>

        <ul className="space-y-1 text-sm">
          {(productUnitsQuery.data ?? []).map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
            >
              <span>
                {row.unit.name} ({row.unit.symbol})
                {row.is_recipe ? (
                  <span className="ml-2 text-xs text-muted-foreground">
                    recipe
                  </span>
                ) : null}
              </span>
              <span className="text-muted-foreground">
                × {row.to_base_factor} {product.base_unit.symbol}
              </span>
            </li>
          ))}
        </ul>

        {availableUnits.length > 0 ? (
          <form
            onSubmit={unitForm.handleSubmit(onAddUnit)}
            className="grid gap-3 rounded-xl border border-dashed border-border p-3 sm:grid-cols-[1fr_1fr_auto]"
          >
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Unit
              </label>
              <select
                className={fieldClassName}
                {...unitForm.register("unit_id")}
              >
                <option value="">Select unit</option>
                {availableUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                To base factor
              </label>
              <input
                inputMode="decimal"
                placeholder="e.g. 0.001"
                className={fieldClassName}
                {...unitForm.register("to_base_factor")}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                variant="secondary"
                disabled={unitForm.formState.isSubmitting}
              >
                Add unit
              </Button>
            </div>
          </form>
        ) : null}

        {unitError ? (
          <p className="text-sm text-red-600">{unitError}</p>
        ) : null}
      </div>
    </div>
  );
}
