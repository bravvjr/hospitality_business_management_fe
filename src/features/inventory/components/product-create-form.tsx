"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { createProduct, listUnits } from "@/features/inventory/api";
import {
  productFormSchema,
  type ProductFormValues,
} from "@/features/inventory/schemas";
import { ApiError } from "@/lib/api/client";
import { parseMajorToMinor } from "@/lib/money";
import { useAppSelector } from "@/lib/store/hooks";

const fieldClassName =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2";

type ProductCreateFormProps = {
  onCreated: () => void;
  onCancel: () => void;
};

export function ProductCreateForm({
  onCreated,
  onCancel,
}: ProductCreateFormProps) {
  const tenantCurrency = useAppSelector(
    (state) => state.auth.tenant?.base_currency ?? "KES",
  );
  const [formError, setFormError] = useState<string | null>(null);

  const unitsQuery = useQuery({
    queryKey: ["inventory", "units"],
    queryFn: listUnits,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      base_unit_id: "",
      sku: "",
      category: "",
      reorder_level_base: "",
      unit_price_major: "",
      currency: tenantCurrency,
      unit_cost_major: "",
      cost_currency: tenantCurrency,
    },
  });

  async function onSubmit(values: ProductFormValues) {
    setFormError(null);
    const priceMajor = values.unit_price_major?.trim() ?? "";
    let unitPriceMinor: number | null = null;
    if (priceMajor) {
      unitPriceMinor = parseMajorToMinor(priceMajor);
      if (unitPriceMinor == null) {
        setFormError("Enter a valid sell price");
        return;
      }
    }

    const currency = (values.currency || tenantCurrency).toUpperCase();
    const costMajor = values.unit_cost_major?.trim() ?? "";
    let unitCostMinor: number | null = null;
    if (costMajor) {
      unitCostMinor = parseMajorToMinor(costMajor);
      if (unitCostMinor == null) {
        setFormError("Enter a valid unit cost");
        return;
      }
    }
    const costCurrency = (values.cost_currency || tenantCurrency).toUpperCase();

    try {
      await createProduct({
        name: values.name.trim(),
        base_unit_id: values.base_unit_id,
        sku: values.sku?.trim() || null,
        category: values.category?.trim() || null,
        reorder_level_base: values.reorder_level_base?.trim() || null,
        unit_price_minor: unitPriceMinor,
        currency: unitPriceMinor != null ? currency : null,
        unit_cost_minor: unitCostMinor,
        cost_currency: unitCostMinor != null ? costCurrency : null,
      });
      onCreated();
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Could not create product",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="text-sm font-medium">
          Product name
        </label>
        <input id="name" className={fieldClassName} {...register("name")} />
        {errors.name ? (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="base_unit_id" className="text-sm font-medium">
          Base unit
        </label>
        <select
          id="base_unit_id"
          className={fieldClassName}
          {...register("base_unit_id")}
        >
          <option value="">Select unit</option>
          {(unitsQuery.data ?? []).map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name} ({unit.symbol})
            </option>
          ))}
        </select>
        {errors.base_unit_id ? (
          <p className="mt-1 text-sm text-red-600">
            {errors.base_unit_id.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sku" className="text-sm font-medium">
            SKU
          </label>
          <input id="sku" className={fieldClassName} {...register("sku")} />
        </div>
        <div>
          <label htmlFor="category" className="text-sm font-medium">
            Category
          </label>
          <input
            id="category"
            className={fieldClassName}
            {...register("category")}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="unit_price_major" className="text-sm font-medium">
            Sell price
          </label>
          <input
            id="unit_price_major"
            inputMode="decimal"
            placeholder="e.g. 150.00"
            className={fieldClassName}
            {...register("unit_price_major")}
          />
          {errors.unit_price_major ? (
            <p className="mt-1 text-sm text-red-600">
              {errors.unit_price_major.message}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="currency" className="text-sm font-medium">
            Currency
          </label>
          <input
            id="currency"
            maxLength={3}
            className={`${fieldClassName} uppercase`}
            {...register("currency")}
          />
        </div>
        <div>
          <label htmlFor="reorder_level_base" className="text-sm font-medium">
            Reorder level
          </label>
          <input
            id="reorder_level_base"
            inputMode="decimal"
            className={fieldClassName}
            {...register("reorder_level_base")}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="unit_cost_major" className="text-sm font-medium">
            Unit cost (per base unit)
          </label>
          <input
            id="unit_cost_major"
            inputMode="decimal"
            placeholder="e.g. 50.00"
            className={fieldClassName}
            {...register("unit_cost_major")}
          />
        </div>
        <div>
          <label htmlFor="cost_currency" className="text-sm font-medium">
            Cost currency
          </label>
          <input
            id="cost_currency"
            maxLength={3}
            className={`${fieldClassName} uppercase`}
            {...register("cost_currency")}
          />
        </div>
      </div>

      {formError ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {formError}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Create product"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
