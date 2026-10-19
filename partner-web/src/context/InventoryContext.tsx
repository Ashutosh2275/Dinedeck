import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

export interface RawStockItem {
  id: string;
  name: string;
  category: string;
  currentStock: number; // in kg, L, pcs
  unit: string;
  minimumThreshold: number;
  costPerUnit: number;
  supplier: string;
  supplierContact?: string;
  storageLocation: string;
  lastRestocked: string;
  priceTrend?: 'UP' | 'DOWN' | 'STABLE';
}

export interface DishIngredientRequirement {
  rawItemId: string;
  rawItemName: string;
  qtyPerPortion: number; // in unit (e.g. 0.25 kg)
  unit: string;
}

export interface DishRecipeBOM {
  dishId: string;
  dishName: string;
  category: string;
  portionCost: number;
  ingredients: DishIngredientRequirement[];
}

export interface DishStockCapacity {
  dishName: string;
  category: string;
  portionsLeft: number;
  limitingIngredient?: {
    name: string;
    currentStock: number;
    unit: string;
    qtyPerPortion: number;
  };
  status: 'ABUNDANT' | 'NEAR_OUT_OF_STOCK' | 'CRITICAL' | 'OUT_OF_STOCK';
  badgeColor: string;
  recommendationMessage: string;
}

interface InventoryContextType {
  rawItems: RawStockItem[];
  recipes: DishRecipeBOM[];
  capacities: Record<string, DishStockCapacity>;
  getDishCapacity: (dishName: string) => DishStockCapacity;
  deductIngredientsForOrder: (orderedItems: Array<{ name: string; quantity: number }>) => void;
  updateRawStock: (itemId: string, newStock: number) => void;
  addRawInward: (itemId: string, qty: number, rate?: number) => void;
  logRawWastage: (itemId: string, qty: number) => void;
  nearOutOfStockDishes: DishStockCapacity[];
}

const DEFAULT_RAW_ITEMS: RawStockItem[] = [];

const DEFAULT_RECIPES: DishRecipeBOM[] = [];

