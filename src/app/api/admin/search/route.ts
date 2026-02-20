import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || "all";
  const status = searchParams.get("status") || "all";

  // Mock data - replace with actual database queries
  const allBookings = [
    { id: "bk-001", guestName: "John Doe", roomNumber: "101", checkIn: "2024-01-15", checkOut: "2024-01-20", status: "confirmed", amount: 750 },
    { id: "bk-002", guestName: "Jane Smith", roomNumber: "201", checkIn: "2024-01-16", checkOut: "2024-01-18", status: "pending", amount: 600 },
  ];

  const allGuests = [
    { id: "g-001", name: "John Doe", email: "john@example.com", phone: "+250 788 111 222", nationality: "Rwanda", visits: 5 },
    { id: "g-002", name: "Jane Smith", email: "jane@example.com", phone: "+250 788 333 444", nationality: "Kenya", visits: 2 },
  ];

  const allRooms = [
    { id: "r-101", number: "101", type: "DELUXE", status: "available", floor: 1, price: 150 },
    { id: "r-201", number: "201", type: "EXECUTIVE_SUITE", status: "occupied", floor: 2, price: 300 },
  ];

  const allStaff = [
    { id: "u-005", name: "Grace Uwase", email: "grace@eastgate.rw", role: "receptionist", branchName: "Kigali Main" },
    { id: "u-006", name: "Patrick Bizimana", email: "patrick@eastgate.rw", role: "waiter", branchName: "Kigali Main" },
  ];

  const allOrders = [
    { id: "o-001", guestName: "John Doe", items: "Grilled Chicken, Caesar Salad", status: "preparing", amount: 37, date: "2024-01-15T12:30:00" },
    { id: "o-002", guestName: "Jane Smith", items: "Pasta, Wine", status: "ready", amount: 45, date: "2024-01-15T13:00:00" },
  ];

  const allInventory = [
    { id: "inv-001", name: "Towels", category: "Linens", quantity: 150, status: "in stock" },
    { id: "inv-002", name: "Shampoo", category: "Toiletries", quantity: 20, status: "low stock" },
  ];

  const allPayments = [
    { id: "pay-001", guestName: "John Doe", method: "Credit Card", amount: 750, status: "completed", date: "2024-01-15T10:00:00" },
    { id: "pay-002", guestName: "Jane Smith", method: "Cash", amount: 600, status: "pending", date: "2024-01-16T09:00:00" },
  ];

  const allEvents = [
    { id: "ev-001", name: "Corporate Conference", type: "CONFERENCE", date: "2024-02-10", hall: "Conference Hall A", capacity: 100 },
  ];

  // Filter by query
  const lowerQuery = query.toLowerCase();
  
  const filterBookings = () => allBookings.filter(b => 
    b.guestName.toLowerCase().includes(lowerQuery) ||
    b.roomNumber.includes(lowerQuery) ||
    b.id.toLowerCase().includes(lowerQuery)
  ).filter(b => status === "all" || b.status === status);

  const filterGuests = () => allGuests.filter(g => 
    g.name.toLowerCase().includes(lowerQuery) ||
    g.email.toLowerCase().includes(lowerQuery) ||
    g.phone.includes(lowerQuery)
  );

  const filterRooms = () => allRooms.filter(r => 
    r.number.includes(lowerQuery) ||
    r.type.toLowerCase().includes(lowerQuery)
  ).filter(r => status === "all" || r.status === status);

  const filterStaff = () => allStaff.filter(s => 
    s.name.toLowerCase().includes(lowerQuery) ||
    s.email.toLowerCase().includes(lowerQuery) ||
    s.role.toLowerCase().includes(lowerQuery)
  );

  const filterOrders = () => allOrders.filter(o => 
    o.guestName.toLowerCase().includes(lowerQuery) ||
    o.items.toLowerCase().includes(lowerQuery)
  ).filter(o => status === "all" || o.status === status);

  const filterInventory = () => allInventory.filter(i => 
    i.name.toLowerCase().includes(lowerQuery) ||
    i.category.toLowerCase().includes(lowerQuery)
  ).filter(i => status === "all" || i.status === status);

  const filterPayments = () => allPayments.filter(p => 
    p.guestName.toLowerCase().includes(lowerQuery) ||
    p.method.toLowerCase().includes(lowerQuery)
  ).filter(p => status === "all" || p.status === status);

  const filterEvents = () => allEvents.filter(e => 
    e.name.toLowerCase().includes(lowerQuery) ||
    e.type.toLowerCase().includes(lowerQuery)
  );

  // Build results based on type filter
  const results: any[] = [];

  if (type === "all" || type === "booking") {
    filterBookings().forEach(b => results.push({
      type: "booking",
      id: b.id,
      title: `Booking ${b.id}`,
      subtitle: `${b.guestName} • Room ${b.roomNumber}`,
      status: b.status,
      amount: b.amount,
      date: b.checkIn,
      data: b,
    }));
  }

  if (type === "all" || type === "guest") {
    filterGuests().forEach(g => results.push({
      type: "guest",
      id: g.id,
      title: g.name,
      subtitle: `${g.email} • ${g.visits} visits`,
      data: g,
    }));
  }

  if (type === "all" || type === "room") {
    filterRooms().forEach(r => results.push({
      type: "room",
      id: r.id,
      title: `Room ${r.number}`,
      subtitle: `${r.type} • Floor ${r.floor}`,
      status: r.status,
      amount: r.price,
      data: r,
    }));
  }

  if (type === "all" || type === "staff") {
    filterStaff().forEach(s => results.push({
      type: "staff",
      id: s.id,
      title: s.name,
      subtitle: `${s.role} • ${s.branchName}`,
      data: s,
    }));
  }

  if (type === "all" || type === "order") {
    filterOrders().forEach(o => results.push({
      type: "order",
      id: o.id,
      title: `Order ${o.id}`,
      subtitle: `${o.guestName} • ${o.items}`,
      status: o.status,
      amount: o.amount,
      date: o.date,
      data: o,
    }));
  }

  if (type === "all" || type === "inventory") {
    filterInventory().forEach(i => results.push({
      type: "inventory",
      id: i.id,
      title: i.name,
      subtitle: `${i.category} • Qty: ${i.quantity}`,
      status: i.status,
      data: i,
    }));
  }

  if (type === "all" || type === "payment") {
    filterPayments().forEach(p => results.push({
      type: "payment",
      id: p.id,
      title: `Payment ${p.id}`,
      subtitle: `${p.guestName} • ${p.method}`,
      status: p.status,
      amount: p.amount,
      date: p.date,
      data: p,
    }));
  }

  if (type === "all" || type === "event") {
    filterEvents().forEach(e => results.push({
      type: "event",
      id: e.id,
      title: e.name,
      subtitle: `${e.type} • ${e.hall}`,
      date: e.date,
      data: e,
    }));
  }

  return NextResponse.json({
    success: true,
    results,
    totalCount: results.length,
    timestamp: new Date().toISOString(),
  });
}
