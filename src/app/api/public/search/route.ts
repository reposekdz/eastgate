import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Enhanced search with real-time data and advanced features
export const dynamic = 'force-dynamic';

// Predefined popular searches for autocomplete
const POPULAR_SEARCHES = [
  { term: "standard room", category: "rooms", label: "Standard Room - $89/night" },
  { term: "deluxe room", category: "rooms", label: "Deluxe Room - $129/night" },
  { term: "family suite", category: "rooms", label: "Family Suite - $199/night" },
  { term: "executive suite", category: "rooms", label: "Executive Suite - $299/night" },
  { term: "presidential suite", category: "rooms", label: "Presidential Suite - $499/night" },
  { term: "spa", category: "services", label: "Spa & Wellness" },
  { term: "massage", category: "services", label: "Massage Services" },
  { term: "pool", category: "services", label: "Swimming Pool" },
  { term: "gym", category: "services", label: "Fitness Center" },
  { term: "restaurant", category: "dining", label: "Restaurant & Dining" },
  { term: "breakfast", category: "menu", label: "Breakfast Menu" },
  { term: "lunch", category: "menu", label: "Lunch Menu" },
  { term: "dinner", category: "menu", label: "Dinner Menu" },
  { term: "wedding", category: "events", label: "Wedding Packages" },
  { term: "conference", category: "events", label: "Conference Rooms" },
  { term: "airport transfer", category: "services", label: "Airport Transfer" },
  { term: "wifi", category: "services", label: "Free WiFi" },
  { term: "parking", category: "services", label: "Secure Parking" },
];

