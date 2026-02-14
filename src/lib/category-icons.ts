// Category Icon Mapping - Maps menu category IDs to Lucide icon names
// Used across menu pages, dialogs, and order components

import {
  Soup,
  Salad,
  Beef,
  Drumstick,
  Fish,
  Star,
  ChefHat,
  Sandwich,
  Flame,
  CookingPot,
  Utensils,
  Cake,
  IceCreamCone,
  Pizza,
  EggFried,
  UtensilsCrossed,
  Coffee,
  GlassWater,
  Beer,
  Wine,
  Martini,
  Cookie,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

// Maps category IDs to Lucide icon components
export const categoryIconMap: Record<string, LucideIcon> = {
  // menu-data.ts categories
  hot_starters: Soup,
  cold_starters: Salad,
  beef: Beef,
  chicken: Drumstick,
  fish: Fish,
  specials: Star,
  pasta: Utensils,
  sandwiches: Sandwich,
  barbeque: Flame,
  accompaniment: CookingPot,
  light_meals: UtensilsCrossed,
  desserts: Cake,
  sides: CookingPot,
  sizzling: Flame,
  pizza: Pizza,
  breakfast: EggFried,
  buffet: UtensilsCrossed,
  hot_beverages: Coffee,
  soft_drinks: GlassWater,
  beers: Beer,
  wines: Wine,
  spirits: Martini,
  snacks: Cookie,
  sweets: IceCreamCone,

  // menu-data-kiny.ts categories
  "bitangura-byoshye": Soup,
  "inyama-yinka": Beef,
  inkoko: Drumstick,
  ifi: Fish,
  "ibidasanzwe-akabenzi": Star,
  "ibidasanzwe-agatogo": Sparkles,
  pasta_kiny: Utensils,
  sandwich: Sandwich,
  "ibigize-ifunguro": CookingPot,
  ibinywabura: Cake,
  "ifunguro-ryo-mu-gitondo": EggFried,
  bifeti: UtensilsCrossed,
  "ibinyobwa-byoroshye": GlassWater,
  "ibinyobwa-byoshye": Coffee,

  // menu-data-enhanced.ts categories
  bitangura: Soup,
  "inyama-yinka_e": Beef,
  inkoko_e: Drumstick,
  ifi_e: Fish,
  ibidasanzwe: Star,
  bbq: Flame,
  ibigize: CookingPot,
  "ifunguro-gitondo": EggFried,

  // Common fallback
  all: UtensilsCrossed,
};

/**
 * Get the Lucide icon component for a given category ID.
 * Falls back to UtensilsCrossed if not found.
 */
export function getCategoryIcon(categoryId: string): LucideIcon {
  return categoryIconMap[categoryId] || UtensilsCrossed;
}
