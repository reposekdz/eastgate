// East Gate Hotel 2025 Menu - Kinyarwanda Edition
// All menu items with Kinyarwanda as primary language

export interface MenuItemDetail {
  id: string;
  name: string; // Kinyarwanda name (primary)
  nameEn: string; // English translation
  nameFr?: string; // French translation
  category: MenuCategory;
  price: number; // in RWF
  description?: string;
  descriptionEn?: string;
  image: string; // Image URL
  available: boolean;
  popular?: boolean;
  vegetarian?: boolean;
  vegan?: boolean;
  spicy?: boolean;
  glutenFree?: boolean;
  halal?: boolean;
  allergens?: string[];
}

export type MenuCategory =
  | "bitangura-byoshye" // Hot Starters
  | "inyama-yinka" // Beef
  | "inkoko" // Chicken
  | "ifi" // Fish
  | "ibidasanzwe-akabenzi" // Specials - Akabenzi
  | "ibidasanzwe-agatogo" // Specials - Agatogo
  | "pasta"
  | "sandwich"
  | "barbeque"
  | "ibigize-ifunguro" // Accompaniments
  | "ibinywabura" // Desserts
  | "ifunguro-ryo-mu-gitondo" // Breakfast
  | "bifeti" // Buffet
  | "wines"
  | "spirits"
  | "ibinyobwa-byoroshye" // Soft Drinks
  | "ibinyobwa-byoshye" // Hot Beverages
  | "snacks";

export const menuCategories: Array<{
  id: MenuCategory;
  label: string;
  labelEn: string;
  icon: string; // Lucide icon key (mapped via getCategoryIcon)
}> = [
  { id: "bitangura-byoshye", label: "Bitangura Byoshye", labelEn: "Hot Starters", icon: "bitangura-byoshye" },
  { id: "inyama-yinka", label: "Inyama y'Inka", labelEn: "Beef", icon: "inyama-yinka" },
  { id: "inkoko", label: "Inkoko", labelEn: "Chicken", icon: "inkoko" },
  { id: "ifi", label: "Ifi", labelEn: "Fish", icon: "ifi" },
  { id: "ibidasanzwe-akabenzi", label: "Ibidasanzwe - Akabenzi", labelEn: "Specials - Akabenzi", icon: "ibidasanzwe-akabenzi" },
  { id: "ibidasanzwe-agatogo", label: "Ibidasanzwe - Agatogo", labelEn: "Specials - Agatogo", icon: "ibidasanzwe-agatogo" },
  { id: "pasta", label: "Pasta", labelEn: "Pasta", icon: "pasta" },
  { id: "sandwich", label: "Sandwich", labelEn: "Sandwiches", icon: "sandwich" },
  { id: "barbeque", label: "Barbeque", labelEn: "Barbeque", icon: "barbeque" },
  { id: "ibigize-ifunguro", label: "Ibigize Ifunguro", labelEn: "Accompaniments", icon: "ibigize-ifunguro" },
  { id: "ibinywabura", label: "Ibinywabura", labelEn: "Desserts", icon: "ibinywabura" },
  { id: "ifunguro-ryo-mu-gitondo", label: "Ifunguro ryo mu gitondo", labelEn: "Breakfast", icon: "ifunguro-ryo-mu-gitondo" },
  { id: "bifeti", label: "Bifeti", labelEn: "Buffet", icon: "bifeti" },
  { id: "wines", label: "Vino", labelEn: "Wines", icon: "wines" },
  { id: "spirits", label: "Spirits", labelEn: "Spirits", icon: "spirits" },
  { id: "ibinyobwa-byoroshye", label: "Ibinyobwa Byoroshye", labelEn: "Soft Drinks", icon: "ibinyobwa-byoroshye" },
  { id: "ibinyobwa-byoshye", label: "Ibinyobwa Byoshye", labelEn: "Hot Beverages", icon: "ibinyobwa-byoshye" },
  { id: "snacks", label: "Snacks", labelEn: "Snacks", icon: "snacks" },
];