// Predefined services with full details
const PREDEFINED_SERVICES: Record<string, any[]> = {
  spa: [
    { id: 'spa-1', name: 'Swedish Massage', nameRw: 'Massage ya Suwidi', description: 'Relaxing full-body massage to relieve stress', price: 25000, duration: 60, type: 'SPA', category: 'Wellness' },
    { id: 'spa-2', name: 'Deep Tissue Massage', nameRw: 'Massage ya Tissue', description: 'Intensive muscle relief for chronic tension', price: 35000, duration: 90, type: 'SPA', category: 'Wellness' },
    { id: 'spa-3', name: 'Aromatherapy', nameRw: 'Aromatherapy', description: 'Scented oil massage therapy for relaxation', price: 30000, duration: 75, type: 'SPA', category: 'Wellness' },
    { id: 'spa-4', name: 'Facial Treatment', nameRw: 'Ibikoniro', description: 'Rejuvenating facial care treatment', price: 20000, duration: 45, type: 'SPA', category: 'Wellness' },
    { id: 'spa-5', name: 'Hot Stone Therapy', nameRw: 'Amabuye Menshi', description: 'Heated stone massage therapy', price: 40000, duration: 90, type: 'SPA', category: 'Wellness' },
    { id: 'spa-6', name: 'Body Scrub', nameRw: 'Body Scrub', description: 'Full body exfoliation treatment', price: 18000, duration: 45, type: 'SPA', category: 'Wellness' },
    { id: 'spa-7', name: 'Couples Massage', nameRw: 'Massage y-Ababana', description: 'Romantic massage for couples', price: 50000, duration: 90, type: 'SPA', category: 'Wellness' },
  ],
  pool: [
    { id: 'pool-1', name: 'Pool Access - Day Pass', nameRw: 'Ipiki y-Amazi - Igihe', description: 'Full access to indoor heated pool', price: 3000, duration: 1440, type: 'POOL', category: 'Recreation' },
    { id: 'pool-2', name: 'Pool Access - Weekly', nameRw: 'Ipiki y-Amazi - icyumweru', description: 'Unlimited pool access for a week', price: 15000, duration: 10080, type: 'POOL', category: 'Recreation' },
    { id: 'pool-3', name: 'Swimming Lessons', nameRw: 'Amahugurwa y\'Inyenga', description: 'Professional swimming instruction', price: 25000, duration: 60, type: 'POOL', category: 'Recreation' },
  ],
  gym: [
    { id: 'gym-1', name: 'Gym Access - Day Pass', nameRw: 'Ipiki y\'Imbaraga - Igihe', description: 'Full gym facility access', price: 5000, duration: 1440, type: 'FITNESS', category: 'Fitness' },
    { id: 'gym-2', name: 'Gym Access - Weekly', nameRw: 'Ipiki y\'Imbaraga - icyumweru', description: 'Unlimited gym access for a week', price: 25000, duration: 10080, type: 'FITNESS', category: 'Fitness' },
    { id: 'gym-3', name: 'Personal Training', nameRw: 'Igikoni cya Muntu', description: 'One-on-one fitness session with trainer', price: 15000, duration: 60, type: 'FITNESS', category: 'Fitness' },
    { id: 'gym-4', name: 'Yoga Class', nameRw: 'Yoga', description: 'Group yoga session', price: 8000, duration: 60, type: 'FITNESS', category: 'Fitness' },
    { id: 'gym-5', name: 'Zumba Class', nameRw: 'Zumba', description: 'High-energy dance workout', price: 8000, duration: 60, type: 'FITNESS', category: 'Fitness' },
  ],
  wifi: [
    { id: 'wifi-1', name: 'High-Speed WiFi', nameRw: 'Internet nguso', description: 'Complimentary high-speed internet access in all rooms', price: 0, duration: 1440, type: 'AMENITY', category: 'Amenities' },
    { id: 'wifi-2', name: 'Premium WiFi', nameRw: 'Internet nzira', description: 'Premium fiber optic internet for business', price: 5000, duration: 1440, type: 'AMENITY', category: 'Amenities' },
  ],
  transport: [
    { id: 'trans-1', name: 'Airport Pickup', nameRw: 'Guhura ku Kibuga', description: 'Professional airport pickup service', price: 15000, duration: 60, type: 'TRANSPORT', category: 'Transport' },
    { id: 'trans-2', name: 'Airport Dropoff', nameRw: 'Kuzana ku Kibuga', description: 'Professional airport dropoff service', price: 15000, duration: 60, type: 'TRANSPORT', category: 'Transport' },
    { id: 'trans-3', name: 'City Tour', nameRw: 'Tour mu Mujyi', description: 'Guided tour of Kigali city', price: 35000, duration: 240, type: 'TRANSPORT', category: 'Transport' },
    { id: 'trans-4', name: 'Car Rental', nameRw: 'Ibibuga by\'Imodoka', description: 'Self-drive car rental', price: 50000, duration: 1440, type: 'TRANSPORT', category: 'Transport' },
  ],
  parking: [
    { id: 'park-1', name: 'Secure Parking', nameRw: 'Ahantu h\'Imodoka', description: '24/7 secure parking with surveillance', price: 5000, duration: 1440, type: 'PARKING', category: 'Amenities' },
    { id: 'park-2', name: 'Valet Parking', nameRw: 'Valet Parking', description: 'Premium valet parking service', price: 10000, duration: 1440, type: 'PARKING', category: 'Amenities' },
  ],
  dining: [
    { id: 'dine-1', name: 'Room Service', nameRw: 'Serivisi y\'Icyumba', description: 'In-room dining experience', price: 0, duration: 0, type: 'DINING', category: 'Dining' },
    { id: 'dine-2', name: 'Buffet Breakfast', nameRw: 'Ifunguro rya_More', description: 'International breakfast buffet', price: 12000, duration: 90, type: 'DINING', category: 'Dining' },
    { id: 'dine-3', name: 'Buffet Dinner', nameRw: 'Igihe_Cyo', description: 'International dinner buffet', price: 18000, duration: 120, type: 'DINING', category: 'Dining' },
    { id: 'dine-4', name: 'Afternoon Tea', nameRw: 'Tea y\'Nyuma y\'Umugoroba', description: 'Light snacks and tea service', price: 5000, duration: 60, type: 'DINING', category: 'Dining' },
  ],
};

