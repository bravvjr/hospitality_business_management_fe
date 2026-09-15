"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listProducts } from "@/features/inventory/api";
import type { ProductRead } from "@/features/inventory/types";
import {
  addRecipeItem,
  createRecipe,
  deleteRecipe,
  deleteRecipeItem,
  getRecipe,
  getRecipeCost,
  listRecipes,
  updateRecipe,
  updateRecipeItem,
} from "@/features/recipes/api";
import {
  recipeCreateSchema,
  recipeIngredientLineSchema,
  recipeItemSchema,
  type RecipeCreateFormValues,
  type RecipeIngredientLineValues,
} from "@/features/recipes/schemas";
import type { RecipeRead, RecipeSummaryRead } from "@/features/recipes/types";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/auth/permissions";
import { formatMinorUnits } from "@/lib/money";
import { permissionsForRole } from "@/lib/auth/role-permissions";
import { useAppSelector } from "@/lib/store/hooks";

const fieldClassName =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2";

type CreateRecipeFormValues = RecipeCreateFormValues & {
  items: RecipeIngredientLineValues[];
};

export function RecipesScreen() {
  const queryClient = useQueryClient();
  const roleKey = useAppSelector(
    (state) => state.auth.membership?.role.key ?? "",
  );
  const canWrite = hasPermission(
    permissionsForRole(roleKey),
    "recipes.write",
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showAddIngredient, setShowAddIngredient] = useState(false);

  const recipesQuery = useQuery({
    queryKey: ["recipes", "list"],
    queryFn: () => listRecipes({ limit: 200 }),
  });

  const productsQuery = useQuery({
    queryKey: ["inventory", "products"],
    queryFn: () => listProducts({ limit: 200 }),
  });

  const detailQuery = useQuery({
    queryKey: ["recipes", "detail", selectedId],
    queryFn: () => getRecipe(selectedId!),
    enabled: Boolean(selectedId),
  });

  const costQuery = useQuery({
    queryKey: ["recipes", "cost", selectedId],
    queryFn: () => getRecipeCost(selectedId!),
    enabled: Boolean(selectedId),
  });

  const recipes = recipesQuery.data?.items ?? [];
  const products = productsQuery.data?.items ?? [];

  const filteredRecipes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter((recipe) =>
      recipe.product.name.toLowerCase().includes(q),
    );
  }, [recipes, search]);

  const recipeProductIds = useMemo(
    () => new Set(recipes.map((recipe) => recipe.product_id)),
    [recipes],
  );

  const sellableProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.status === "active" &&
          product.unit_price_minor != null &&
          !recipeProductIds.has(product.id),
      ),
    [products, recipeProductIds],
  );

  const ingredientProducts = useMemo(
    () => products.filter((product) => product.status === "active"),
    [products],
  );

  async function invalidateRecipes() {
    await queryClient.invalidateQueries({ queryKey: ["recipes"] });
  }

  async function invalidateRecipeDetail(recipeId: string) {
    await invalidateRecipes();
    await queryClient.invalidateQueries({
      queryKey: ["recipes", "detail", recipeId],
    });
    await queryClient.invalidateQueries({
      queryKey: ["recipes", "cost", recipeId],
    });
  }

  const createForm = useForm<CreateRecipeFormValues>({
    resolver: zodResolver(
      recipeCreateSchema.extend({
        items: recipeIngredientLineSchema.array().min(1, "Add at least one ingredient"),
      }),
    ),
    defaultValues: {
      product_id: "",
      yields_quantity: "1",
      notes: "",
      items: [{ ingredient_product_id: "", quantity: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: createForm.control,
    name: "items",
  });

  const createMealProductId = createForm.watch("product_id");

  const addIngredientForm = useForm<RecipeIngredientLineValues>({
    resolver: zodResolver(recipeIngredientLineSchema),
    defaultValues: { ingredient_product_id: "", quantity: "" },
  });

  const editItemForm = useForm<{ quantity: string }>({
    resolver: zodResolver(recipeItemSchema),
    defaultValues: { quantity: "" },
  });

  function ingredientOptions(
    mealProductId: string | undefined,
    existingIngredientIds: string[] = [],
  ): ProductRead[] {
    const taken = new Set(existingIngredientIds);
    return ingredientProducts.filter(
      (product) =>
        product.id !== mealProductId && !taken.has(product.id),
    );
  }

  async function onCreateRecipe(values: CreateRecipeFormValues) {
    setActionError(null);
    const seen = new Set<string>();
    for (const line of values.items) {
      if (seen.has(line.ingredient_product_id)) {
        setActionError("Each ingredient can only appear once");
        return;
      }
      seen.add(line.ingredient_product_id);
    }

    const ingredientById = new Map(
      ingredientProducts.map((product) => [product.id, product]),
    );

    try {
      const created = await createRecipe({
        product_id: values.product_id,
        yields_quantity: values.yields_quantity,
        notes: values.notes?.trim() || null,
        items: values.items.map((line, index) => {
          const ingredient = ingredientById.get(line.ingredient_product_id);
          if (!ingredient) {
            throw new Error("Ingredient product not found");
          }
          return {
            ingredient_product_id: line.ingredient_product_id,
            quantity: line.quantity,
            unit_id: ingredient.base_unit.id,
            sort_order: index,
          };
        }),
      });
      createForm.reset({
        product_id: "",
        yields_quantity: "1",
        notes: "",
        items: [{ ingredient_product_id: "", quantity: "" }],
      });
      setShowCreate(false);
      await invalidateRecipes();
      setSelectedId(created.id);
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.message : "Could not create recipe",
      );
    }
  }

  async function onToggleStatus(recipe: RecipeSummaryRead | RecipeRead) {
    if (!canWrite) return;
    setActionError(null);
    try {
      await updateRecipe(recipe.id, {
        status: recipe.status === "active" ? "inactive" : "active",
      });
      await invalidateRecipes();
      if (selectedId === recipe.id) {
        await queryClient.invalidateQueries({
          queryKey: ["recipes", "detail", recipe.id],
        });
      }
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.message : "Could not update recipe",
      );
    }
  }

  async function onDeleteRecipe(recipeId: string) {
    if (!canWrite) return;
    setActionError(null);
    try {
      await deleteRecipe(recipeId);
      if (selectedId === recipeId) setSelectedId(null);
      await invalidateRecipes();
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.message : "Could not delete recipe",
      );
    }
  }

  async function onAddIngredient(
    recipe: RecipeRead,
    values: RecipeIngredientLineValues,
  ) {
    if (!canWrite) return;
    setActionError(null);
    const ingredient = ingredientProducts.find(
      (product) => product.id === values.ingredient_product_id,
    );
    if (!ingredient) {
      setActionError("Ingredient product not found");
      return;
    }
    try {
      await addRecipeItem(recipe.id, {
        ingredient_product_id: values.ingredient_product_id,
        quantity: values.quantity,
        unit_id: ingredient.base_unit.id,
        sort_order: recipe.items.length,
      });
      addIngredientForm.reset({ ingredient_product_id: "", quantity: "" });
      setShowAddIngredient(false);
      await invalidateRecipeDetail(recipe.id);
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.message : "Could not add ingredient",
      );
    }
  }

  async function onSaveItemQuantity(recipeId: string, itemId: string) {
    if (!canWrite) return;
    setActionError(null);
    const quantity = editItemForm.getValues("quantity");
    try {
      await updateRecipeItem(recipeId, itemId, { quantity });
      setEditingItemId(null);
      await invalidateRecipeDetail(recipeId);
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.message : "Could not update ingredient",
      );
    }
  }

  async function onDeleteItem(recipeId: string, itemId: string) {
    if (!canWrite) return;
    setActionError(null);
    try {
      await deleteRecipeItem(recipeId, itemId);
      await invalidateRecipeDetail(recipeId);
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.message : "Could not remove ingredient",
      );
    }
  }

  const selectedRecipe = detailQuery.data;
  const recipeCost = costQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recipes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Link menu items to ingredient bills of materials. POS sales deduct
            ingredients automatically when a recipe is active.
          </p>
        </div>
        {canWrite ? (
          <Button
            type="button"
            onClick={() => {
              setShowCreate(true);
              setActionError(null);
            }}
          >
            New recipe
          </Button>
        ) : null}
      </div>

      {actionError ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {actionError}
        </p>
      ) : null}

      <Dialog open={showCreate && canWrite} onOpenChange={setShowCreate}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New recipe</DialogTitle>
            <DialogDescription>
              Link a menu item to its ingredient bill of materials.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit(onCreateRecipe)}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="product_id" className="text-sm font-medium">
                  Meal / menu item
                </label>
                <select
                  id="product_id"
                  className={fieldClassName}
                  {...createForm.register("product_id")}
                >
                  <option value="">Select sellable product</option>
                  {sellableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                {createForm.formState.errors.product_id ? (
                  <p className="mt-1 text-sm text-red-600">
                    {createForm.formState.errors.product_id.message}
                  </p>
                ) : null}
              </div>
              <div>
                <label htmlFor="yields_quantity" className="text-sm font-medium">
                  Yields (servings)
                </label>
                <input
                  id="yields_quantity"
                  inputMode="decimal"
                  className={fieldClassName}
                  {...createForm.register("yields_quantity")}
                />
                {createForm.formState.errors.yields_quantity ? (
                  <p className="mt-1 text-sm text-red-600">
                    {createForm.formState.errors.yields_quantity.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="text-sm font-medium">
                Notes
              </label>
              <textarea
                id="notes"
                rows={2}
                className={fieldClassName}
                {...createForm.register("notes")}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Ingredients</h3>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    append({ ingredient_product_id: "", quantity: "" })
                  }
                >
                  Add line
                </Button>
              </div>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-[1fr_140px_auto]"
                >
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Ingredient
                    </label>
                    <select
                      className={fieldClassName}
                      {...createForm.register(
                        `items.${index}.ingredient_product_id`,
                      )}
                    >
                      <option value="">Select ingredient</option>
                      {ingredientOptions(createMealProductId).map(
                        (product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Quantity
                    </label>
                    <input
                      inputMode="decimal"
                      className={fieldClassName}
                      {...createForm.register(`items.${index}.quantity`)}
                    />
                  </div>
                  <div className="flex items-end">
                    {fields.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => remove(index)}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
              {createForm.formState.errors.items?.message ? (
                <p className="text-sm text-red-600">
                  {createForm.formState.errors.items.message}
                </p>
              ) : null}
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={createForm.formState.isSubmitting}
              >
                {createForm.formState.isSubmitting ? "Saving…" : "Create recipe"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="space-y-3">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search recipes…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
          />
          {recipesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading recipes…</p>
          ) : null}
          {recipesQuery.isError ? (
            <p className="text-sm text-red-600">
              {(recipesQuery.error as Error).message}
            </p>
          ) : null}
          {!recipesQuery.isLoading && filteredRecipes.length === 0 ? (
            <p className="glass-panel rounded-xl border-dashed p-6 text-sm text-muted-foreground">
              No recipes yet. Create a BOM for a menu item so POS sales deduct
              ingredients instead of the meal product.
            </p>
          ) : (
            <div className="glass-panel overflow-x-auto rounded-xl">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/60 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Menu item</th>
                    <th className="px-3 py-2 font-medium">Yields</th>
                    <th className="px-3 py-2 font-medium">Items</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecipes.map((recipe) => (
                    <tr
                      key={recipe.id}
                      className={`cursor-pointer border-t border-border transition hover:bg-muted/40 ${
                        selectedId === recipe.id ? "bg-muted/50" : ""
                      }`}
                      onClick={() => {
                        setSelectedId(recipe.id);
                        setShowAddIngredient(false);
                        setEditingItemId(null);
                        setActionError(null);
                      }}
                    >
                      <td className="px-3 py-2 font-medium">
                        {recipe.product.name}
                      </td>
                      <td className="px-3 py-2">{recipe.yields_quantity}</td>
                      <td className="px-3 py-2">{recipe.item_count}</td>
                      <td className="px-3 py-2 capitalize">{recipe.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="glass-panel rounded-2xl p-5">
          {!selectedId ? (
            <p className="text-sm text-muted-foreground">
              Select a recipe to view ingredients and manage the BOM.
            </p>
          ) : detailQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading recipe…</p>
          ) : detailQuery.isError ? (
            <p className="text-sm text-red-600">
              {(detailQuery.error as Error).message}
            </p>
          ) : selectedRecipe ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {selectedRecipe.product.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Yields {selectedRecipe.yields_quantity}{" "}
                    {selectedRecipe.product.base_unit.symbol} ·{" "}
                    <span className="capitalize">{selectedRecipe.status}</span>
                  </p>
                  {selectedRecipe.notes ? (
                    <p className="mt-2 text-sm">{selectedRecipe.notes}</p>
                  ) : null}
                </div>
                {canWrite ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => void onToggleStatus(selectedRecipe)}
                    >
                      {selectedRecipe.status === "active"
                        ? "Deactivate"
                        : "Activate"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void onDeleteRecipe(selectedRecipe.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="glass-surface rounded-xl p-4">
                <h3 className="text-sm font-semibold">Ingredient cost</h3>
                {costQuery.isLoading ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Calculating cost…
                  </p>
                ) : costQuery.isError ? (
                  <p className="mt-2 text-sm text-red-600">
                    {(costQuery.error as Error).message}
                  </p>
                ) : recipeCost ? (
                  <div className="mt-3 space-y-2 text-sm">
                    {recipeCost.is_complete ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <p>
                          <span className="text-muted-foreground">
                            Cost per serving:
                          </span>{" "}
                          <span className="font-medium">
                            {formatMinorUnits(
                              recipeCost.cost_per_yield_minor ?? 0,
                              recipeCost.currency,
                            )}
                          </span>
                        </p>
                        {recipeCost.sell_price_minor != null ? (
                          <p>
                            <span className="text-muted-foreground">
                              Sell price:
                            </span>{" "}
                            <span className="font-medium">
                              {formatMinorUnits(
                                recipeCost.sell_price_minor,
                                recipeCost.currency,
                              )}
                            </span>
                          </p>
                        ) : null}
                        {recipeCost.margin_minor != null ? (
                          <p>
                            <span className="text-muted-foreground">
                              Margin:
                            </span>{" "}
                            <span className="font-medium">
                              {formatMinorUnits(
                                recipeCost.margin_minor,
                                recipeCost.currency,
                              )}
                              {recipeCost.margin_percent
                                ? ` (${recipeCost.margin_percent}%)`
                                : ""}
                            </span>
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        Set a unit cost on every ingredient (in{" "}
                        {recipeCost.currency}) from Inventory to see the full
                        recipe cost and margin.
                      </p>
                    )}
                    {recipeCost.lines.length > 0 ? (
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="min-w-full text-left text-xs">
                          <thead className="bg-muted/60 text-muted-foreground">
                            <tr>
                              <th className="px-2 py-1.5 font-medium">
                                Ingredient
                              </th>
                              <th className="px-2 py-1.5 font-medium">
                                Line cost
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {recipeCost.lines.map((line) => (
                              <tr
                                key={line.recipe_item_id}
                                className="border-t border-border"
                              >
                                <td className="px-2 py-1.5">
                                  {line.ingredient_name}
                                </td>
                                <td className="px-2 py-1.5">
                                  {line.line_cost_minor != null &&
                                  line.currency
                                    ? formatMinorUnits(
                                        line.line_cost_minor,
                                        line.currency,
                                      )
                                    : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Ingredients</h3>
                  {canWrite ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowAddIngredient(true)}
                    >
                      Add ingredient
                    </Button>
                  ) : null}
                </div>

                <Dialog
                  open={showAddIngredient && canWrite}
                  onOpenChange={setShowAddIngredient}
                >
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add ingredient</DialogTitle>
                      <DialogDescription>
                        Add a line to the recipe bill of materials.
                      </DialogDescription>
                    </DialogHeader>
                    {selectedRecipe ? (
                      <form
                        onSubmit={addIngredientForm.handleSubmit((values) =>
                          onAddIngredient(selectedRecipe, values),
                        )}
                        className="grid gap-3 sm:grid-cols-[1fr_140px_auto]"
                      >
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">
                            Ingredient
                          </label>
                          <select
                            className={fieldClassName}
                            {...addIngredientForm.register(
                              "ingredient_product_id",
                            )}
                          >
                            <option value="">Select ingredient</option>
                            {ingredientOptions(
                              selectedRecipe.product_id,
                              selectedRecipe.items.map(
                                (item) => item.ingredient_product_id,
                              ),
                            ).map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">
                            Quantity
                          </label>
                          <input
                            inputMode="decimal"
                            className={fieldClassName}
                            {...addIngredientForm.register("quantity")}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button type="submit" size="sm">Add</Button>
                        </div>
                      </form>
                    ) : null}
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={editingItemId != null && canWrite}
                  onOpenChange={(open) => {
                    if (!open) setEditingItemId(null);
                  }}
                >
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Edit quantity</DialogTitle>
                      <DialogDescription>
                        Update the ingredient amount for this recipe line.
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (selectedRecipe && editingItemId) {
                          void onSaveItemQuantity(
                            selectedRecipe.id,
                            editingItemId,
                          );
                        }
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="text-sm font-medium">Quantity</label>
                        <input
                          className={fieldClassName}
                          {...editItemForm.register("quantity")}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">Save</Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingItemId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {selectedRecipe.items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No ingredients on this recipe. Add lines so POS can deduct
                    stock on sale.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-muted/60 text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 font-medium">Ingredient</th>
                          <th className="px-3 py-2 font-medium">Quantity</th>
                          <th className="px-3 py-2 font-medium">Unit</th>
                          {canWrite ? (
                            <th className="px-3 py-2 font-medium">Actions</th>
                          ) : null}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecipe.items.map((item) => (
                          <tr key={item.id} className="border-t border-border">
                            <td className="px-3 py-2 font-medium">
                              {item.ingredient_product.name}
                            </td>
                            <td className="px-3 py-2">{item.quantity}</td>
                            <td className="px-3 py-2">
                              {item.unit.symbol}
                            </td>
                            {canWrite ? (
                              <td className="px-3 py-2">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    className="text-brand-rich-teal hover:underline"
                                    onClick={() => {
                                      setEditingItemId(item.id);
                                      editItemForm.reset({
                                        quantity: item.quantity,
                                      });
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="text-muted-foreground hover:underline"
                                    onClick={() =>
                                      void onDeleteItem(
                                        selectedRecipe.id,
                                        item.id,
                                      )
                                    }
                                  >
                                    Remove
                                  </button>
                                </div>
                              </td>
                            ) : null}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
