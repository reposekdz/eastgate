import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🍽️  Seeding menu items for all branches...\n");

  const branches = await prisma.branch.findMany();

  const menuData = [
    // Breakfast
    { name: "Continental Breakfast", nameFr: "Petit-déjeuner continental", category: "Breakfast", basePrice: 25000, description: "Fresh fruits, croissants, coffee", vegetarian: true, popular: true, prepTime: 15, calories: 450 },
    { name: "Full English Breakfast", nameFr: "Petit-déjeuner anglais complet", category: "Breakfast", basePrice: 35000, description: "Eggs, bacon, sausage, beans, toast", popular: true, prepTime: 20, calories: 680 },
    { name: "Pancakes & Maple Syrup", nameFr: "Crêpes au sirop d'érable", category: "Breakfast", basePrice: 22000, description: "Fluffy pancakes with maple syrup", vegetarian: true, prepTime: 15, calories: 520 },
    { name: "Avocado Toast", nameFr: "Toast à l'avocat", category: "Breakfast", basePrice: 18000, description: "Sourdough with avocado and poached eggs", vegetarian: true, popular: true, prepTime: 10, calories: 380 },
    { name: "Omelette", nameFr: "Omelette", category: "Breakfast", basePrice: 20000, description: "Three-egg omelette with choice of fillings", vegetarian: true, prepTime: 12, calories: 320 },

    // Main Courses
    { name: "Grilled Tilapia", nameFr: "Tilapia grillé", category: "Main Course", basePrice: 45000, description: "Fresh tilapia with vegetables and rice", popular: true, prepTime: 25, calories: 420 },
    { name: "Chicken BBQ", nameFr: "Poulet BBQ", category: "Main Course", basePrice: 38000, description: "Grilled chicken with BBQ sauce and fries", popular: true, prepTime: 30, calories: 580 },
    { name: "Beef Steak", nameFr: "Steak de bœuf", category: "Main Course", basePrice: 55000, description: "Premium beef steak with mashed potatoes", popular: true, prepTime: 35, calories: 720 },
    { name: "Vegetable Stir Fry", nameFr: "Sauté de légumes", category: "Main Course", basePrice: 28000, description: "Fresh vegetables in soy sauce with rice", vegetarian: true, prepTime: 20, calories: 340 },
    { name: "Pasta Carbonara", nameFr: "Pâtes Carbonara", category: "Main Course", basePrice: 32000, description: "Creamy pasta with bacon and parmesan", prepTime: 25, calories: 620 },
    { name: "Rwanda Goat Stew", nameFr: "Ragoût de chèvre rwandais", category: "Main Course", basePrice: 40000, description: "Traditional Rwandan goat stew", popular: true, spicy: true, prepTime: 45, calories: 540 },
    { name: "Fish & Chips", nameFr: "Poisson et frites", category: "Main Course", basePrice: 35000, description: "Crispy fried fish with chunky chips", prepTime: 25, calories: 680 },
    { name: "Lamb Chops", nameFr: "Côtelettes d'agneau", category: "Main Course", basePrice: 52000, description: "Grilled lamb chops with mint sauce", prepTime: 30, calories: 640 },
    { name: "Chicken Curry", nameFr: "Curry de poulet", category: "Main Course", basePrice: 36000, description: "Spicy chicken curry with rice", spicy: true, popular: true, prepTime: 35, calories: 520 },

    // Appetizers
    { name: "Spring Rolls", nameFr: "Rouleaux de printemps", category: "Appetizers", basePrice: 15000, description: "Crispy vegetable spring rolls", vegetarian: true, prepTime: 10, calories: 220 },
    { name: "Chicken Wings", nameFr: "Ailes de poulet", category: "Appetizers", basePrice: 18000, description: "Spicy buffalo wings", spicy: true, popular: true, prepTime: 20, calories: 380 },
    { name: "Samosas", nameFr: "Samosas", category: "Appetizers", basePrice: 12000, description: "Beef or vegetable samosas", prepTime: 15, calories: 240 },
    { name: "Garlic Bread", nameFr: "Pain à l'ail", category: "Appetizers", basePrice: 10000, description: "Toasted bread with garlic butter", vegetarian: true, prepTime: 8, calories: 180 },

    // Desserts
    { name: "Chocolate Cake", nameFr: "Gâteau au chocolat", category: "Desserts", basePrice: 12000, description: "Rich chocolate cake with ganache", vegetarian: true, popular: true, prepTime: 5, calories: 420 },
    { name: "Ice Cream", nameFr: "Crème glacée", category: "Desserts", basePrice: 8000, description: "Vanilla, chocolate, or strawberry", vegetarian: true, prepTime: 2, calories: 220 },
    { name: "Fruit Salad", nameFr: "Salade de fruits", category: "Desserts", basePrice: 10000, description: "Fresh seasonal fruits", vegetarian: true, prepTime: 5, calories: 120 },
    { name: "Cheesecake", nameFr: "Gâteau au fromage", category: "Desserts", basePrice: 15000, description: "Creamy cheesecake with berry sauce", vegetarian: true, popular: true, prepTime: 5, calories: 380 },
    { name: "Tiramisu", nameFr: "Tiramisu", category: "Desserts", basePrice: 14000, description: "Classic Italian dessert", vegetarian: true, prepTime: 5, calories: 340 },

    // Drinks - Hot Beverages
    { name: "Coffee", nameFr: "Café", category: "Hot Beverages", basePrice: 5000, description: "Black coffee or with milk", vegetarian: true, popular: true, prepTime: 5, calories: 5 },
    { name: "Tea", nameFr: "Thé", category: "Hot Beverages", basePrice: 4000, description: "Black tea, green tea, or herbal", vegetarian: true, prepTime: 5, calories: 2 },
    { name: "Hot Chocolate", nameFr: "Chocolat chaud", category: "Hot Beverages", basePrice: 6000, description: "Rich hot chocolate with cream", vegetarian: true, prepTime: 8, calories: 280 },
    { name: "Cappuccino", nameFr: "Cappuccino", category: "Hot Beverages", basePrice: 7000, description: "Espresso with steamed milk foam", vegetarian: true, popular: true, prepTime: 6, calories: 120 },
    { name: "Latte", nameFr: "Latte", category: "Hot Beverages", basePrice: 7500, description: "Espresso with steamed milk", vegetarian: true, prepTime: 6, calories: 150 },

    // Drinks - Soft Drinks
    { name: "Soda", nameFr: "Soda", category: "Soft Drinks", basePrice: 3500, description: "Coca Cola, Fanta, Sprite", vegetarian: true, prepTime: 1, calories: 140 },
    { name: "Water", nameFr: "Eau", category: "Soft Drinks", basePrice: 2000, description: "Bottled water 500ml", vegetarian: true, popular: true, prepTime: 1, calories: 0 },
    { name: "Fresh Juice", nameFr: "Jus frais", category: "Soft Drinks", basePrice: 8000, description: "Orange, mango, or pineapple juice", vegetarian: true, prepTime: 5, calories: 110 },
    { name: "Fresh Smoothie", nameFr: "Smoothie frais", category: "Soft Drinks", basePrice: 12000, description: "Mixed fruit smoothie", vegetarian: true, prepTime: 8, calories: 180 },
    { name: "Iced Tea", nameFr: "Thé glacé", category: "Soft Drinks", basePrice: 5000, description: "Refreshing iced tea", vegetarian: true, prepTime: 3, calories: 90 },

    // Drinks - Alcoholic
    { name: "Local Beer", nameFr: "Bière locale", category: "Beers", basePrice: 6000, description: "Primus or Mutzig", popular: true, prepTime: 2, calories: 150 },
    { name: "Imported Beer", nameFr: "Bière importée", category: "Beers", basePrice: 8000, description: "Heineken, Corona, etc.", prepTime: 2, calories: 150 },
    { name: "Wine (Glass)", nameFr: "Vin (verre)", category: "Wines", basePrice: 15000, description: "Red or white wine by the glass", prepTime: 2, calories: 120 },
    { name: "Wine (Bottle)", nameFr: "Vin (bouteille)", category: "Wines", basePrice: 60000, description: "Red or white wine bottle", prepTime: 2, calories: 600 },
    { name: "Cocktail", nameFr: "Cocktail", category: "Spirits", basePrice: 18000, description: "House special cocktails", popular: true, prepTime: 8, calories: 200 },

    // Pizza
    { name: "Margherita Pizza", nameFr: "Pizza Margherita", category: "Pizza", basePrice: 30000, description: "Classic tomato and mozzarella", vegetarian: true, popular: true, prepTime: 20, calories: 680 },
    { name: "Pepperoni Pizza", nameFr: "Pizza Pepperoni", category: "Pizza", basePrice: 35000, description: "Pepperoni and cheese", popular: true, prepTime: 20, calories: 740 },
    { name: "Vegetarian Pizza", nameFr: "Pizza végétarienne", category: "Pizza", basePrice: 32000, description: "Mixed vegetables and cheese", vegetarian: true, prepTime: 20, calories: 620 },
    { name: "BBQ Chicken Pizza", nameFr: "Pizza poulet BBQ", category: "Pizza", basePrice: 38000, description: "BBQ chicken and onions", prepTime: 22, calories: 720 },

    // Sandwiches
    { name: "Club Sandwich", nameFr: "Sandwich club", category: "Sandwiches", basePrice: 22000, description: "Triple-decker with chicken, bacon, lettuce", prepTime: 12, calories: 520 },
    { name: "Burger", nameFr: "Hamburger", category: "Sandwiches", basePrice: 28000, description: "Beef burger with fries", popular: true, prepTime: 18, calories: 680 },
    { name: "Veggie Burger", nameFr: "Burger végétarien", category: "Sandwiches", basePrice: 25000, description: "Plant-based burger with fries", vegetarian: true, prepTime: 18, calories: 540 },
    { name: "Chicken Sandwich", nameFr: "Sandwich au poulet", category: "Sandwiches", basePrice: 24000, description: "Grilled chicken sandwich", prepTime: 15, calories: 480 },
  ];

  let totalCreated = 0;

  for (const branch of branches) {
    console.log(`\n📍 Seeding menu for ${branch.name}...`);
    
    // Price multiplier based on branch
    const priceMultiplier = 
      branch.id === "kigali-main" ? 1.0 :
      branch.id === "ngoma-branch" ? 0.9 :
      branch.id === "kirehe-branch" ? 0.85 :
      0.88; // gatsibo

    for (const item of menuData) {
      const price = Math.round(item.basePrice * priceMultiplier);
      const slug = `${item.name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "")}-${branch.id}`;

      const existing = await prisma.menuItem.findFirst({
        where: { slug, branchId: branch.id },
      });

      if (existing) {
        await prisma.menuItem.update({
          where: { id: existing.id },
          data: { price, available: true },
        });
      } else {
        await prisma.menuItem.create({
          data: {
            name: item.name,
            nameFr: item.nameFr,
            slug,
            category: item.category,
            price,
            description: item.description,
            imageUrl: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400",
            available: true,
            popular: item.popular || false,
            featured: false,
            vegetarian: item.vegetarian || false,
            vegan: false,
            spicy: item.spicy || false,
            glutenFree: false,
            prepTime: item.prepTime,
            calories: item.calories,
            branchId: branch.id,
          },
        });
      }
      totalCreated++;
    }

    console.log(`✅ Created ${menuData.length} items for ${branch.name} (${priceMultiplier}x pricing)`);
  }

  console.log(`\n🎉 Total menu items created: ${totalCreated}`);
  console.log(`📊 ${menuData.length} items × ${branches.length} branches = ${totalCreated} total items`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
