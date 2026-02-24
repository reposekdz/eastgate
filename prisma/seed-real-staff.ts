import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Real branch IDs
const BRANCHES = {
  KIGALI_MAIN: "br-kigali-main",
  NGOMA: "br-ngoma",
  KIREHE: "br-kirehe",
  GATSIBO: "br-gatsibo",
};

// Default password for all staff - "2026"
const DEFAULT_PASSWORD = "2026";

async function main() {
  console.log("🌱 Seeding real staff for EastGate Hotel...");

  // Hash the default password
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  // Create branches first
  const branches = [
    {
      id: BRANCHES.KIGALI_MAIN,
      name: "EastGate Kigali Main",
      location: "Kigali",
      address: "KN 3 Avenue, Kigali, Rwanda",
      phone: "+250 788 123 001",
      email: "kigali@eastgate.com",
      isActive: true,
    },
    {
      id: BRANCHES.NGOMA,
      name: "EastGate Ngoma",
      location: "Ngoma",
      address: "Ngoma District, Eastern Province, Rwanda",
      phone: "+250 788 123 002",
      email: "ngoma@eastgate.com",
      isActive: true,
    },
    {
      id: BRANCHES.KIREHE,
      name: "EastGate Kirehe",
      location: "Kirehe",
      address: "Kirehe District, Eastern Province, Rwanda",
      phone: "+250 788 123 003",
      email: "kirehe@eastgate.com",
      isActive: true,
    },
    {
      id: BRANCHES.GATSIBO,
      name: "EastGate Gatsibo",
      location: "Gatsibo",
      address: "Gatsibo District, Eastern Province, Rwanda",
      phone: "+250 788 123 004",
      email: "gatsibo@eastgate.com",
      isActive: true,
    },
  ];

  // Create branches
  for (const branch of branches) {
    await prisma.branches.upsert({
      where: { id: branch.id },
      update: branch,
      create: branch,
    });
    console.log(`✓ Created branch: ${branch.name}`);
  }

  // Create SUPER ADMIN
  const superAdmin = await prisma.staff.upsert({
    where: { email: "admin@eastgates.com" },
    update: {
      name: "Super Admin",
      password: hashedPassword,
      phone: "+250 788 100 001",
      role: "SUPER_ADMIN",
      department: "Administration",
      status: "active",
      branchId: "",
    },
    create: {
      name: "Super Admin",
      email: "admin@eastgates.com",
      password: hashedPassword,
      phone: "+250 788 100 001",
      role: "SUPER_ADMIN",
      department: "Administration",
      status: "active",
      branchId: "",
    },
  });
  console.log("✓ Created Super Admin: admin@eastgates.com (password: 2026)");

  // Create SUPER MANAGER
  const superManager = await prisma.staff.upsert({
    where: { email: "manager@eastgates.com" },
    update: {
      name: "Super Manager",
      password: hashedPassword,
      phone: "+250 788 100 002",
      role: "SUPER_MANAGER",
      department: "Management",
      status: "active",
      branchId: "",
    },
    create: {
      name: "Super Manager",
      email: "manager@eastgates.com",
      password: hashedPassword,
      phone: "+250 788 100 002",
      role: "SUPER_MANAGER",
      department: "Management",
      status: "active",
      branchId: "",
    },
  });
  console.log("✓ Created Super Manager: manager@eastgates.com (password: 2026)");

  // Create Branch Managers for each branch
  const branchManagers = [
    {
      email: "manager.kigali@eastgates.com",
      name: "Kigali Branch Manager",
      branchId: BRANCHES.KIGALI_MAIN,
      phone: "+250 788 200 001",
    },
    {
      email: "manager.ngoma@eastgates.com",
      name: "Ngoma Branch Manager",
      branchId: BRANCHES.NGOMA,
      phone: "+250 788 200 002",
    },
    {
      email: "manager.kirehe@eastgates.com",
      name: "Kirehe Branch Manager",
      branchId: BRANCHES.KIREHE,
      phone: "+250 788 200 003",
    },
    {
      email: "manager.gatsibo@eastgates.com",
      name: "Gatsibo Branch Manager",
      branchId: BRANCHES.GATSIBO,
      phone: "+250 788 200 004",
    },
  ];

  for (const bm of branchManagers) {
    await prisma.staff.upsert({
      where: { email: bm.email },
      update: {
        name: bm.name,
        password: hashedPassword,
        phone: bm.phone,
        role: "BRANCH_MANAGER",
        department: "Management",
        status: "active",
        branchId: bm.branchId,
      },
      create: {
        name: bm.name,
        email: bm.email,
        password: hashedPassword,
        phone: bm.phone,
        role: "BRANCH_MANAGER",
        department: "Management",
        status: "active",
        branchId: bm.branchId,
      },
    });
    console.log(`✓ Created Branch Manager: ${bm.email} (password: 2026)`);
  }

  // Create staff for Kigali Main branch
  const kigaliStaff = [
    { email: "reception.kigali@eastgates.com", name: "Kigali Receptionist", role: "RECEPTIONIST", department: "Front Desk" },
    { email: "waiter.kigali@eastgates.com", name: "Kigali Waiter", role: "WAITER", department: "Restaurant" },
    { email: "chef.kigali@eastgates.com", name: "Kigali Chef", role: "CHEF", department: "Kitchen" },
    { email: "kitchen.kigali@eastgates.com", name: "Kigali Kitchen Staff", role: "KITCHEN_STAFF", department: "Kitchen" },
  ];

  for (const staff of kigaliStaff) {
    await prisma.staff.upsert({
      where: { email: staff.email },
      update: {
        name: staff.name,
        password: hashedPassword,
        role: staff.role,
        department: staff.department,
        status: "active",
        branchId: BRANCHES.KIGALI_MAIN,
      },
      create: {
        name: staff.name,
        email: staff.email,
        password: hashedPassword,
        phone: "+250 788 300 001",
        role: staff.role,
        department: staff.department,
        status: "active",
        branchId: BRANCHES.KIGALI_MAIN,
      },
    });
    console.log(`✓ Created Staff: ${staff.email} (password: 2026)`);
  }

  // Create sample rooms for each branch
  const roomTypes = [
    { type: "standard", price: 150000 },
    { type: "deluxe", price: 250000 },
    { type: "suite", price: 450000 },
    { type: "presidential", price: 850000 },
  ];

  for (const branch of branches) {
    let roomCount = 0;
    for (const roomType of roomTypes) {
      for (let floor = 1; floor <= 3; floor++) {
        for (let roomNum = 1; roomNum <= 5; roomNum++) {
          roomCount++;
          const roomId = `${branch.id}-${roomType.type}-${roomCount}`;
          await prisma.room.upsert({
            where: { id: roomId },
            update: {
              number: `${floor}${roomType.type[0].toUpperCase()}${roomNum}`,
              floor,
              type: roomType.type,
              price: roomType.price,
              status: "available",
              branchId: branch.id,
            },
            create: {
              id: roomId,
              number: `${floor}${roomType.type[0].toUpperCase()}${roomNum}`,
              floor,
              type: roomType.type,
              price: roomType.price,
              status: "available",
              branchId: branch.id,
            },
          });
        }
      }
    }
    console.log(`✓ Created rooms for ${branch.name}`);
  }

  // Create sample menu items for Kigali
  const menuCategories = ["Breakfast", "Lunch", "Dinner", "Drinks", "Dessert"];
  const menuItems = [
    { name: "Traditional Breakfast", category: "Breakfast", price: 15000 },
    { name: "Continental Breakfast", category: "Breakfast", price: 25000 },
    { name: "Grilled Chicken", category: "Lunch", price: 22000 },
    { name: "Fish Tilapia", category: "Lunch", price: 28000 },
    { name: "Beef Stew", category: "Dinner", price: 25000 },
    { name: "Vegetarian Platter", category: "Dinner", price: 18000 },
    { name: "Fresh Juice", category: "Drinks", price: 5000 },
    { name: "Coffee", category: "Drinks", price: 3000 },
    { name: "Chocolate Cake", category: "Dessert", price: 8000 },
    { name: "Ice Cream", category: "Dessert", price: 5000 },
  ];

  for (const item of menuItems) {
    const menuId = `menu-${item.name.toLowerCase().replace(/\s+/g, "-")}`;
    await prisma.menuItem.upsert({
      where: { id: menuId },
      update: {
        name: item.name,
        category: item.category,
        price: item.price,
        branchId: BRANCHES.KIGALI_MAIN,
        available: true,
      },
      create: {
        id: menuId,
        name: item.name,
        category: item.category,
        price: item.price,
        branchId: BRANCHES.KIGALI_MAIN,
        available: true,
      },
    });
  }
  console.log("✓ Created menu items for Kigali branch");

  console.log("\n✅ Seeding complete!");
  console.log("\n📋 Login Credentials:");
  console.log("  Super Admin: admin@eastgates.com / 2026");
  console.log("  Super Manager: manager@eastgates.com / 2026");
  console.log("  Branch Managers: manager.[branch]@eastgates.com / 2026");
  console.log("  Staff: [role].[branch]@eastgates.com / 2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
