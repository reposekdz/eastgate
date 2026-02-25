import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function testLogin() {
  console.log("🧪 Testing Login Functionality\n");
  console.log("========================================");

  const testAccounts = [
    { email: "eastgate@gmail.com", password: "2026", role: "super_admin" },
    { email: "admin@eastgate.rw", password: "admin123", role: "super_admin" },
    { email: "manager@eastgate.rw", password: "manager123", role: "super_manager" },
    { email: "jp@eastgate.rw", password: "jp123", role: "branch_manager" },
    { email: "grace@eastgate.rw", password: "grace123", role: "receptionist" },
  ];

  let passed = 0;
  let failed = 0;

  for (const account of testAccounts) {
    try {
      // Find staff
      const staff = await prisma.staff.findUnique({
        where: { email: account.email },
        include: { branch: true },
      });

      if (!staff) {
        console.log(`❌ FAIL: ${account.email} - Staff not found in database`);
        failed++;
        continue;
      }

      // Check password
      const isValid = await bcrypt.compare(account.password, staff.password || "");

      if (!isValid) {
        console.log(`❌ FAIL: ${account.email} - Password mismatch`);
        failed++;
        continue;
      }

      // Check status
      if (staff.status !== "active") {
        console.log(`❌ FAIL: ${account.email} - Account not active (${staff.status})`);
        failed++;
        continue;
      }

      // Check role
      if (staff.role !== account.role) {
        console.log(`⚠️  WARN: ${account.email} - Role mismatch (expected: ${account.role}, got: ${staff.role})`);
      }

      console.log(`✅ PASS: ${account.email} - ${staff.name} (${staff.role})`);
      passed++;
    } catch (error: any) {
      console.log(`❌ ERROR: ${account.email} - ${error.message}`);
      failed++;
    }
  }

  console.log("\n========================================");
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log("========================================\n");

  if (failed > 0) {
    console.log("⚠️  Some tests failed. Run the seed script:");
    console.log("   npx tsx prisma/seed-complete.ts\n");
  } else {
    console.log("🎉 All tests passed! Login should work correctly.\n");
  }
}

testLogin()
  .catch((e) => {
    console.error("❌ Test error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
