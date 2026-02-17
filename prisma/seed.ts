import { PrismaClient, MenuCategory, LoyaltyTier, RoomType, RoomStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { hash } from 'bcryptjs';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding database...');

    // 1. CLEANUP - Remove all transactional and demo data
    console.log('🧹 Cleaning database...');
    // Delete in order to respect foreign keys
    await prisma.revenue.deleteMany({}).catch(() => { /* ignore if not exist */ });
    await prisma.shift.deleteMany({}).catch(() => { /* ignore if not exist */ });
    await prisma.payment.deleteMany({}).catch(() => { /* ignore if not exist */ });
    await prisma.service.deleteMany({}).catch(() => { /* ignore if not exist */ });
    await prisma.orderItem.deleteMany({}).catch(() => { /* ignore if not exist */ });
    await prisma.order.deleteMany({}).catch(() => { /* ignore if not exist */ });
    await prisma.booking.deleteMany({}).catch(() => { /* ignore if not exist */ });
    await prisma.guest.deleteMany({}).catch(() => { /* ignore if not exist */ });
    await prisma.event.deleteMany({}).catch(() => { /* ignore if not exist */ });
    await prisma.user.deleteMany({}).catch(() => { /* ignore if not exist */ });

    console.log('✅ Database cleaned');

    // 2. SEED BRANCHES
    const kigaliBranch = await prisma.branch.upsert({
        where: { id: 'br-001' },
        update: {
            name: 'Kigali Main',
            location: 'KG 7 Ave, Kigali City',
            city: 'Kigali',
            province: 'Kigali City',
            phone: '+250 788 000 001',
            email: 'kigali@eastgate.rw',
            totalRooms: 120,
            managerName: 'Kigali Manager (Vacant)',
        },
        create: {
            id: 'br-001',
            name: 'Kigali Main',
            location: 'KG 7 Ave, Kigali City',
            city: 'Kigali',
            province: 'Kigali City',
            phone: '+250 788 000 001',
            email: 'kigali@eastgate.rw',
            totalRooms: 120,
            managerName: 'Kigali Manager (Vacant)',
        },
    });

    const ngomaBranch = await prisma.branch.upsert({
        where: { id: 'br-002' },
        update: {},
        create: {
            id: 'br-002',
            name: 'Ngoma Branch',
            location: 'Ngoma District, Eastern Province',
            city: 'Ngoma',
            province: 'Eastern Province',
            phone: '+250 788 000 002',
            email: 'ngoma@eastgate.rw',
            totalRooms: 80,
            managerName: 'Diane Uwimana',
        },
    });

    const kireheBranch = await prisma.branch.upsert({
        where: { id: 'br-003' },
        update: {},
        create: {
            id: 'br-003',
            name: 'Kirehe Branch',
            location: 'Kirehe District, Eastern Province',
            city: 'Kirehe',
            province: 'Eastern Province',
            phone: '+250 788 000 003',
            email: 'kirehe@eastgate.rw',
            totalRooms: 65,
            managerName: 'Patrick Niyonsaba',
        },
    });

    const gatsiboBranch = await prisma.branch.upsert({
        where: { id: 'br-004' },
        update: {},
        create: {
            id: 'br-004',
            name: 'Gatsibo Branch',
            location: 'Gatsibo District, Eastern Province',
            city: 'Gatsibo',
            province: 'Eastern Province',
            phone: '+250 788 000 004',
            email: 'gatsibo@eastgate.rw',
            totalRooms: 75,
            managerName: 'Emmanuel Mugisha',
        },
    });

    console.log('✅ Branches created');

    // Create Users
    const adminPassword = await hash('admin123', 10);
    const managerPassword = await hash('manager123', 10);
    const receptionistPassword = await hash('grace123', 10);
    const waiterPassword = await hash('patrick123', 10);

    await prisma.user.upsert({
        where: { email: 'admin@eastgate.rw' },
        update: {},
        create: {
            email: 'admin@eastgate.rw',
            name: 'Super Admin',
            password: adminPassword,
            phone: '+250 788 100 001',
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
        },
    });

    await prisma.user.upsert({
        where: { email: 'manager@eastgate.rw' },
        update: {},
        create: {
            email: 'manager@eastgate.rw',
            name: 'Super Manager',
            password: managerPassword,
            phone: '+250 788 100 002',
            role: 'SUPER_MANAGER',
            status: 'ACTIVE',
        },
    });

    await prisma.user.upsert({
        where: { email: 'jp@eastgate.rw' },
        update: {},
        create: {
            email: 'jp@eastgate.rw',
            name: 'Jean-Pierre Habimana',
            password: await hash('jp123', 10),
            phone: '+250 788 001 001',
            role: 'BRANCH_MANAGER',
            status: 'ACTIVE',
            branchId: kigaliBranch.id,
        },
    });

    await prisma.user.upsert({
        where: { email: 'grace@eastgate.rw' },
        update: {},
        create: {
            email: 'grace@eastgate.rw',
            name: 'Grace Uwase',
            password: receptionistPassword,
            phone: '+250 788 002 001',
            role: 'RECEPTIONIST',
            status: 'ACTIVE',
            branchId: kigaliBranch.id,
        },
    });

    await prisma.user.upsert({
        where: { email: 'patrick@eastgate.rw' },
        update: {},
        create: {
            email: 'patrick@eastgate.rw',
            name: 'Patrick Bizimana',
            password: waiterPassword,
            phone: '+250 788 005 001',
            role: 'WAITER',
            status: 'ACTIVE',
            branchId: kigaliBranch.id,
        },
    });

    console.log('✅ Users created');

    // Create Rooms
    const roomTypes: Array<{ type: RoomType, price: number, name: string }> = [
        { type: RoomType.STANDARD, price: 234000, name: 'Standard' },
        { type: RoomType.DELUXE, price: 325000, name: 'Deluxe' },
        { type: RoomType.FAMILY, price: 416000, name: 'Family' },
        { type: RoomType.EXECUTIVE_SUITE, price: 585000, name: 'Executive Suite' },
        { type: RoomType.PRESIDENTIAL_SUITE, price: 1105000, name: 'Presidential Suite' },
    ];

    for (let floor = 1; floor <= 3; floor++) {
        for (let roomNum = 1; roomNum <= 5; roomNum++) {
            const number = `${floor}${roomNum.toString().padStart(2, '0')}`;
            const roomType = roomTypes[roomNum - 1];

            await prisma.room.upsert({
                where: { branchId_number: { branchId: kigaliBranch.id, number } },
                update: {},
                create: {
                    number,
                    floor,
                    type: roomType.type,
                    price: roomType.price,
                    description: `Beautiful ${roomType.name} room on floor ${floor}`,
                    maxOccupancy: roomType.type === RoomType.FAMILY ? 4 : roomType.type.includes('SUITE') ? 2 : 2,
                    size: roomType.type === RoomType.PRESIDENTIAL_SUITE ? 85 : roomType.type === RoomType.EXECUTIVE_SUITE ? 55 : 35,
                    view: floor >= 2 ? 'City View' : 'Garden View',
                    amenities: [
                        'WiFi',
                        'Air Conditioning',
                        'Smart TV',
                        'Mini Bar',
                        'Safe',
                        'Coffee Maker',
                    ],
                    branchId: kigaliBranch.id,
                    status: RoomStatus.AVAILABLE,
                },
            });
        }
    }

    console.log('✅ Rooms created');

    // Create Menu Items
    const menuItems: Array<{
        name: string;
        nameKinyarwanda: string;
        category: MenuCategory;
        description: string;
        price: number;
        cost: number;
        calories: number;
        preparationTime: number;
        available: boolean;
        popular: boolean;
    }> = [
            {
                name: 'Continental Breakfast',
                nameKinyarwanda: 'Ifunguro ryo mu gitondo',
                category: MenuCategory.BREAKFAST,
                description: 'Eggs, toast, fresh fruit, pastries, juice',
                price: 19500,
                cost: 8000,
                calories: 650,
                preparationTime: 15,
                available: true,
                popular: true,
            },
            {
                name: 'Rwandan Breakfast',
                nameKinyarwanda: 'Ifunguro rya kinyarwanda',
                category: MenuCategory.BREAKFAST,
                description: 'Sweet potatoes, beans, banana, fresh milk',
                price: 15600,
                cost: 6000,
                calories: 580,
                preparationTime: 20,
                available: true,
                popular: true,
            },
            {
                name: 'Grilled Tilapia',
                nameKinyarwanda: "Ifi y'ikigezi",
                category: MenuCategory.MAIN_COURSE,
                description: 'Lake Kivu tilapia with vegetables and rice',
                price: 23400,
                cost: 10000,
                calories: 480,
                preparationTime: 25,
                available: true,
                popular: true,
            },
            {
                name: 'Brochette Platter',
                nameKinyarwanda: 'Amabrochette',
                category: MenuCategory.MAIN_COURSE,
                description: 'Grilled meat skewers with fries and salad',
                price: 28600,
                cost: 12000,
                calories: 820,
                preparationTime: 30,
                available: true,
                popular: true,
            },
            {
                name: 'Isombe & Plantain',
                nameKinyarwanda: "Isombe n'Igitoki",
                category: MenuCategory.AFRICAN_CUISINE,
                description: 'Traditional cassava leaves with plantain',
                price: 18200,
                cost: 7000,
                calories: 450,
                preparationTime: 35,
                available: true,
                popular: false,
            },
            {
                name: 'Nyama Choma',
                nameKinyarwanda: "Inyama y'inka",
                category: MenuCategory.MAIN_COURSE,
                description: 'Flame-grilled beef with ugali',
                price: 32500,
                cost: 15000,
                calories: 920,
                preparationTime: 35,
                available: true,
                popular: true,
            },
            {
                name: 'Rwandan Coffee',
                nameKinyarwanda: "Ikawa y'u Rwanda",
                category: MenuCategory.BEVERAGES,
                description: 'Premium single-origin Rwandan coffee',
                price: 6500,
                cost: 2000,
                calories: 5,
                preparationTime: 5,
                available: true,
                popular: true,
            },
            {
                name: 'Fresh Juice',
                nameKinyarwanda: 'Umutobe mushya',
                category: MenuCategory.BEVERAGES,
                description: 'Passion fruit, mango, or mixed fruit',
                price: 7800,
                cost: 3000,
                calories: 120,
                preparationTime: 5,
                available: true,
                popular: false,
            },
            {
                name: 'Banana Wine',
                nameKinyarwanda: 'Urwagwa',
                category: MenuCategory.BEVERAGES,
                description: 'Traditional Rwandan banana wine',
                price: 10400,
                cost: 4000,
                calories: 180,
                preparationTime: 2,
                available: true,
                popular: false,
            },
            {
                name: 'Chocolate Lava Cake',
                nameKinyarwanda: 'Keke ya shokora',
                category: MenuCategory.DESSERT,
                description: 'Warm chocolate cake with vanilla ice cream',
                price: 13000,
                cost: 5000,
                calories: 520,
                preparationTime: 15,
                available: true,
                popular: true,
            },
        ];

    for (const item of menuItems) {
        await prisma.menuItem.create({
            data: item,
        });
    }

    console.log('✅ Menu items created');

    // Create sample guests
    const guests: Array<{
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        nationality: string;
        loyaltyTier: LoyaltyTier;
        loyaltyPoints: number;
        totalStays: number;
        totalSpent: number;
    }> = [
            {
                firstName: 'Sarah',
                lastName: 'Mitchell',
                email: 'sarah@email.com',
                phone: '+1 555-0101',
                nationality: 'United States',
                loyaltyTier: LoyaltyTier.PLATINUM,
                loyaltyPoints: 15200,
                totalStays: 12,
                totalSpent: 37050000,
            },
            {
                firstName: 'James',
                lastName: 'Okafor',
                email: 'james@email.com',
                phone: '+234 802-0202',
                nationality: 'Nigeria',
                loyaltyTier: LoyaltyTier.GOLD,
                loyaltyPoints: 8400,
                totalStays: 7,
                totalSpent: 18460000,
            },
        ];

    for (const guest of guests) {
        await prisma.guest.create({
            data: guest,
        });
    }

    console.log('✅ Sample guests created');

    console.log('🎉 Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
