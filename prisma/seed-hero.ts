import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedHero() {
  try {
    // Check if hero content already exists
    const existingHero = await prisma.heroContent.findFirst();
    
    if (existingHero) {
      console.log('Hero content already exists, skipping seed...');
      return;
    }

    // Get first branch (Kigali Main)
    const branch = await prisma.branch.findFirst({
      where: { name: { contains: 'Kigali' } }
    });

    if (!branch) {
      console.log('No branch found, creating hero without branch...');
    }

    // Create default hero slide
    await prisma.heroContent.create({
      data: {
        title: 'Exceptional Hospitality',
        subtitle: 'Redefining Luxury in East Africa',
        description: 'Immerse yourself in world-class service where every detail is meticulously crafted. Experience hospitality that transcends expectations.',
        imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80',
        ctaText: 'Explore Our Services',
        ctaLink: '/rooms',
        branchId: branch?.id || null,
        order: 0,
        isActive: true,
      },
    });

    console.log('✅ Default hero slide created successfully!');
  } catch (error) {
    console.error('Error seeding hero:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedHero();
