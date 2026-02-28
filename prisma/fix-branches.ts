import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixBranches() {
  try {
    console.log("🔄 Fixing room branches...\n");

    // Get Kigali Main branch
    const kigaliBranch = await prisma.branch.findFirst({
      where: { 
        OR: [
          { id: "kigali-main" },
          { name: { contains: "Kigali" } }
        ]
      }
    });

    if (!kigaliBranch) {
      console.error("❌ Kigali Main branch not found!");
      return;
    }

    console.log(`✅ Found branch: ${kigaliBranch.name} (${kigaliBranch.id})`);

    // Delete all rooms NOT in Kigali Main
    const deleted = await prisma.room.deleteMany({
      where: {
        branchId: {
          not: kigaliBranch.id
        }
      }
    });

    console.log(`\n🗑️  Deleted ${deleted.count} rooms from other branches`);

    // Count remaining rooms
    const remaining = await prisma.room.count({
      where: { branchId: kigaliBranch.id }
    });

    console.log(`✅ ${remaining} rooms remain in ${kigaliBranch.name}`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBranches();
