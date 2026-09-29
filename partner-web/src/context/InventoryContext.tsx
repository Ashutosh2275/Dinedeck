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

const DEFAULT_RAW_ITEMS: RawStockItem[] = [
  {
    id: 'inv-1',
    name: 'Fresh Malai Paneer (Vacuum Pack)',
    category: 'Dairy & Cheese',
    currentStock: 4.5, // 4.5 kg
    unit: 'kg',
    minimumThreshold: 8.0,
    costPerUnit: 340.0,
    supplier: 'Amul Dairy Distro (BKC)',
    supplierContact: '+91 98200 11223',
    storageLocation: 'Cold Storage / Walk-in',
    lastRestocked: '2026-08-29',
    priceTrend: 'STABLE'
  },
  {
    id: 'inv-2',
    name: 'Basmati Biryani Rice (Aged Daawat)',
    category: 'Grains & Flour',
    currentStock: 48.0,
    unit: 'kg',
    minimumThreshold: 25.0,
    costPerUnit: 125.0,
    supplier: 'Kohinoor & Daawat Agro',
    supplierContact: '+91 98211 44556',
    storageLocation: 'Dry Pantry Store Rack A1',
    lastRestocked: '2026-08-25',
    priceTrend: 'STABLE'
  },
  {
    id: 'inv-3',
    name: 'Desi Ghee (Pure Cow)',
    category: 'Oils & Fats',
    currentStock: 3.5,
    unit: 'kg',
    minimumThreshold: 8.0,
    costPerUnit: 680.0,
    supplier: 'Verka Heritage Distro',
    supplierContact: '+91 98199 77889',
    storageLocation: 'Dry Pantry Store Rack B2',
    lastRestocked: '2026-08-20',
    priceTrend: 'UP'
  },
  {
    id: 'inv-4',
    name: 'Fresh Heavy Cooking Cream (Amul 36%)',
    category: 'Dairy & Cheese',
    currentStock: 2.5,
    unit: 'L',
    minimumThreshold: 6.0,
    costPerUnit: 220.0,
    supplier: 'Amul Dairy Distro (BKC)',
    supplierContact: '+91 98200 11223',
    storageLocation: 'Cold Storage / Walk-in',
    lastRestocked: '2026-08-28',
    priceTrend: 'STABLE'
  },
  {
    id: 'inv-5',
    name: 'Kashmiri Red Chilli Powder (Stemless)',
    category: 'Spices & Seasonings',
    currentStock: 12.0,
    unit: 'kg',
    minimumThreshold: 4.0,
    costPerUnit: 480.0,
    supplier: 'MDH & Everest Spices Vashi',
    supplierContact: '+91 98333 55667',
    storageLocation: 'Spice Storage Room',
    lastRestocked: '2026-08-18',
    priceTrend: 'STABLE'
  },
  {
    id: 'inv-6',
    name: 'Fresh Boneless Chicken Breast',
    category: 'Meat & Poultry',
    currentStock: 5.5, // 5.5 kg
    unit: 'kg',
    minimumThreshold: 12.0,
    costPerUnit: 280.0,
    supplier: 'Zorabian Fresh Cuts',
    supplierContact: '+91 98444 88990',
    storageLocation: 'Deep Freezer Unit 1',
    lastRestocked: '2026-08-30',
    priceTrend: 'UP'
  },
  {
    id: 'inv-7',
    name: 'Red Onions (Nashik Quality)',
    category: 'Vegetables & Produce',
    currentStock: 65.0,
    unit: 'kg',
    minimumThreshold: 30.0,
    costPerUnit: 35.0,
    supplier: 'APMC Market Vashi Stall 42',
    supplierContact: '+91 98777 22334',
    storageLocation: 'Produce Storage Bin 1',
    lastRestocked: '2026-08-29',
    priceTrend: 'DOWN'
  },
  {
    id: 'inv-8',
    name: 'Amul Salted Table Butter Block',
    category: 'Dairy & Cheese',
    currentStock: 5.0,
    unit: 'kg',
    minimumThreshold: 10.0,
    costPerUnit: 490.0,
    supplier: 'Amul Dairy Distro (BKC)',
    supplierContact: '+91 98200 11223',
    storageLocation: 'Cold Storage / Walk-in',
    lastRestocked: '2026-08-27',
    priceTrend: 'STABLE'
  },
  {
    id: 'inv-9',
    name: 'Hybrid Salad Tomatoes (Firm Red)',
    category: 'Vegetables & Produce',
    currentStock: 18.0,
    unit: 'kg',
    minimumThreshold: 20.0,
    costPerUnit: 42.0,
    supplier: 'APMC Market Vashi Stall 42',
    supplierContact: '+91 98777 22334',
    storageLocation: 'Produce Storage Bin 2',
    lastRestocked: '2026-08-29',
    priceTrend: 'UP'
  },
  {
    id: 'inv-10',
    name: 'Whole Cashews (Kaju Tukda Premium)',
    category: 'Spices & Seasonings',
    currentStock: 8.0,
    unit: 'kg',
    minimumThreshold: 5.0,
    costPerUnit: 780.0,
    supplier: 'MDH & Everest Spices Vashi',
    supplierContact: '+91 98333 55667',
    storageLocation: 'Spice Storage Room',
    lastRestocked: '2026-08-22',
    priceTrend: 'STABLE'
  },
  {
    id: 'inv-11',
    name: 'Fresh Mutton Curry Cut (Tender Goat)',
    category: 'Meat & Poultry',
    currentStock: 3.5,
    unit: 'kg',
    minimumThreshold: 10.0,
    costPerUnit: 720.0,
    supplier: 'Zorabian Fresh Cuts',
    supplierContact: '+91 98444 88990',
    storageLocation: 'Deep Freezer Unit 2',
    lastRestocked: '2026-08-29',
    priceTrend: 'STABLE'
  },
  {
    id: 'inv-12',
    name: 'Takeaway Meal Boxes & Handi Tins (750ml)',
    category: 'Packaging & Disposables',
    currentStock: 180.0,
    unit: 'pcs',
    minimumThreshold: 50.0,
    costPerUnit: 14.0,
    supplier: 'PackPro Solutions Mumbai',
    supplierContact: '+91 98111 66778',
    storageLocation: 'Packaging Storage Rack P1',
    lastRestocked: '2026-08-22',
    priceTrend: 'STABLE'
  }
];