const InventoryContext = createContext<InventoryContextType | null>(null);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawItems, setRawItems] = useState<RawStockItem[]>(() => {
    try {
      const saved = localStorage.getItem('dinedeck_raw_inventory');
      return saved ? JSON.parse(saved) : DEFAULT_RAW_ITEMS;
    } catch {
      return DEFAULT_RAW_ITEMS;
    }
  });

  const [recipes] = useState<DishRecipeBOM[]>(() => {
    try {
      const saved = localStorage.getItem('dinedeck_dish_recipes');
      return saved ? JSON.parse(saved) : DEFAULT_RECIPES;
    } catch {
      return DEFAULT_RECIPES;
    }
  });

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('dinedeck_raw_inventory', JSON.stringify(rawItems));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [rawItems]);

  // Compute live portion capacities for every recipe dish
  const capacities = useMemo(() => {
    const caps: Record<string, DishStockCapacity> = {};

    recipes.forEach((rec) => {
      let minPortions = Infinity;
      let limiting:
        | {
            name: string;
            currentStock: number;
            unit: string;
            qtyPerPortion: number;
          }
        | undefined = undefined;

      rec.ingredients.forEach((ing) => {
        const raw = rawItems.find((r) => r.id === ing.rawItemId || r.name.toLowerCase().includes(ing.rawItemName.toLowerCase()));
        if (!raw) return;

        const maxPortionsForThisIng = Math.floor(raw.currentStock / ing.qtyPerPortion);
        if (maxPortionsForThisIng < minPortions) {
          minPortions = maxPortionsForThisIng;
          limiting = {
            name: raw.name,
            currentStock: raw.currentStock,
            unit: raw.unit,
            qtyPerPortion: ing.qtyPerPortion
          };
        }
      });

      const finalPortions = minPortions === Infinity ? 0 : Math.max(0, minPortions);
      const limitingObj: any = limiting;
      const limitingName = limitingObj?.name || 'ingredient';
      const limitingStock = limitingObj?.currentStock != null ? limitingObj.currentStock.toFixed(1) : '0.0';
      const limitingUnit = limitingObj?.unit || 'kg';

      let status: DishStockCapacity['status'] = 'ABUNDANT';
      let badgeColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      let recommendationMessage = `Sufficient stock (~${finalPortions} portions available). Can accept multiple large orders.`;

      if (finalPortions === 0) {
        status = 'OUT_OF_STOCK';
        badgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
        recommendationMessage = `Out of raw material (${limitingName} is depleted: 0 ${limitingUnit}). Immediate restock needed.`;
      } else if (finalPortions <= 2) {
        status = 'CRITICAL';
        badgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
        recommendationMessage = `🚨 Critical Low Stock: Only ~${finalPortions} portion(s) left due to remaining ${limitingName} (${limitingStock} ${limitingUnit}). Multi-plate orders will cause immediate stockout!`;
      } else if (finalPortions <= 7) {
        status = 'NEAR_OUT_OF_STOCK';
        badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
        recommendationMessage = `⚠️ Near Out of Stock: ~${finalPortions} portions remaining based on current ${limitingName} (${limitingStock} ${limitingUnit}). Recommend alerting waitstaff or preparing restock.`;
      }

      caps[rec.dishName.toLowerCase()] = {
        dishName: rec.dishName,
        category: rec.category,
        portionsLeft: finalPortions,
        limitingIngredient: limiting,
        status,
        badgeColor,
        recommendationMessage
      };
    });

    return caps;
  }, [rawItems, recipes]);

  const getDishCapacity = useCallback((dishName: string): DishStockCapacity => {
    const key = dishName.toLowerCase();
    // Direct or substring match
    if (capacities[key]) return capacities[key];
    const match = Object.values(capacities).find(c => key.includes(c.dishName.toLowerCase()) || c.dishName.toLowerCase().includes(key));
    if (match) return match;

    return {
      dishName,
      category: 'General',
      portionsLeft: 50,
      status: 'ABUNDANT',
      badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      recommendationMessage: 'Standard menu item availability.'
    };
  }, [capacities]);

  const nearOutOfStockDishes = useMemo(() => {
    return Object.values(capacities).filter((c) => c.status === 'NEAR_OUT_OF_STOCK' || c.status === 'CRITICAL');
  }, [capacities]);

  // Deduct raw ingredients when an order is placed
  const deductIngredientsForOrder = useCallback((orderedItems: Array<{ name: string; quantity: number }>) => {
    setRawItems((prev) => {
      let updated = [...prev];

      orderedItems.forEach((orderItem) => {
        const dishMatch = recipes.find(
          (r) =>
            r.dishName.toLowerCase() === orderItem.name.toLowerCase() ||
            orderItem.name.toLowerCase().includes(r.dishName.toLowerCase()) ||
            r.dishName.toLowerCase().includes(orderItem.name.toLowerCase())
        );

        if (!dishMatch) return;

        dishMatch.ingredients.forEach((ing) => {
          const totalDeduct = ing.qtyPerPortion * (orderItem.quantity || 1);
          updated = updated.map((raw) => {
            if (raw.id === ing.rawItemId || raw.name.toLowerCase().includes(ing.rawItemName.toLowerCase())) {
              const newBalance = Math.max(0, raw.currentStock - totalDeduct);
              return { ...raw, currentStock: newBalance };
            }
            return raw;
          });
        });
      });

      return updated;
    });
  }, [recipes]);

  const updateRawStock = useCallback((itemId: string, newStock: number) => {
    setRawItems((prev) =>
      prev.map((r) => (r.id === itemId ? { ...r, currentStock: Math.max(0, newStock) } : r))
    );
  }, []);

  const addRawInward = useCallback((itemId: string, qty: number, rate?: number) => {
    setRawItems((prev) =>
      prev.map((r) =>
        r.id === itemId
          ? {
              ...r,
              currentStock: r.currentStock + qty,
              costPerUnit: rate || r.costPerUnit,
              lastRestocked: new Date().toISOString().split('T')[0]
            }
          : r
      )
    );
  }, []);

  const logRawWastage = useCallback((itemId: string, qty: number) => {
    setRawItems((prev) =>
      prev.map((r) =>
        r.id === itemId ? { ...r, currentStock: Math.max(0, r.currentStock - qty) } : r
      )
    );
  }, []);

  return (
    <InventoryContext.Provider
      value={{
        rawItems,
        recipes,
        capacities,
        getDishCapacity,
        deductIngredientsForOrder,
        updateRawStock,
        addRawInward,
        logRawWastage,
        nearOutOfStockDishes
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const ctx = useContext(InventoryContext);
  if (!ctx) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return ctx;
};
