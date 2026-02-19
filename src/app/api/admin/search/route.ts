import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, authOptions } from "@/lib/auth";

// Enhanced admin search with server-side processing
export const dynamic = 'force-dynamic';

// Search result interface
interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  status?: string;
  statusColor?: string;
  amount?: number;
  date?: string;
  link: string;
  data: any;
}

// Parse search query for advanced filters
function parseAdvancedQuery(query: string): { 
  searchTerm: string; 
  filters: Record<string, string> 
} {
  const filters: Record<string, string> = {};
  let searchTerm = query;

  // Extract filters from query (e.g., "john status:pending type:booking")
  const filterRegex = /(\w+):(\S+)/g;
  let match;
  
  while ((match = filterRegex.exec(query)) !== null) {
    filters[match[1].toLowerCase()] = match[2];
    searchTerm = searchTerm.replace(match[0], '').trim();
  }

  return { searchTerm, filters };
}

// GET /api/admin/search - Advanced server-side search for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "all"; // all, bookings, guests, rooms, staff, orders, inventory, payments
    const branchId = searchParams.get("branchId") || session.user.branchId;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!query.trim()) {
      return NextResponse.json({ 
        results: [], 
        total: 0,
        message: "Please enter a search term" 
      });
    }

    const { searchTerm, filters } = parseAdvancedQuery(query);
    const searchLower = searchTerm.toLowerCase();
    const isSuperAdmin = session.user.role === "super_admin" || session.user.role === "super_manager";

    // Build where clauses
    const bookingWhere: any = {
      OR: [
        { guestName: { contains: searchLower } },
        { guestEmail: { contains: searchLower } },
        { guestPhone: { contains: searchLower } },
        { id: { contains: searchLower } },
        { roomNumber: { contains: searchLower } },
        { referenceNumber: { contains: searchLower } },
      ],
    };

    const guestWhere: any = {
      OR: [
        { name: { contains: searchLower } },
        { email: { contains: searchLower } },
        { phone: { contains: searchLower } },
        { id: { contains: searchLower } },
        { idNumber: { contains: searchLower } },
      ],
    };

    const roomWhere: any = {
      OR: [
        { number: { contains: searchLower } },
        { type: { contains: searchLower } },
      ],
    };

    const userWhere: any = {
      OR: [
        { name: { contains: searchLower } },
        { email: { contains: searchLower } },
        { phone: { contains: searchLower } },
        { id: { contains: searchLower } },
      ],
    };

    const orderWhere: any = {
      OR: [
        { id: { contains: searchLower } },
        { guestName: { contains: searchLower } },
        { tableNumber: { contains: searchLower } },
      ],
    };

    // Apply branch filter for non-super admins
    if (!isSuperAdmin && branchId) {
      bookingWhere.branchId = branchId;
      guestWhere.branchId = branchId;
      roomWhere.branchId = branchId;
      userWhere.branchId = branchId;
      orderWhere.branchId = branchId;
    }

    // Apply additional filters
    if (filters.status) {
      bookingWhere.status = filters.status;
      roomWhere.status = filters.status;
      orderWhere.status = filters.status;
    }

    if (filters.type) {
      roomWhere.type = filters.type;
    }

    // Collect results
    const results: SearchResult[] = [];

    // Search Bookings
    if (type === "all" || type === "bookings") {
      const bookings = await prisma.booking.findMany({
        where: bookingWhere,
        include: { branch: true, room: true },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      });

      bookings.forEach((booking: any) => {
        results.push({
          type: "booking",
          id: booking.id,
          title: booking.guestName,
          subtitle: `Room ${booking.roomNumber} • ${booking.checkIn} to ${booking.checkOut}`,
          status: booking.status,
          statusColor: getStatusColor(booking.status),
          amount: booking.totalPrice,
          date: booking.createdAt?.toISOString(),
          link: `/admin/bookings?id=${booking.id}`,
          data: booking,
        });
      });
    }

    // Search Guests
    if (type === "all" || type === "guests") {
      const guests = await prisma.guest.findMany({
        where: guestWhere,
        include: { branch: true },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      });

      guests.forEach((guest: any) => {
        results.push({
          type: "guest",
          id: guest.id,
          title: guest.name,
          subtitle: `${guest.email} • ${guest.phone}`,
          status: guest.isVip ? "VIP" : "Regular",
          statusColor: guest.isVip ? "bg-purple-500" : "bg-gray-500",
          date: guest.createdAt?.toISOString(),
          link: `/admin/guests?id=${guest.id}`,
          data: guest,
        });
      });
    }

    // Search Rooms
    if (type === "all" || type === "rooms") {
      const rooms = await prisma.room.findMany({
        where: roomWhere,
        include: { branch: true },
        take: limit,
        skip: offset,
        orderBy: { number: 'asc' },
      });

      rooms.forEach((room: any) => {
        results.push({
          type: "room",
          id: room.id,
          title: `Room ${room.number}`,
          subtitle: `${room.type} • Floor ${room.floor} • ${formatPrice(room.price)}`,
          status: room.status,
          statusColor: getRoomStatusColor(room.status),
          amount: room.price,
          date: room.updatedAt?.toISOString(),
          link: `/admin/rooms?id=${room.id}`,
          data: room,
        });
      });
    }

    // Search Staff (Users)
    if (type === "all" || type === "staff") {
      const users = await prisma.user.findMany({
        where: userWhere,
        include: { branch: true },
        take: limit,
        skip: offset,
        orderBy: { name: 'asc' },
      });

      users.forEach((user: any) => {
        results.push({
          type: "staff",
          id: user.id,
          title: user.name || user.email,
          subtitle: `${user.role} • ${user.branch?.name || 'No Branch'}`,
          status: user.role,
          statusColor: getRoleColor(user.role),
          date: user.createdAt?.toISOString(),
          link: `/admin/staff?id=${user.id}`,
          data: user,
        });
      });
    }

    // Search Orders
    if (type === "all" || type === "orders") {
      const orders = await prisma.order.findMany({
        where: orderWhere,
        include: { branch: true },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      });

      orders.forEach((order: any) => {
        results.push({
          type: "order",
          id: order.id,
          title: `Order #${order.id.slice(-6)}`,
          subtitle: `${order.guestName || 'Guest'} • Table ${order.tableNumber || 'N/A'}`,
          status: order.status,
          statusColor: getOrderStatusColor(order.status),
          amount: order.totalAmount,
          date: order.createdAt?.toISOString(),
          link: `/admin/restaurant?orderId=${order.id}`,
          data: order,
        });
      });
    }

    // Search Inventory/Stock
    if (type === "all" || type === "inventory") {
      const inventory = await prisma.stockItem.findMany({
        where: {
          OR: [
            { name: { contains: searchLower } },
            { sku: { contains: searchLower } },
            { category: { contains: searchLower } },
          ],
          ...(!isSuperAdmin && branchId ? { branchId } : {}),
        },
        include: { branch: true },
        take: limit,
        skip: offset,
        orderBy: { name: 'asc' },
      });

      inventory.forEach((item: any) => {
        const isLowStock = item.quantity <= item.minQuantity;
        results.push({
          type: "inventory",
          id: item.id,
          title: item.name,
          subtitle: `${item.category} • SKU: ${item.sku}`,
          status: isLowStock ? "Low Stock" : "In Stock",
          statusColor: isLowStock ? "bg-red-500" : "bg-green-500",
          amount: item.quantity,
          date: item.updatedAt?.toISOString(),
          link: `/admin/inventory?id=${item.id}`,
          data: item,
        });
      });
    }

    // Search Payments
    if (type === "all" || type === "payments") {
      const payments = await prisma.payment.findMany({
        where: {
          OR: [
            { id: { contains: searchLower } },
            { transactionId: { contains: searchLower } },
          ],
          ...(!isSuperAdmin && branchId ? { branchId } : {}),
        },
        include: { 
          branch: true,
          booking: {
            include: { guest: true }
          }
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      });

      payments.forEach((payment: any) => {
        const guestName = payment.booking?.guest?.name || payment.booking?.guestName || 'Guest';
        results.push({
          type: "payment",
          id: payment.id,
          title: `Payment #${payment.id.slice(-6)}`,
          subtitle: `${guestName} • ${payment.method}`,
          status: payment.status,
          statusColor: getPaymentStatusColor(payment.status),
          amount: payment.amount,
          date: payment.createdAt?.toISOString(),
          link: `/admin/payments?id=${payment.id}`,
          data: payment,
        });
      });
    }

    // Sort results by relevance (exact matches first, then by date)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === searchLower;
      const bExact = b.title.toLowerCase() === searchLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    });

    // Group by type for better display
    const groupedResults = results.reduce((acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = [];
      }
      acc[result.type].push(result);
      return acc;
    }, {} as Record<string, SearchResult[]>);

    return NextResponse.json({
      results,
      groupedResults,
      total: results.length,
      query: searchTerm,
      filters,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Admin search error:", error);
    return NextResponse.json(
      { error: "Search failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Helper functions
function getStatusColor(status: string | undefined): string {
  const colors: Record<string, string> = {
    confirmed: "bg-green-500",
    pending: "bg-yellow-500",
    cancelled: "bg-red-500",
    checked_in: "bg-blue-500",
    checked_out: "bg-gray-500",
  };
  return colors[status || ""] || "bg-gray-500";
}

function getRoomStatusColor(status: string | undefined): string {
  const colors: Record<string, string> = {
    available: "bg-green-500",
    occupied: "bg-red-500",
    maintenance: "bg-yellow-500",
    cleaning: "bg-blue-500",
    reserved: "bg-purple-500",
  };
  return colors[status || ""] || "bg-gray-500";
}

function getOrderStatusColor(status: string | undefined): string {
  const colors: Record<string, string> = {
    pending: "bg-yellow-500",
    preparing: "bg-blue-500",
    ready: "bg-green-500",
    served: "bg-purple-500",
    cancelled: "bg-red-500",
  };
  return colors[status || ""] || "bg-gray-500";
}

function getPaymentStatusColor(status: string | undefined): string {
  const colors: Record<string, string> = {
    completed: "bg-green-500",
    pending: "bg-yellow-500",
    failed: "bg-red-500",
    refunded: "bg-purple-500",
  };
  return colors[status || ""] || "bg-gray-500";
}

function getRoleColor(role: string | undefined): string {
  const colors: Record<string, string> = {
    super_admin: "bg-red-500",
    super_manager: "bg-orange-500",
    branch_manager: "bg-blue-500",
    receptionist: "bg-green-500",
    waiter: "bg-purple-500",
    chef: "bg-yellow-500",
    kitchen_staff: "bg-amber-500",
    housekeeping: "bg-pink-500",
  };
  return colors[role || ""] || "bg-gray-500";
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-RW', { 
    style: 'currency', 
    currency: 'RWF',
    minimumFractionDigits: 0 
  }).format(price || 0);
}
