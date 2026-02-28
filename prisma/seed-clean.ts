import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting clean database seed...\n");

  // Create branches
  const branches = [
    {
      id: "kigali-main",
      slug: "kigali-main",
      name: "Kigali Main",
      location: "KG 7 Ave, Kigali City",
      address: "KG 7 Ave, Kigali City",
      city: "Kigali",
      phone: "+250 788 123 456",
      email: "kigali@eastgate.rw",
      totalRooms: 120,
    },
    {
      id: "ngoma-branch",
      slug: "ngoma-branch",
      name: "Ngoma Branch",
      location: "Ngoma District, Eastern Province",
      address: "Main Road, Ngoma",
      city: "Ngoma",
      phone: "+250 788 234 567",
      email: "ngoma@eastgate.rw",
      totalRooms: 80,
    },
    {
      id: "kirehe-branch",
      slug: "kirehe-branch",
      name: "Kirehe Branch",
      location: "Kirehe District, Eastern Province",
      address: "Market Street, Kirehe",
      city: "Kirehe",
      phone: "+250 788 345 678",
      email: "kirehe@eastgate.rw",
      totalRooms: 65,
    },
    {
      id: "gatsibo-branch",
      slug: "gatsibo-branch",
      name: "Gatsibo Branch",
      location: "Gatsibo District, Eastern Province",
      address: "Town Center, Gatsibo",
      city: "Gatsibo",
      phone: "+250 788 456 789",
      email: "gatsibo@eastgate.rw",
      totalRooms: 75,
    },
  ];

  for (const b of branches) {
    await prisma.branch.upsert({
      where: { id: b.id },
      update: {},
      create: b,
    });
    console.log(`✅ Created branch: ${b.name}`);
  }

  // Delete all existing staff
  await prisma.staff.deleteMany({});
  console.log("\n🗑️  Cleared all existing staff");

  // Create ONLY super admin and super manager
  const superAccounts = [
    {
      email: "eastgate@gmail.com",
      name: "EastGate Admin",
      phone: "+250 788 000 001",
      role: "super_admin",
      department: "Management",
      shift: "Full-time",
      password: "2026",
      branchId: "kigali-main",
    },
    {
      email: "admin@eastgate.rw",
      name: "Super Admin",
      phone: "+250 788 000 002",
      role: "super_admin",
      department: "Management",
      shift: "Full-time",
      password: "admin123",
      branchId: "kigali-main",
    },
    {
      email: "manager@eastgate.rw",
      name: "Super Manager",
      phone: "+250 788 000 003",
      role: "super_manager",
      department: "Management",
      shift: "Full-time",
      password: "manager123",
      branchId: "kigali-main",
    },
  ];

  console.log("\n👥 Creating super accounts only...");
  for (const staff of superAccounts) {
    const hashedPassword = await bcrypt.hash(staff.password, 12);
    await prisma.staff.create({
      data: {
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        department: staff.department,
        shift: staff.shift,
        status: "active",
        password: hashedPassword,
        branchId: staff.branchId,
      },
    });
    console.log(`✅ Created: ${staff.email} (${staff.role})`);
  }

  console.log("\n🎉 Clean seed completed successfully!");
  console.log("\n📋 Login Credentials:");
  console.log("========================================");
  console.log("Super Admin:");
  console.log("  eastgate@gmail.com / 2026");
  console.log("  admin@eastgate.rw / admin123");
  console.log("\nSuper Manager:");
  console.log("  manager@eastgate.rw / manager123");
  console.log("========================================");
  console.log("\n📝 Next Steps:");
  console.log("  1. Super Admin/Manager assigns Branch Managers");
  console.log("  2. Branch Managers add their staff (receptionists, waiters, etc.)");
  console.log("========================================");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