export const fullMenuKiny: MenuItemDetail[] = [
  // ═══════════════════════════════════════════════════════
  // BITANGURA BYOSHYE (HOT STARTERS)
  // ═══════════════════════════════════════════════════════
  {
    id: "hs-001",
    name: "Brochettes z'Inkoko",
    nameEn: "Chicken Skewers",
    nameFr: "Brochettes de Poulet",
    category: "bitangura-byoshye",
    price: 8000,
    description: "Inkoko yokeye kuri gitovu n'ibigize biryo byiza",
    descriptionEn: "Grilled chicken skewers with fresh vegetables",
    image: "https://images.pexels.com/photos/32754748/pexels-photo-32754748.jpeg",
    available: true,
    popular: true,
    halal: true,
  },
  {
    id: "hs-002",
    name: "Brochettes z'Inyama y'Inka",
    nameEn: "Beef Skewers",
    category: "bitangura-byoshye",
    price: 10000,
    description: "Inyama y'inka yokeye kuri gitovu hamwe na sauce nziza",
    descriptionEn: "Grilled beef skewers with special sauce",
    image: "https://images.pexels.com/photos/31126183/pexels-photo-31126183.jpeg",
    available: true,
    popular: true,
  },
  {
    id: "hs-003",
    name: "Sambaza Zokeye",
    nameEn: "Fried Sambaza",
    category: "bitangura-byoshye",
    price: 7000,
    description: "Sambaza zokeye n'isosisi nziza",
    descriptionEn: "Crispy fried sambaza with special sauce",
    image: "https://images.pexels.com/photos/8352785/pexels-photo-8352785.jpeg",
    available: true,
  },

  // ═══════════════════════════════════════════════════════
  // INYAMA Y'INKA (BEEF)
  // ═══════════════════════════════════════════════════════
  {
    id: "bf-001",
    name: "Steak ya Fillet",
    nameEn: "Fillet Steak",
    nameFr: "Steak de Filet",
    category: "inyama-yinka",
    price: 34000,
    description: "Inyama y'inka yokeye hamwe n'ibigize biryo byiza",
    descriptionEn: "Tender grilled fillet with vegetables and sauce",
    image: "https://images.pexels.com/photos/19774527/pexels-photo-19774527.jpeg",
    available: true,
    popular: true,
    glutenFree: true,
  },
  {
    id: "bf-002",
    name: "Steak ya T-Bone",
    nameEn: "T-Bone Steak",
    category: "inyama-yinka",
    price: 36000,
    description: "Steak nini yokeye kuri gitovu n'imyumbati",
    descriptionEn: "Large grilled T-bone steak with potatoes",
    image: "https://images.pexels.com/photos/30350296/pexels-photo-30350296.jpeg",
    available: true,
    glutenFree: true,
  },
  {
    id: "bf-003",
    name: "Beef Stroganoff",
    nameEn: "Beef Stroganoff",
    category: "inyama-yinka",
    price: 28000,
    description: "Inyama y'inka hamwe na sauce y'igitunguru n'umuceri",
    descriptionEn: "Beef in creamy mushroom sauce with rice",
    image: "https://images.pexels.com/photos/27305268/pexels-photo-27305268.jpeg",
    available: true,
  },

  // ═══════════════════════════════════════════════════════
  // INKOKO (CHICKEN)
  // ═══════════════════════════════════════════════════════
  {
    id: "ch-001",
    name: "Inkoko Yokeye Hamwe n'Umuceri",
    nameEn: "Grilled Chicken with Rice",
    nameFr: "Poulet Grillé avec Riz",
    category: "inkoko",
    price: 18000,
    description: "Inkoko yokeye kuri gitovu hamwe n'umuceri n'ibigize biryo",
    descriptionEn: "Grilled chicken breast with steamed rice and vegetables",
    image: "https://images.unsplash.com/photo-1763627719029-d7122ae87e8f",
    available: true,
    popular: true,
    halal: true,
    glutenFree: true,
  },
  {
    id: "ch-002",
    name: "Inkoko Yokeye mu Mafuta",
    nameEn: "Fried Chicken",
    category: "inkoko",
    price: 16000,
    description: "Inkoko yokeye mu mafuta hamwe n'ibishyimbo biturukira America",
    descriptionEn: "Crispy fried chicken with french fries",
    image: "https://images.pexels.com/photos/12916879/pexels-photo-12916879.jpeg",
    available: true,
    halal: true,
  },
  {
    id: "ch-003",
    name: "Chicken Curry",
    nameEn: "Chicken Curry",
    category: "inkoko",
    price: 19000,
    description: "Inkoko mu sauce ya curry n'umuceri",
    descriptionEn: "Spicy chicken curry with rice",
    image: "https://images.pexels.com/photos/6646212/pexels-photo-6646212.jpeg",
    available: true,
    spicy: true,
    halal: true,
  },

  // ═══════════════════════════════════════════════════════
  // IFI (FISH)
  // ═══════════════════════════════════════════════════════
  {
    id: "fs-001",
    name: "Tilapia Yokeye",
    nameEn: "Grilled Tilapia",
    nameFr: "Tilapia Grillé",
    category: "ifi",
    price: 23400,
    description: "Tilapia yavuye mu kivu yokeye hamwe n'ibigize biryo n'umuceri",
    descriptionEn: "Lake Kivu tilapia grilled with vegetables and rice",
    image: "https://images.unsplash.com/photo-1665582038443-7d55b4673c57",
    available: true,
    popular: true,
    glutenFree: true,
  },
  {
    id: "fs-002",
    name: "Ifi ya Nile Perch",
    nameEn: "Nile Perch Fillet",
    category: "ifi",
    price: 26000,
    description: "Nile perch yokeye n'isosisi nziza",
    descriptionEn: "Grilled Nile perch with lemon butter sauce",
    image: "https://images.pexels.com/photos/28446446/pexels-photo-28446446.jpeg",
    available: true,
    glutenFree: true,
  },

  // ═══════════════════════════════════════════════════════
  // IBIDASANZWE - AKABENZI
  // ═══════════════════════════════════════════════════════
  {
    id: "ak-001",
    name: "Akabenzi k'Inkoko",
    nameEn: "Chicken Akabenzi",
    category: "ibidasanzwe-akabenzi",
    price: 17000,
    description: "Inkoko mu sauce nziza hamwe n'imyumbati",
    descriptionEn: "Chicken in special sauce with fried plantains",
    image: "https://images.pexels.com/photos/13915043/pexels-photo-13915043.jpeg",
    available: true,
    popular: true,
    spicy: true,
  },
  {
    id: "ak-002",
    name: "Akabenzi k'Inyama y'Inka",
    nameEn: "Beef Akabenzi",
    category: "ibidasanzwe-akabenzi",
    price: 21000,
    description: "Inyama y'inka mu sauce nziza hamwe n'umuceri",
    descriptionEn: "Beef in special sauce with rice",
    image: "https://images.pexels.com/photos/9546273/pexels-photo-9546273.jpeg",
    available: true,
    spicy: true,
  },

  // ═══════════════════════════════════════════════════════
  // IBIDASANZWE - AGATOGO
  // ═══════════════════════════════════════════════════════
  {
    id: "ag-001",
    name: "Agatogo k'Ibijumba",
    nameEn: "Eggplant Agatogo",
    category: "ibidasanzwe-agatogo",
    price: 12000,
    description: "Ibijumba bikonje mu sauce nziza",
    descriptionEn: "Fresh eggplant in tomato sauce",
    image: "https://images.pexels.com/photos/19141526/pexels-photo-19141526.jpeg",
    available: true,
    vegetarian: true,
    vegan: true,
  },
  {
    id: "ag-002",
    name: "Isombe",
    nameEn: "Isombe",
    category: "ibidasanzwe-agatogo",
    price: 18200,
    description: "Amadodo akonje hamwe n'imyumbati",
    descriptionEn: "Traditional cassava leaves with plantains",
    image: "https://images.pexels.com/photos/22735421/pexels-photo-22735421.jpeg",
    available: true,
    popular: true,
    vegetarian: true,
  },

  // ═══════════════════════════════════════════════════════
  // PASTA
  // ═══════════════════════════════════════════════════════
  {
    id: "ps-001",
    name: "Spaghetti Bolognese",
    nameEn: "Spaghetti Bolognese",
    category: "pasta",
    price: 15000,
    description: "Spaghetti hamwe na sauce y'inyama",
    descriptionEn: "Spaghetti with meat sauce",
    image: "https://images.unsplash.com/photo-1761545832779-bc0b4290fc5e",
    available: true,
    popular: true,
  },
  {
    id: "ps-002",
    name: "Penne Arrabiata",
    nameEn: "Penne Arrabiata",
    category: "pasta",
    price: 14000,
    description: "Penne mu sauce y'inyanya ituruka Italiya",
    descriptionEn: "Penne in spicy tomato sauce",
    image: "https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg",
    available: true,
    spicy: true,
    vegetarian: true,
  },

  // ═══════════════════════════════════════════════════════
  // SANDWICH
  // ═══════════════════════════════════════════════════════
  {
    id: "sw-001",
    name: "Club Sandwich",
    nameEn: "Club Sandwich",
    category: "sandwich",
    price: 12000,
    description: "Sandwich hamwe n'inkoko, bacon, n'ibigize biryo byiza",
    descriptionEn: "Triple-decker with chicken, bacon, and fresh vegetables",
    image: "https://images.pexels.com/photos/28681955/pexels-photo-28681955.jpeg",
    available: true,
    popular: true,
  },
  {
    id: "sw-002",
    name: "Sandwich y'Inyama y'Inka",
    nameEn: "Beef Sandwich",
    category: "sandwich",
    price: 13000,
    description: "Inyama y'inka yokeye hamwe n'imyumbati",
    descriptionEn: "Grilled beef with caramelized onions",
    image: "https://images.pexels.com/photos/5112557/pexels-photo-5112557.jpeg",
    available: true,
  },

  // ═══════════════════════════════════════════════════════
  // BARBEQUE
  // ═══════════════════════════════════════════════════════
  {
    id: "bb-001",
    name: "Brochette Platter",
    nameEn: "Mixed Brochette Platter",
    category: "barbeque",
    price: 28600,
    description: "Brochettes z'inyama zinyuranye zokeye kuri gitovu",
    descriptionEn: "Mixed grilled meat skewers with fries and salad",
    image: "https://images.pexels.com/photos/6419732/pexels-photo-6419732.jpeg",
    available: true,
    popular: true,
  },
  {
    id: "bb-002",
    name: "Nyama Choma",
    nameEn: "Nyama Choma",
    category: "barbeque",
    price: 32500,
    description: "Inyama y'inka yokeye hamwe n'ugali",
    descriptionEn: "Flame-grilled beef with ugali",
    image: "https://images.pexels.com/photos/32973156/pexels-photo-32973156.jpeg",
    available: true,
    glutenFree: true,
  },

  // ═══════════════════════════════════════════════════════
  // IBINYWABURA (DESSERTS)
  // ═══════════════════════════════════════════════════════
  {
    id: "ds-001",
    name: "Keke ya Chocolat Ifite Umuyaga",
    nameEn: "Chocolate Lava Cake",
    nameFr: "Gâteau Fondant au Chocolat",
    category: "ibinywabura",
    price: 13000,
    description: "Keke ya chocolat ishyushye hamwe na ice cream",
    descriptionEn: "Warm chocolate cake with vanilla ice cream",
    image: "https://images.pexels.com/photos/33674415/pexels-photo-33674415.jpeg",
    available: true,
    popular: true,
  },
  {
    id: "ds-002",
    name: "Tiramisu",
    nameEn: "Tiramisu",
    category: "ibinywabura",
    price: 11000,
    description: "Tiramisu y'umwimerere w'Italiya",
    descriptionEn: "Classic Italian tiramisu",
    image: "https://images.pexels.com/photos/31918529/pexels-photo-31918529.jpeg",
    available: true,
  },

  // ═══════════════════════════════════════════════════════
  // IFUNGURO RYO MU GITONDO (BREAKFAST)
  // ═══════════════════════════════════════════════════════
  {
    id: "bk-001",
    name: "Ifunguro ryo mu Gitondo rya Continental",
    nameEn: "Continental Breakfast",
    nameFr: "Petit-déjeuner Continental",
    category: "ifunguro-ryo-mu-gitondo",
    price: 19500,
    description: "Amagi, umugati, imbuto, n'ikawa cyangwa icyayi",
    descriptionEn: "Eggs, toast, fresh fruits, pastries, juice, coffee or tea",
    image: "https://pixabay.com/get/g89f2963b162739f233f7c2e31cf943446d80acd815d86b37efe0caef2988fa2f6e605c5a7778986d78fcb4b49ea68ec1.jpg",
    available: true,
    popular: true,
  },
  {
    id: "bk-002",
    name: "Ifunguro ryo mu Gitondo ryo mu Rwanda",
    nameEn: "Rwandan Breakfast",
    category: "ifunguro-ryo-mu-gitondo",
    price: 15600,
    description: "Ibijumba, ibishyimbo, umuneke, n'amata",
    descriptionEn: "Sweet potatoes, beans, banana, fresh milk",
    image: "https://images.pexels.com/photos/2662875/pexels-photo-2662875.jpeg",
    available: true,
  },

  // ═══════════════════════════════════════════════════════
  // IBINYOBWA BYOROSHYE (SOFT DRINKS)
  // ═══════════════════════════════════════════════════════
  {
    id: "sd-001",
    name: "Umutobe w'Imbuto Mushya",
    nameEn: "Fresh Fruit Juice",
    nameFr: "Jus de Fruits Frais",
    category: "ibinyobwa-byoroshye",
    price: 7800,
    description: "Umutobe wa passion, manga, cyangwa imbuto zivanze",
    descriptionEn: "Passion fruit, mango, or mixed fruit juice",
    image: "https://images.pexels.com/photos/2479242/pexels-photo-2479242.jpeg",
    available: true,
    popular: true,
    vegetarian: true,
  },
  {
    id: "sd-002",
    name: "Coca Cola",
    nameEn: "Coca Cola",
    category: "ibinyobwa-byoroshye",
    price: 3900,
    description: "Coca Cola",
    descriptionEn: "Coca Cola",
    image: "https://images.pexels.com/photos/17146376/pexels-photo-17146376.jpeg",
    available: true,
  },

  // ═══════════════════════════════════════════════════════
  // IBINYOBWA BYOSHYE (HOT BEVERAGES)
  // ═══════════════════════════════════════════════════════
  {
    id: "hb-001",
    name: "Ikawa yo mu Rwanda",
    nameEn: "Rwandan Coffee",
    nameFr: "Café Rwandais",
    category: "ibinyobwa-byoshye",
    price: 6500,
    description: "Ikawa nziza y'umwimerere yo mu Rwanda",
    descriptionEn: "Premium single-origin Rwandan coffee",
    image: "https://images.unsplash.com/photo-1451271772015-90ecf3644e36",
    available: true,
    popular: true,
  },
  {
    id: "hb-002",
    name: "Icyayi c'Ubuki",
    nameEn: "Honey Tea",
    category: "ibinyobwa-byoshye",
    price: 5000,
    description: "Icyayi gifite ubuki n'indimu",
    descriptionEn: "Tea with honey and lemon",
    image: "https://images.pexels.com/photos/12799305/pexels-photo-12799305.jpeg",
    available: true,
  },

  // ═══════════════════════════════════════════════════════
  // WINES
  // ═══════════════════════════════════════════════════════
  {
    id: "wn-001",
    name: "Vino Itukura ya Chilean Cabernet",
    nameEn: "Chilean Cabernet (Red Wine)",
    category: "wines",
    price: 35000,
    description: "Vino itukura nziza ituruka Chile",
    descriptionEn: "Premium Chilean red wine",
    image: "https://images.unsplash.com/photo-1762454016515-f29750071257",
    available: true,
  },
  {
    id: "wn-002",
    name: "Vino Yera ya South African Sauvignon",
    nameEn: "South African Sauvignon (White Wine)",
    category: "wines",
    price: 32000,
    description: "Vino yera nziza ituruka Afurika y'Epfo",
    descriptionEn: "Premium South African white wine",
    image: "https://images.pexels.com/photos/11116806/pexels-photo-11116806.jpeg",
    available: true,
  },
];
