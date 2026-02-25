import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting complete database seed with all test accounts...\n");

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

  // Create all staff members from README with proper passwords
  const staffMembers = [
    // Super Admins
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
    // Super Manager
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
    // Kigali Main Staff
    {
      email: "jp@eastgate.rw",
      name: "Jean-Pierre Habimana",
      phone: "+250 788 100 001",
      role: "branch_manager",
      department: "Management",
      shift: "Morning",
      password: "jp123",
      branchId: "kigali-main",
    },
    {
      email: "grace@eastgate.rw",
      name: "Grace Uwimana",
      phone: "+250 788 100 002",
      role: "receptionist",
      department: "Front Desk",
      shift: "Morning",
      password: "grace123",
      branchId: "kigali-main",
    },
    {
      email: "patrick@eastgate.rw",
      name: "Patrick Mugisha",
      phone: "+250 788 100 003",
      role: "waiter",
      department: "Restaurant",
      shift: "Morning",
      password: "patrick123",
      branchId: "kigali-main",
    },
    // Ngoma Branch Staff
    {
      email: "diane@eastgate.rw",
      name: "Diane Uwimana",
      phone: "+250 788 200 001",
      role: "branch_manager",
      department: "Management",
      shift: "Morning",
      password: "diane123",
      branchId: "ngoma-branch",
    },
    {
      email: "eric.n@eastgate.rw",
      name: "Eric Niyonzima",
      phone: "+250 788 200 002",
      role: "receptionist",
      department: "Front Desk",
      shift: "Morning",
      password: "eric123",
      branchId: "ngoma-branch",
    },
    // Kirehe Branch Staff
    {
      email: "patrick.n@eastgate.rw",
      name: "Patrick Niyonsaba",
      phone: "+250 788 300 001",
      role: "branch_manager",
      department: "Management",
      shift: "Morning",
      password: "patrick.n123",
      branchId: "kirehe-branch",
    },
    {
      email: "esperance@eastgate.rw",
      name: "Esperance Mukamana",
      phone: "+250 788 300 002",
      role: "receptionist",
      department: "Front Desk",
      shift: "Morning",
      password: "esperance123",
      branchId: "kirehe-branch",
    },
    // Gatsibo Branch Staff
    {
      email: "emmanuel.m@eastgate.rw",
      name: "Emmanuel Mugisha",
      phone: "+250 788 400 001",
      role: "branch_manager",
      department: "Management",
      shift: "Morning",
      password: "emmanuel123",
      branchId: "gatsibo-branch",
    },
    {
      email: "sylvie@eastgate.rw",
      name: "Sylvie Uwase",
      phone: "+250 788 400 002",
      role: "receptionist",
      department: "Front Desk",
      shift: "Morning",
      password: "sylvie123",
      branchId: "gatsibo-branch",
    },
  ];

  console.log("\n👥 Creating staff members...");
  for (const staff of staffMembers) {
    const hashedPassword = await bcrypt.hash(staff.password, 12);
    await prisma.staff.upsert({
      where: { email: staff.email },
      update: { 
        password: hashedPassword,
        status: "active",
      },
      create: {
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
    console.log(`✅ Created staff: ${staff.email} (${staff.role})`);
  }

  console.log("\n🎉 Complete seed finished successfully!");
  console.log("\n📋 Test Login Credentials:");
  console.log("========================================");
  console.log("Super Admin:");
  console.log("  eastgate@gmail.com / 2026");
  console.log("  admin@eastgate.rw / admin123");
  console.log("\nSuper Manager:");
  console.log("  manager@eastgate.rw / manager123");
  console.log("\nKigali Main:");
  console.log("  jp@eastgate.rw / jp123 (Manager)");
  console.log("  grace@eastgate.rw / grace123 (Receptionist)");
  console.log("  patrick@eastgate.rw / patrick123 (Waiter)");
  console.log("\nNgoma Branch:");
  console.log("  diane@eastgate.rw / diane123 (Manager)");
  console.log("  eric.n@eastgate.rw / eric123 (Receptionist)");
  console.log("\nKirehe Branch:");
  console.log("  patrick.n@eastgate.rw / patrick.n123 (Manager)");
  console.log("  esperance@eastgate.rw / esperance123 (Receptionist)");
  console.log("\nGatsibo Branch:");
  console.log("  emmanuel.m@eastgate.rw / emmanuel123 (Manager)");
  console.log("  sylvie@eastgate.rw / sylvie123 (Receptionist)");
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
