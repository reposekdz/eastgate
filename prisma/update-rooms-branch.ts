import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateRoomsToBranch() {
  try {
    console.log("🔄 Updating all rooms to Kigali Main branch...\n");

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

    // Update all rooms to Kigali Main
    const result = await prisma.room.updateMany({
      data: {
        branchId: kigaliBranch.id,
      },
    });

    console.log(`\n✅ Updated ${result.count} rooms to ${kigaliBranch.name}`);
    
    // Show room count by branch
    const roomsByBranch = await prisma.room.groupBy({
      by: ['branchId'],
      _count: true,
    });

    console.log("\n📊 Rooms by branch:");
    for (const group of roomsByBranch) {
      const branch = await prisma.branch.findUnique({
        where: { id: group.branchId },
        select: { name: true }
      });
      console.log(`  ${branch?.name || group.branchId}: ${group._count} rooms`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRoomsToBranch();
