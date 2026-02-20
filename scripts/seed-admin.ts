import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding admin accounts...");

  // Check if branch exists
  const branches = await prisma.$queryRaw`SELECT id FROM branches LIMIT 1` as any[];
  
  let branchId = "main-branch";
  if (branches.length === 0) {
    // Create default branch
    await prisma.$executeRaw`
      INSERT INTO branches (id, name, location, address, phone, email, is_active, created_at, updated_at)
      VALUES (
        ${branchId},
        'Eastgate Hotel Main',
        'Kigali, Rwanda',
        'KG 123 Street, Kigali',
        '+250 788 123 456',
        'info@eastgate.com',
        true,
        NOW(),
        NOW()
      )
    `;
    console.log("Created default branch");
  } else {
    branchId = branches[0].id;
  }

  // Create super admin
  const superAdminPassword = await bcrypt.hash("superadmin123", 10);
  await prisma.$executeRaw`
    INSERT IGNORE INTO staff (id, name, email, phone, role, department, shift, status, password, branch_id, join_date, created_at, updated_at)
    VALUES (
      ${crypto.randomUUID()},
      'Super Admin',
      'superadmin@eastgate.com',
      '+250 788 000 001',
      'SUPER_ADMIN',
      'Management',
      'Morning',
      'active',
      ${superAdminPassword},
      ${branchId},
      NOW(),
      NOW(),
      NOW()
    )
  `;
  console.log("Created Super Admin: superadmin@eastgate.com / superadmin123");

  // Create manager
  const managerPassword = await bcrypt.hash("manager123", 10);
  await prisma.$executeRaw`
    INSERT IGNORE INTO staff (id, name, email, phone, role, department, shift, status, password, branch_id, join_date, created_at, updated_at)
    VALUES (
      ${crypto.randomUUID()},
      'Branch Manager',
      'manager@eastgate.com',
      '+250 788 000 002',
      'MANAGER',
      'Management',
      'Morning',
      'active',
      ${managerPassword},
      ${branchId},
      NOW(),
      NOW(),
      NOW()
    )
  `;
  console.log("Created Manager: manager@eastgate.com / manager123");

  // Create receptionist
  const receptionistPassword = await bcrypt.hash("reception123", 10);
  await prisma.$executeRaw`
    INSERT IGNORE INTO staff (id, name, email, phone, role, department, shift, status, password, branch_id, join_date, created_at, updated_at)
    VALUES (
      ${crypto.randomUUID()},
      'Receptionist',
      'reception@eastgate.com',
      '+250 788 000 003',
      'RECEPTIONIST',
      'Front Desk',
      'Morning',
      'active',
      ${receptionistPassword},
      ${branchId},
      NOW(),
      NOW(),
      NOW()
    )
  `;
  console.log("Created Receptionist: reception@eastgate.com / reception123");

  // Create waiter
  const waiterPassword = await bcrypt.hash("waiter123", 10);
  await prisma.$executeRaw`
    INSERT IGNORE INTO staff (id, name, email, phone, role, department, shift, status, password, branch_id, join_date, created_at, updated_at)
    VALUES (
      ${crypto.randomUUID()},
      'Waiter',
      'waiter@eastgate.com',
      '+250 788 000 004',
      'WAITER',
      'Restaurant',
      'Evening',
      'active',
      ${waiterPassword},
      ${branchId},
      NOW(),
      NOW(),
      NOW()
    )
  `;
  console.log("Created Waiter: waiter@eastgate.com / waiter123");

  // Create kitchen staff
  const kitchenPassword = await bcrypt.hash("kitchen123", 10);
  await prisma.$executeRaw`
    INSERT IGNORE INTO staff (id, name, email, phone, role, department, shift, status, password, branch_id, join_date, created_at, updated_at)
    VALUES (
      ${crypto.randomUUID()},
      'Kitchen Staff',
      'kitchen@eastgate.com',
      '+250 788 000 005',
      'KITCHEN',
      'Kitchen',
      'Morning',
      'active',
      ${kitchenPassword},
      ${branchId},
      NOW(),
      NOW(),
      NOW()
    )
  `;
  console.log("Created Kitchen: kitchen@eastgate.com / kitchen123");

  console.log("\n✅ Seed completed successfully!");
  console.log("\nLogin credentials:");
  console.log("========================================");
  console.log("Super Admin: superadmin@eastgate.com / superadmin123");
  console.log("Manager:     manager@eastgate.com / manager123");
  console.log("Receptionist: reception@eastgate.com / reception123");
  console.log("Waiter:      waiter@eastgate.com / waiter123");
  console.log("Kitchen:     kitchen@eastgate.com / kitchen123");
  console.log("========================================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