// GET /api/public/search - Comprehensive real-time public search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "all";
    const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : null;
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : null;
    const sortBy = searchParams.get("sortBy") || "relevance";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    
    // Get current timestamp for real-time data
    const timestamp = new Date().toISOString();

    // If no query, return popular searches and featured items
    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        timestamp,
        query: "",
        totalResults: 0,
        suggestions: POPULAR_SEARCHES.slice(0, 8),
        rooms: [],
        menuItems: [],
        events: [],
        services: [],
        branches: [],
        featured: await getFeaturedItems(),
      });
    }

    const searchTerm = query.toLowerCase();
    const results: any = {
      rooms: [],
      menuItems: [],
      events: [],
      services: [],
      branches: [],
    };

    // Search Rooms
    if (category === "all" || category === "rooms") {
      results.rooms = await prisma.room.findMany({
        where: {
          OR: [
            { number: { contains: query } },
            { description: { contains: query } },
            { type: { equals: query as any } },
          ],
          ...(minPrice && maxPrice ? { price: { gte: minPrice, lte: maxPrice } } : {}),
        },
        select: {
          id: true,
          number: true,
          type: true,
          price: true,
          status: true,
          floor: true,
          description: true,
          amenities: true,
          images: true,
          branchId: true,
        },
        orderBy: sortBy === "price_asc" ? { price: 'asc' } : sortBy === "price_desc" ? { price: 'desc' } : { number: 'asc' },
        take: limit,
      });
    }

    // Search Menu Items
    if (category === "all" || category === "menu" || category === "dining") {
      results.menuItems = await prisma.menuItem.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { nameKinyarwanda: { contains: query } },
            { description: { contains: query } },
          ],
          available: true,
          ...(minPrice && maxPrice ? { price: { gte: minPrice, lte: maxPrice } } : {}),
        },
        select: {
          id: true,
          name: true,
          nameKinyarwanda: true,
          category: true,
          price: true,
          description: true,
          dietary: true,
          calories: true,
          preparationTime: true,
          images: true,
          rating: true,
          branchId: true,
        },
        orderBy: sortBy === "rating" ? { rating: 'desc' } : { name: 'asc' },
        take: limit,
      });
    }

    // Search Events (upcoming)
    if (category === "all" || category === "events") {
      results.events = await prisma.event.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { hall: { contains: query } },
            { organizerName: { contains: query } },
          ],
          eventDate: { gte: new Date() },
        },
        select: {
          id: true,
          name: true,
          eventNumber: true,
          type: true,
          eventDate: true,
          startTime: true,
          endTime: true,
          hall: true,
          capacity: true,
          expectedGuests: true,
          organizerName: true,
          organizerPhone: true,
          organizerEmail: true,
          venueCharge: true,
          status: true,
          branchId: true,
        },
        orderBy: { eventDate: 'asc' },
        take: Math.floor(limit / 2),
      });
    }

    // Search Services (real-time from database + predefined)
    if (category === "all" || category === "services") {
      const dbServices = await prisma.service.findMany({
        where: {
          OR: [
            { description: { contains: query } },
            { roomNumber: { contains: query } },
            { location: { contains: query } },
          ],
        },
        select: {
          id: true,
          type: true,
          status: true,
          priority: true,
          description: true,
          roomNumber: true,
          location: true,
          requestedAt: true,
          scheduledFor: true,
          completedAt: true,
          rating: true,
          feedback: true,
        },
        take: Math.floor(limit / 2),
      });

      // Add predefined services matching search
      let predefinedServices: any[] = [];
      for (const [key, services] of Object.entries(PREDEFINED_SERVICES)) {
        if (searchTerm.includes(key) || key === 'dining' && (searchTerm.includes('food') || searchTerm.includes('eat'))) {
          predefinedServices = [
            ...predefinedServices,
            ...services.filter((s: any) => 
              s.name.toLowerCase().includes(searchTerm) || 
              s.description.toLowerCase().includes(searchTerm) ||
              s.nameRw.toLowerCase().includes(searchTerm)
            ),
          ];
        }
      }

      // Merge and deduplicate
      results.services = [
        ...predefinedServices,
        ...dbServices.map(s => ({
          id: s.id,
          name: s.type,
          description: s.description,
          price: null,
          duration: null,
          type: s.type,
          status: s.status,
          rating: s.rating,
          category: 'Guest Service',
        })),
      ];
    }

    // Calculate total results
    const totalResults = 
      results.rooms.length + 
      results.menuItems.length + 
      results.events.length + 
      results.services.length + 
      results.branches.length;

    // Generate suggestions based on results
    const suggestions = generateSuggestions(query, results);

    return NextResponse.json({
      success: true,
      timestamp,
      query,
      category,
      totalResults,
      resultsPerCategory: {
        rooms: results.rooms.length,
        menuItems: results.menuItems.length,
        events: results.events.length,
        services: results.services.length,
        branches: results.branches.length,
      },
      suggestions,
      ...results,
      featured: totalResults === 0 ? await getFeaturedItems() : [],
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Search failed", 
        timestamp: new Date().toISOString(),
        rooms: [], 
        menuItems: [], 
        events: [], 
        services: [], 
        branches: [],
        totalResults: 0,
      },
      { status: 500 }
    );
  }
}

// Helper function to get featured items
async function getFeaturedItems() {
  const [featuredRooms, featuredMenu, upcomingEvents] = await Promise.all([
    prisma.room.findMany({
      where: { status: 'AVAILABLE' as any },
      orderBy: { price: 'desc' },
      take: 4,
      select: {
        id: true,
        number: true,
        type: true,
        price: true,
        status: true,
        images: true,
      },
    }),
    prisma.menuItem.findMany({
      where: { available: true },
      orderBy: { rating: 'desc' },
      take: 6,
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        images: true,
        rating: true,
      },
    }),
    prisma.event.findMany({
      where: { eventDate: { gte: new Date() } },
      orderBy: { eventDate: 'asc' },
      take: 3,
      select: {
        id: true,
        name: true,
        eventDate: true,
        hall: true,
        capacity: true,
      },
    }),
  ]);

  return {
    rooms: featuredRooms,
    menu: featuredMenu,
    events: upcomingEvents,
  };
}

