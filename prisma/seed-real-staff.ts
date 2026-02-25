import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Branch IDs
const BRANCHES = {
  KIGALI_MAIN: "br-kigali-main",
  NGOMA: "br-ngoma",
  KIREHE: "br-kirehe",
  GATSIBO: "br-gatsibo",
};

// Default password for admin accounts
const DEFAULT_PASSWORD = "EastGate@2026";

async function main() {
  try {
    console.log("🌱 Starting EastGate Hotel System seeding...\n");

    // Hash the default password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    // ================================
    // 1. CLEAN EXISTING DATA
    // ================================
    console.log("🧹 Cleaning existing data...");
    await prisma.staff.deleteMany({});
    await prisma.room.deleteMany({});
    await prisma.menuItem.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.expense.deleteMany({});
    console.log("  ✓ All data cleaned");

    // ================================
    // 2. CREATE BRANCHES
    // ================================
    console.log("\n📍 Creating branches...");
    const branches = [
      {
        id: BRANCHES.KIGALI_MAIN,
        name: "EastGate Kigali Main",
        slug: "eastgate-kigali-main",
        location: "Kigali",
        city: "Kigali",
        address: "KN 3 Avenue, Nyarugenge District, Kigali",
        phone: "+250 788 123 001",
        email: "kigali@eastgate.rw",
        isActive: true,
      },
      {
        id: BRANCHES.NGOMA,
        name: "EastGate Ngoma Resort",
        slug: "eastgate-ngoma-resort",
        location: "Ngoma",
        city: "Ngoma",
        address: "Ngoma Lake District, Eastern Province",
        phone: "+250 788 123 002",
        email: "ngoma@eastgate.rw",
        isActive: true,
      },
      {
        id: BRANCHES.KIREHE,
        name: "EastGate Kirehe Boutique",
        slug: "eastgate-kirehe-boutique",
        location: "Kirehe",
        city: "Kirehe",
        address: "Kirehe Commercial Hub, Eastern Province",
        phone: "+250 788 123 003",
        email: "kirehe@eastgate.rw",
        isActive: true,
      },
      {
        id: BRANCHES.GATSIBO,
        name: "EastGate Gatsibo Summit",
        slug: "eastgate-gatsibo-summit",
        location: "Gatsibo",
        city: "Gatsibo",
        address: "Gatsibo Business District, Eastern Province",
        phone: "+250 788 123 004",
        email: "gatsibo@eastgate.rw",
        isActive: true,
      },
    ];

    for (const branch of branches) {
      await prisma.branch.upsert({
        where: { id: branch.id },
        update: branch,
        create: branch,
      });
      console.log(`  ✓ ${branch.name}`);
    }

    // ================================
    // 3. CREATE SUPER ADMIN (System Owner)
    // ================================
    console.log("\n👑 Creating SUPER_ADMIN account...");
    await prisma.staff.create({
      data: {
        name: "System Administrator",
        email: "admin@eastgate.com",
        password: hashedPassword,
        phone: "+250 788 100 001",
        role: "SUPER_ADMIN",
        department: "Administration",
        status: "active",
        branchId: BRANCHES.KIGALI_MAIN,
      },
    });
    console.log(`  ✓ SUPER_ADMIN: admin@eastgate.com`);

    // ================================
    // 4. CREATE SUPER MANAGER (Operations)
    // ================================
    console.log("\n📊 Creating SUPER_MANAGER account...");
    await prisma.staff.create({
      data: {
        name: "Operations Manager",
        email: "manager@eastgate.com",
        password: hashedPassword,
        phone: "+250 788 100 002",
        role: "SUPER_MANAGER",
        department: "Operations",
        status: "active",
        branchId: BRANCHES.KIGALI_MAIN,
      },
    });
    console.log(`  ✓ SUPER_MANAGER: manager@eastgate.com`);

    // ================================
    // 5. CREATE SAMPLE ROOMS
    // ================================
    console.log("\n🛏️  Creating sample rooms...");
    
    const roomConfigs = [
      { type: "standard", price: 150000, count: 4 },
      { type: "deluxe", price: 250000, count: 3 },
      { type: "suite", price: 450000, count: 2 },
    ];

    for (const branch of branches) {
      let roomNum = 0;
      for (const config of roomConfigs) {
        for (let i = 0; i < config.count; i++) {
          roomNum++;
          const floor = Math.max(1, Math.floor((roomNum - 1) / 5) + 1);
          const roomOnFloor = ((roomNum - 1) % 5) + 1;
          const number = `${floor}${String.fromCharCode(64 + i + 1)}${roomOnFloor}`;
          const roomId = `${branch.id}-${config.type}-${i}`;

          await prisma.room.create({
            data: {
              id: roomId,
              number,
              floor,
              type: config.type,
              price: config.price,
              status: "available",
              branchId: branch.id,
              maxOccupancy: config.type === "standard" ? 2 : config.type === "deluxe" ? 3 : 4,
              bedType: config.type === "suite" ? "2 King Beds" : "1 King Bed",
              size: config.type === "standard" ? 28 : config.type === "deluxe" ? 38 : 65,
            },
          });
        }
        console.log(`  ✓ ${branch.name}: ${config.count} ${config.type} rooms`);
      }
    }

    // ================================
    // 6. CREATE SAMPLE MENU ITEMS
    // ================================
    console.log("\n🍽️  Creating sample menu items...");
    
    const menuItems = [
      { name: "Traditional Rwandan Breakfast", category: "Breakfast", price: 18000, description: "Ugali with fresh fruits" },
      { name: "Continental Breakfast", category: "Breakfast", price: 28000, description: "Pastries, cheese, ham" },
      { name: "Grilled Tilapia", category: "Lunch", price: 45000, description: "Fresh lake fish" },
      { name: "Beef Ribeye Steak", category: "Lunch", price: 58000, description: "Premium aged beef" },
      { name: "Filet Mignon", category: "Dinner", price: 85000, description: "Premium cut with sauce" },
      { name: "Fresh Orange Juice", category: "Drinks", price: 12000, description: "Freshly squeezed" },
      { name: "Rwandan Coffee", category: "Drinks", price: 8000, description: "Premium local coffee" },
      { name: "Chocolate Cake", category: "Dessert", price: 15000, description: "Rich chocolate" },
    ];

    for (const item of menuItems) {
      const slug = item.name.toLowerCase().replace(/\s+/g, "-");
      await prisma.menuItem.create({
        data: {
          name: item.name,
          slug,
          category: item.category,
          price: item.price,
          description: item.description,
          branchId: BRANCHES.KIGALI_MAIN,
          available: true,
        },
      });
    }
    console.log(`  ✓ Created ${menuItems.length} menu items`);

    // ================================
    // SUMMARY
    // ================================
    console.log("\n✅ Seeding completed successfully!\n");
    console.log("📋 DEFAULT LOGIN CREDENTIALS:");
    console.log("  ┌─────────────────┬─────────────────────────┬───────────────┐");
    console.log("  │ Role            │ Email                   │ Password      │");
    console.log("  ├─────────────────┼─────────────────────────┼───────────────┤");
    console.log("  │ SUPER_ADMIN     │ admin@eastgate.com      │ EastGate@2026 │");
    console.log("  │ SUPER_MANAGER   │ manager@eastgate.com    │ EastGate@2026 │");
    console.log("  └─────────────────┴─────────────────────────┴───────────────┘");
    console.log("\n📊 SYSTEM SUMMARY:");
    console.log(`  • Branches: ${branches.length} (Kigali, Ngoma, Kirehe, Gatsibo)`);
    console.log(`  • Rooms: ${roomConfigs.reduce((a, b) => a + (b.count * branches.length), 0)} total`);
    console.log(`  • Menu Items: ${menuItems.length}`);
    console.log("\n🎯 HOW TO USE:");
    console.log("  1. Login as SUPER_ADMIN (admin@eastgate.com)");
    console.log("  2. Go to Admin Panel → Staff Management");
    console.log("  3. Create BRANCH_MANAGERS for each branch");
    console.log("  4. Branch Managers can then create their staff");
    console.log("  5. All staff roles are managed through the admin panel\n");
    
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error("❌ Fatal error:", e);
    process.exit(1);
  });
