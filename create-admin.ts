import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔐 Creating test admin user...\n");

    const hashedPassword = await bcrypt.hash("EastGate@2026", 12);

    // Get first branch
    const branch = await prisma.branch.findFirst();
    
    if (!branch) {
      console.error("❌ No branch found. Please create a branch first.");
      return;
    }

    // Check if admin exists
    const existingAdmin = await prisma.staff.findUnique({
      where: { email: "admin@eastgate.com" }
    });

    if (existingAdmin) {
      console.log("✅ Admin user already exists!");
      console.log(`   Email: admin@eastgate.com`);
      console.log(`   Password: EastGate@2026`);
      return;
    }

    // Create admin
    const admin = await prisma.staff.create({
      data: {
        name: "System Administrator",
        email: "admin@eastgate.com",
        password: hashedPassword,
        phone: "+250 788 100 001",
        role: "SUPER_ADMIN",
        department: "Administration",
        status: "active",
        branchId: branch.id,
      },
    });

    console.log("✅ Admin user created successfully!\n");
    console.log("📋 LOGIN CREDENTIALS:");
    console.log("   Email: admin@eastgate.com");
    console.log("   Password: EastGate@2026");
    console.log(`   Branch: ${branch.name}\n`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
