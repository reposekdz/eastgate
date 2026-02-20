import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting database seed...\n");

    // Create default branch
    const branch = await prisma.branch.upsert({
        where: { id: "main-branch" },
        update: {},
        create: {
            id: "main-branch",
            name: "Eastgate Hotel Main",
            location: "Kigali, Rwanda",
            address: "KG 123 Street, Kigali",
            phone: "+250 788 123 456",
            email: "info@eastgate.com",
            isActive: true,
        },
    });
    console.log("✅ Created default branch:", branch.name);

    // Create rooms
    const roomTypes = [
        { number: "101", floor: 1, type: "standard", price: 234000, description: "Comfortable standard room with essential amenities" },
        { number: "102", floor: 1, type: "standard", price: 234000, description: "Comfortable standard room with essential amenities" },
        { number: "103", floor: 1, type: "standard", price: 234000, description: "Comfortable standard room with essential amenities" },
        { number: "201", floor: 2, type: "deluxe", price: 325000, description: "Spacious deluxe room with balcony and mini bar" },
        { number: "202", floor: 2, type: "deluxe", price: 325000, description: "Spacious deluxe room with balcony and mini bar" },
        { number: "203", floor: 2, type: "deluxe", price: 325000, description: "Spacious deluxe room with balcony and mini bar" },
        { number: "301", floor: 3, type: "suite", price: 550000, description: "Luxurious suite with living area and premium amenities" },
        { number: "302", floor: 3, type: "suite", price: 550000, description: "Luxurious suite with living area and premium amenities" },
    ];

    // First delete existing rooms to avoid duplicates
    await prisma.room.deleteMany({ where: { branchId: branch.id } });

    for (const room of roomTypes) {
        await prisma.room.create({
            data: {
                number: room.number,
                floor: room.floor,
                type: room.type,
                status: "available",
                price: room.price,
                description: room.description,
                imageUrl: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=600",
                branchId: branch.id,
            },
        });
    }
    console.log("✅ Created rooms:", roomTypes.length);

    // Create menu items
    const menuItems = [
        // Breakfast
        { name: "Continental Breakfast", category: "Breakfast", price: 25000, description: "Fresh fruits, croissants, and coffee", popular: true },
        { name: "Full English Breakfast", category: "Breakfast", price: 35000, description: "Eggs, bacon, sausage, beans, toast", popular: true },
        { name: "Pancakes & Maple Syrup", category: "Breakfast", price: 22000, description: "Fluffy pancakes with maple syrup", popular: false },
        { name: "Avocado Toast", category: "Breakfast", price: 18000, description: "Sourdough bread with avocado and poached eggs", popular: true },
        { name: "Fresh Juice", category: "Breakfast", price: 8000, description: "Orange, mango, or pineapple juice", popular: false },

        // Main Courses
        { name: "Grilled Tilapia", category: "Main Course", price: 45000, description: "Fresh tilapia with vegetables and rice", popular: true },
        { name: "Chicken BBQ", category: "Main Course", price: 38000, description: "Grilled chicken with BBQ sauce and fries", popular: true },
        { name: "Beef Steak", category: "Main Course", price: 55000, description: "Premium beef steak with mashed potatoes", popular: true },
        { name: "Vegetable Stir Fry", category: "Main Course", price: 28000, description: "Fresh vegetables in soy sauce with rice", popular: false },
        { name: "Pasta Carbonara", category: "Main Course", price: 32000, description: "Creamy pasta with bacon and parmesan", popular: false },
        { name: "Rwanda Goat Stew", category: "Main Course", price: 40000, description: "Traditional Rwandan goat stew with banana", popular: true },
        { name: "Fish & Chips", category: "Main Course", price: 35000, description: "Crispy fried fish with chunky chips", popular: false },

        // Desserts
        { name: "Chocolate Cake", category: "Desserts", price: 12000, description: "Rich chocolate cake with ganache", popular: true },
        { name: "Ice Cream", category: "Desserts", price: 8000, description: "Vanilla, chocolate, or strawberry", popular: false },
        { name: "Fruit Salad", category: "Desserts", price: 10000, description: "Fresh seasonal fruits", popular: false },
        { name: "Cheesecake", category: "Desserts", price: 15000, description: "Creamy cheesecake with berry sauce", popular: true },

        // Drinks
        { name: "Coffee", category: "Drinks", price: 5000, description: "Black coffee or with milk", popular: true },
        { name: "Tea", category: "Drinks", price: 4000, description: "Black tea, green tea, or herbal", popular: false },
        { name: "Soda", category: "Drinks", price: 3500, description: "Coca Cola, Fanta, Sprite", popular: false },
        { name: "Water", category: "Drinks", price: 2000, description: "Bottled water 500ml", popular: true },
        { name: "Fresh Smoothie", category: "Drinks", price: 12000, description: "Mixed fruit smoothie", popular: false },
        { name: "Local Beer", category: "Drinks", price: 6000, description: "Primus or Mutzig", popular: true },
        { name: "Wine", category: "Drinks", price: 15000, description: "Red or white wine by the glass", popular: false },
    ];

    // Delete existing menu items
    await prisma.menuItem.deleteMany({ where: { branchId: branch.id } });

    for (const item of menuItems) {
        await prisma.menuItem.create({
            data: {
                ...item,
                available: true,
                vegetarian: item.name.includes("Vegetable") || item.name.includes("Avocado") || item.name.includes("Fruit"),
                spicy: item.name.includes("Stir Fry") || item.name.includes("BBQ"),
                imageUrl: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400",
                branchId: branch.id,
            },
        });
    }
    console.log("✅ Created menu items:", menuItems.length);

    // Create staff with proper hashed passwords
    const staffMembers = [
        {
            email: "superadmin@eastgate.com",
            name: "Super Admin",
            phone: "+250 788 000 001",
            role: "SUPER_ADMIN",
            department: "Management",
            shift: "Morning",
            password: "superadmin123",
        },
        {
            email: "manager@eastgate.com",
            name: "Branch Manager",
            phone: "+250 788 000 002",
            role: "MANAGER",
            department: "Management",
            shift: "Morning",
            password: "manager123",
        },
        {
            email: "reception@eastgate.com",
            name: "Receptionist",
            phone: "+250 788 000 003",
            role: "RECEPTIONIST",
            department: "Front Desk",
            shift: "Morning",
            password: "reception123",
        },
        {
            email: "waiter@eastgate.com",
            name: "Waiter",
            phone: "+250 788 000 004",
            role: "WAITER",
            department: "Restaurant",
            shift: "Evening",
            password: "waiter123",
        },
        {
            email: "kitchen@eastgate.com",
            name: "Kitchen Staff",
            phone: "+250 788 000 005",
            role: "KITCHEN",
            department: "Kitchen",
            shift: "Morning",
            password: "kitchen123",
        },
    ];

    for (const staff of staffMembers) {
        const hashedPassword = await bcrypt.hash(staff.password, 12);
        await prisma.staff.upsert({
            where: { email: staff.email },
            update: { password: hashedPassword },
            create: {
                name: staff.name,
                email: staff.email,
                phone: staff.phone,
                role: staff.role,
                department: staff.department,
                shift: staff.shift,
                status: "active",
                password: hashedPassword,
                branchId: branch.id,
            },
        });
        console.log("✅ Created staff:", staff.email);
    }

    console.log("\n🎉 Seed completed successfully!");
    console.log("\n📋 Login credentials:");
    console.log("========================================");
    console.log("Super Admin:   superadmin@eastgate.com / superadmin123");
    console.log("Manager:      manager@eastgate.com / manager123");
    console.log("Receptionist:  reception@eastgate.com / reception123");
    console.log("Waiter:       waiter@eastgate.com / waiter123");
    console.log("Kitchen:      kitchen@eastgate.com / kitchen123");
    console.log("========================================");

    // Create sample messages from guests
    console.log("\n💬 Creating sample messages...");
    const sampleMessages = [
        {
            sender: "guest",
            senderName: "John Smith",
            senderEmail: "john.smith@email.com",
            senderPhone: "+250 789 123 456",
            message: "Hi, I'm interested in booking a deluxe room for 3 nights. Do you have availability next week?",
            branchId: branch.id,
            read: false,
            starred: false,
        },
        {
            sender: "guest",
            senderName: "Marie Mukamana",
            senderEmail: "marie.m@email.com",
            senderPhone: "+250 788 987 654",
            message: "Muraho! Ndashaka kumenya ibiciro by'ibyumba bitandukanye. Mugaragaze ikindi kiguzi?",
            branchId: branch.id,
            read: true,
            starred: true,
        },
        {
            sender: "guest",
            senderName: "David Wilson",
            senderEmail: "david.w@company.com",
            senderPhone: "+250 790 111 222",
            message: "Hello, I'm looking to organize a corporate event for about 50 people. What facilities do you have?",
            branchId: branch.id,
            read: false,
            starred: false,
        },
        {
            sender: "guest",
            senderName: "Sarah Johnson",
            senderEmail: "sarah.j@email.com",
            senderPhone: "+250 791 333 444",
            message: "Do you offer spa services? I'd like to book a massage during my stay.",
            branchId: branch.id,
            read: true,
            starred: false,
        },
        {
            sender: "guest",
            senderName: "Pierre Nkurunziza",
            senderEmail: "pierre.n@email.com",
            senderPhone: "+250 792 555 666",
            message: "Ndashaka gufata icyumba kugira ngo ndindane. Ni shyanga iki?",
            branchId: branch.id,
            read: false,
            starred: false,
        },
    ];

    await prisma.message.deleteMany({ where: { branchId: branch.id } });
    for (const msg of sampleMessages) {
        await prisma.message.create({
            data: {
                ...msg,
                recipientId: "reception",
                archived: false,
            },
        });
    }
    console.log("✅ Created sample messages:", sampleMessages.length);

    // Create sample events with correct schema fields
    console.log("\n📅 Creating sample events...");
    const events = [
        {
            name: "New Year's Gala Dinner",
            type: "Gala",
            date: new Date("2026-12-31"),
            startTime: "19:00",
            endTime: "23:00",
            hall: "Grand Ballroom",
            capacity: 200,
            organizer: "Events Team",
            description: "Celebrate the new year with an exquisite dinner experience featuring live music and fireworks.",
            branchId: branch.id,
        },
        {
            name: "Rwanda Cultural Night",
            type: "Cultural",
            date: new Date("2026-03-15"),
            startTime: "18:00",
            endTime: "22:00",
            hall: "Garden Terrace",
            capacity: 100,
            organizer: "Cultural Affairs",
            description: "Experience the rich culture of Rwanda through traditional dance, music, and cuisine.",
            branchId: branch.id,
        },
        {
            name: "Corporate Leadership Summit",
            type: "Business",
            date: new Date("2026-04-20"),
            startTime: "08:00",
            endTime: "17:00",
            hall: "Conference Center",
            capacity: 150,
            organizer: "Business Development",
            description: "A 2-day conference for business leaders featuring workshops and networking opportunities.",
            branchId: branch.id,
        },
        {
            name: "Wedding Expo 2026",
            type: "Wedding",
            date: new Date("2026-05-10"),
            startTime: "10:00",
            endTime: "18:00",
            hall: "Exhibition Hall",
            capacity: 300,
            organizer: "Wedding Planning",
            description: "Meet top wedding vendors and plan your perfect day at our annual wedding expo.",
            branchId: branch.id,
        },
    ];

    await prisma.event.deleteMany({ where: { branchId: branch.id } });
    for (const evt of events) {
        await prisma.event.create({
            data: evt,
        });
    }
    console.log("✅ Created events:", events.length);

    // Create sample guests with correct schema fields
    console.log("\n👥 Creating sample guests...");
    const guests = [
        {
            name: "James Cameron",
            email: "james.c@email.com",
            phone: "+250 793 777 888",
            nationality: "Canadian",
            branchId: branch.id,
        },
        {
            name: "Alice Uwera",
            email: "alice.u@email.com",
            phone: "+250 794 999 000",
            nationality: "Rwandan",
            branchId: branch.id,
        },
        {
            name: "Michael Chen",
            email: "michael.c@company.com",
            phone: "+250 795 111 333",
            nationality: "Chinese",
            branchId: branch.id,
        },
    ];

    await prisma.guest.deleteMany({ where: { branchId: branch.id } });
    for (const guest of guests) {
        await prisma.guest.create({
            data: guest,
        });
    }
    console.log("✅ Created guests:", guests.length);

    console.log("\n🎉 All seed data created successfully!");
}

main()
    .catch((e) => {
        console.error("❌ Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
