"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import type {
  FieldPath,
  FieldValues,
  Path,
  PathValue,
  UseFormReturn,
} from "react-hook-form";

import { listProductUnits } from "@/features/inventory/api";
import type { ProductRead } from "@/features/inventory/types";

const fieldClassName =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2";

type IngredientMeasureFieldsProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  productIdField: FieldPath<T>;
  quantityField: FieldPath<T>;
  unitIdField: FieldPath<T>;
  products: ProductRead[];
  className?: string;
};

export function IngredientMeasureFields<T extends FieldValues>({
  form,
  productIdField,
  quantityField,
  unitIdField,
  products,
  className,
}: IngredientMeasureFieldsProps<T>) {
  const productId = String(form.watch(productIdField) ?? "");
  const selected = products.find((product) => product.id === productId);

  const unitsQuery = useQuery({
    queryKey: ["inventory", "product-units", productId],
    queryFn: () => listProductUnits(productId),
    enabled: Boolean(productId),
  });

  const units = useMemo(
    () =>
      unitsQuery.data?.map((row) => row.unit) ??
      (selected ? [selected.base_unit] : []),
    [unitsQuery.data, selected],
  );

  useEffect(() => {
    if (!selected) return;
    const current = String(form.getValues(unitIdField) ?? "");
    const valid = units.some((unit) => unit.id === current);
    if (!valid) {
      const recipePreferred =
        unitsQuery.data?.find((row) => row.is_recipe)?.unit.id ??
        selected.base_unit.id;
      form.setValue(
        unitIdField,
        recipePreferred as PathValue<T, Path<T>>,
        { shouldValidate: true },
      );
    }
  }, [selected, units, unitsQuery.data, form, unitIdField]);

  const selectedUnit = units.find(
    (unit) => unit.id === String(form.watch(unitIdField) ?? ""),
  );

  return (
    <div className={className ?? "grid gap-3 sm:grid-cols-2"}>
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Amount per serving
        </label>
        <input
          inputMode="decimal"
          placeholder={
            selectedUnit ? `e.g. 0.25 ${selectedUnit.symbol}` : "Quantity"
          }
          className={fieldClassName}
          {...form.register(quantityField)}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Unit
        </label>
        <select
          className={fieldClassName}
          disabled={!productId}
          {...form.register(unitIdField)}
        >
          <option value="">
            {productId ? "Select unit" : "Pick ingredient first"}
          </option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name} ({unit.symbol})
            </option>
          ))}
        </select>
        {selected ? (
          <p className="mt-1 text-[11px] text-muted-foreground">
            How much {selected.name} one serving uses. Prefer a recipe unit
            (g/ml) over large stock units when possible — add them under
            Inventory → Edit ingredient.
          </p>
        ) : null}
      </div>
    </div>
  );
}