const DEFAULT_RECIPES: DishRecipeBOM[] = [
  {
    dishId: 'dish-1',
    dishName: 'Paneer Butter Masala',
    category: 'Main Course',
    portionCost: 110.0,
    ingredients: [
      { rawItemId: 'inv-1', rawItemName: 'Fresh Malai Paneer', qtyPerPortion: 0.20, unit: 'kg' }, // 200g
      { rawItemId: 'inv-9', rawItemName: 'Hybrid Tomatoes', qtyPerPortion: 0.15, unit: 'kg' },
      { rawItemId: 'inv-8', rawItemName: 'Amul Table Butter', qtyPerPortion: 0.03, unit: 'kg' },
      { rawItemId: 'inv-4', rawItemName: 'Fresh Cream', qtyPerPortion: 0.02, unit: 'L' }
    ]
  },
  {
    dishId: 'dish-2',
    dishName: 'Amritsari Paneer Tikka',
    category: 'Starters',
    portionCost: 120.0,
    ingredients: [
      { rawItemId: 'inv-1', rawItemName: 'Fresh Malai Paneer', qtyPerPortion: 0.25, unit: 'kg' }, // 250g
      { rawItemId: 'inv-7', rawItemName: 'Red Onions', qtyPerPortion: 0.10, unit: 'kg' },
      { rawItemId: 'inv-8', rawItemName: 'Amul Table Butter', qtyPerPortion: 0.02, unit: 'kg' }
    ]
  },
  {
    dishId: 'dish-3',
    dishName: 'Kadhai Paneer',
    category: 'Main Course',
    portionCost: 105.0,
    ingredients: [
      { rawItemId: 'inv-1', rawItemName: 'Fresh Malai Paneer', qtyPerPortion: 0.20, unit: 'kg' },
      { rawItemId: 'inv-7', rawItemName: 'Red Onions', qtyPerPortion: 0.12, unit: 'kg' },
      { rawItemId: 'inv-9', rawItemName: 'Hybrid Tomatoes', qtyPerPortion: 0.10, unit: 'kg' },
      { rawItemId: 'inv-3', rawItemName: 'Desi Ghee', qtyPerPortion: 0.02, unit: 'kg' }
    ]
  },
  {
    dishId: 'dish-4',
    dishName: 'Murgh Makhani (Butter Chicken)',
    category: 'Main Course',
    portionCost: 135.0,
    ingredients: [
      { rawItemId: 'inv-6', rawItemName: 'Fresh Chicken Breast', qtyPerPortion: 0.25, unit: 'kg' }, // 250g
      { rawItemId: 'inv-9', rawItemName: 'Hybrid Tomatoes', qtyPerPortion: 0.15, unit: 'kg' },
      { rawItemId: 'inv-8', rawItemName: 'Amul Table Butter', qtyPerPortion: 0.035, unit: 'kg' },
      { rawItemId: 'inv-4', rawItemName: 'Fresh Cream', qtyPerPortion: 0.025, unit: 'L' },
      { rawItemId: 'inv-10', rawItemName: 'Whole Cashews', qtyPerPortion: 0.015, unit: 'kg' }
    ]
  },
  {
    dishId: 'dish-5',
    dishName: 'Tandoori Chicken Tikka',
    category: 'Starters',
    portionCost: 125.0,
    ingredients: [
      { rawItemId: 'inv-6', rawItemName: 'Fresh Chicken Breast', qtyPerPortion: 0.25, unit: 'kg' },
      { rawItemId: 'inv-7', rawItemName: 'Red Onions', qtyPerPortion: 0.08, unit: 'kg' },
      { rawItemId: 'inv-8', rawItemName: 'Amul Table Butter', qtyPerPortion: 0.02, unit: 'kg' }
    ]
  },
  {
    dishId: 'dish-6',
    dishName: 'Hyderabadi Chicken Dum Biryani',
    category: 'Rice & Biryani',
    portionCost: 140.0,
    ingredients: [
      { rawItemId: 'inv-2', rawItemName: 'Basmati Biryani Rice', qtyPerPortion: 0.20, unit: 'kg' },
      { rawItemId: 'inv-6', rawItemName: 'Fresh Chicken Breast', qtyPerPortion: 0.22, unit: 'kg' },
      { rawItemId: 'inv-3', rawItemName: 'Desi Ghee', qtyPerPortion: 0.025, unit: 'kg' },
      { rawItemId: 'inv-7', rawItemName: 'Red Onions', qtyPerPortion: 0.15, unit: 'kg' }
    ]
  },
  {
    dishId: 'dish-7',
    dishName: 'Dal Makhani',
    category: 'Main Course',
    portionCost: 55.0,
    ingredients: [
      { rawItemId: 'inv-8', rawItemName: 'Amul Table Butter', qtyPerPortion: 0.04, unit: 'kg' },
      { rawItemId: 'inv-4', rawItemName: 'Fresh Cream', qtyPerPortion: 0.03, unit: 'L' },
      { rawItemId: 'inv-9', rawItemName: 'Hybrid Tomatoes', qtyPerPortion: 0.08, unit: 'kg' }
    ]
  },
  {
    dishId: 'dish-8',
    dishName: 'Butter Garlic Naan',
    category: 'Tandoori Breads',
    portionCost: 20.0,
    ingredients: [
      { rawItemId: 'inv-8', rawItemName: 'Amul Table Butter', qtyPerPortion: 0.02, unit: 'kg' }
    ]
  },
  {
    dishId: 'dish-9',
    dishName: 'Mutton Rogan Josh',
    category: 'Main Course',
    portionCost: 195.0,
    ingredients: [
      { rawItemId: 'inv-11', rawItemName: 'Fresh Mutton Curry Cut', qtyPerPortion: 0.25, unit: 'kg' },
      { rawItemId: 'inv-7', rawItemName: 'Red Onions', qtyPerPortion: 0.15, unit: 'kg' },
      { rawItemId: 'inv-3', rawItemName: 'Desi Ghee', qtyPerPortion: 0.03, unit: 'kg' }
    ]
  }
];

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

  const [recipes] = useState<DishRecipeBOM[]>(DEFAULT_RECIPES);

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

      const finalPortions = minPortions === Infinity ? 50 : Math.max(0, minPortions);
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
      portionsLeft: 25,
      status: 'ABUNDANT',
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      recommendationMessage: 'Sufficient ingredients available.'
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