// Helper function to generate search suggestions
function generateSuggestions(query: string, results: any) {
  const suggestions: any[] = [];
  const searchTerm = query.toLowerCase();

  // Add category-specific suggestions
  if (results.rooms.length > 0) {
    suggestions.push({ type: 'category', label: 'Rooms', value: 'rooms' });
  }
  if (results.menuItems.length > 0) {
    suggestions.push({ type: 'category', label: 'Dining', value: 'menu' });
  }
  if (results.events.length > 0) {
    suggestions.push({ type: 'category', label: 'Events', value: 'events' });
  }
  if (results.services.length > 0) {
    suggestions.push({ type: 'category', label: 'Services', value: 'services' });
  }

  // Add popular related searches
  const relatedSearches = POPULAR_SEARCHES
    .filter(p => p.term.includes(searchTerm) || searchTerm.includes(p.term))
    .slice(0, 4);
  
  suggestions.push(...relatedSearches.map(p => ({ type: 'search', ...p })));

  return suggestions;
}

// POST /api/public/search - For advanced search with filters
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query, 
      category = "all",
      filters = {},
      sortBy = "relevance",
      page = 1,
      limit = 20,
    } = body;

    const timestamp = new Date().toISOString();

    if (!query?.trim()) {
      return NextResponse.json({
        success: true,
        timestamp,
        results: [],
        pagination: { page, limit, total: 0 },
      });
    }

    // Build dynamic query based on filters
    const searchTerm = query.toLowerCase();
    const skip = (page - 1) * limit;

    // Advanced search logic with filters
    const results = await performAdvancedSearch(query, filters, sortBy, skip, limit);

    return NextResponse.json({
      success: true,
      timestamp,
      query,
      ...results,
      pagination: {
        page,
        limit,
        total: results.total,
        pages: Math.ceil(results.total / limit),
      },
    });
  } catch (error) {
    console.error("Advanced search error:", error);
    return NextResponse.json(
      { success: false, error: "Advanced search failed" },
      { status: 500 }
    );
  }
}

// Advanced search helper function
async function performAdvancedSearch(
  query: string, 
  filters: any, 
  sortBy: string, 
  skip: number, 
  limit: number
) {
  let allResults: any[] = [];
  let total = 0;

  // Search rooms with filters
  if (filters.includeRooms !== false) {
    const rooms = await prisma.room.findMany({
      where: {
        OR: [
          { number: { contains: query } },
          { description: { contains: query } },
        ],
        ...(filters.minPrice ? { price: { gte: filters.minPrice } } : {}),
        ...(filters.maxPrice ? { price: { lte: filters.maxPrice } } : {}),
      },
      select: {
        id: true,
        number: true,
        type: true,
        price: true,
        status: true,
        floor: true,
        description: true,
        amenities: true,
        images: true,
      },
      orderBy: sortBy === "price_asc" ? { price: 'asc' } : sortBy === "price_desc" ? { price: 'desc' } : { number: 'asc' },
      take: limit,
      skip: skip,
    });
    allResults = [...allResults, ...rooms.map(r => ({ ...r, _type: 'room' }))];
  }

  // Search menu items with filters
  if (filters.includeMenu !== false) {
    const menuItems = await prisma.menuItem.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
        available: true,
        ...(filters.category ? { category: filters.category as any } : {}),
        ...(filters.minPrice ? { price: { gte: filters.minPrice } } : {}),
        ...(filters.maxPrice ? { price: { lte: filters.maxPrice } } : {}),
      },
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        description: true,
        dietary: true,
        images: true,
        rating: true,
      },
      take: limit,
      skip: skip,
    });
    allResults = [...allResults, ...menuItems.map(m => ({ ...m, _type: 'menu' }))];
  }

  // Search events
  if (filters.includeEvents !== false) {
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { hall: { contains: query } },
        ],
        ...(filters.eventDate ? { eventDate: { gte: new Date(filters.eventDate) } } : {}),
      },
      select: {
        id: true,
        name: true,
        type: true,
        eventDate: true,
        hall: true,
        capacity: true,
      },
      take: Math.floor(limit / 2),
    });
    allResults = [...allResults, ...events.map(e => ({ ...e, _type: 'event' }))];
  }

  total = allResults.length;

  return {
    results: allResults,
    total,
  };
}
