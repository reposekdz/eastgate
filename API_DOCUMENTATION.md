# EastGate Hotel - Complete API Documentation

## 🎯 All APIs Use Real Database (MySQL via Prisma)

---

## 1. Authentication APIs

### POST `/api/auth/login`
Login staff members
```json
{
  "email": "admin@eastgatehotel.rw",
  "password": "admin123"
}
```

---

## 2. Booking APIs

### GET `/api/bookings`
Fetch bookings with filters
- `?branchId=br-001` - Filter by branch
- `?status=confirmed` - Filter by status
- `?guestEmail=guest@email.com` - Filter by guest

### POST `/api/bookings`
Create new booking
```json
{
  "roomId": "room_id",
  "guestName": "John Doe",
  "guestEmail": "john@email.com",
  "guestPhone": "+250788123456",
  "checkIn": "2026-01-15",
  "checkOut": "2026-01-18",
  "adults": 2,
  "children": 0,
  "totalAmount": 750000,
  "branchId": "br-001"
}
```

### PUT `/api/bookings`
Update booking status

### DELETE `/api/bookings?id=booking_id`
Cancel booking

---

## 3. Room APIs

### GET `/api/rooms`
Fetch rooms
- `?branchId=br-001` - Filter by branch
- `?status=available` - Filter by status
- `?type=deluxe` - Filter by type

### GET `/api/public/rooms`
Public room search with availability
- `?branchId=br-001`
- `?checkIn=2026-01-15`
- `?checkOut=2026-01-18`
- `?type=suite`

### POST `/api/rooms`
Add new room (Manager only)
```json
{
  "number": "301",
  "floor": 3,
  "type": "deluxe",
  "price": 325000,
  "branchId": "br-001"
}
```

### PUT `/api/rooms`
Update room

### DELETE `/api/rooms?id=room_id`
Delete room

---

## 4. Guest APIs

### GET `/api/guests`
Fetch guests with history
- `?branchId=br-001` - Branch filter
- `?search=john` - Search by name/email/phone
- `?includeBookings=true` - Include booking history

### POST `/api/guests`
Register new guest
```json
{
  "name": "Jane Doe",
  "email": "jane@email.com",
  "phone": "+250788123456",
  "nationality": "Rwanda",
  "idType": "passport",
  "idNumber": "P123456",
  "branchId": "br-001"
}
```

### PUT `/api/guests`
Update guest info

### DELETE `/api/guests?id=guest_id`
Delete guest

---

## 5. Staff APIs

### GET `/api/staff`
Fetch staff
- `?branchId=br-001`
- `?role=receptionist`
- `?status=active`

### POST `/api/staff`
Add staff member
```json
{
  "name": "Alice Smith",
  "email": "alice@eastgate.rw",
  "password": "secure123",
  "phone": "+250788123456",
  "role": "receptionist",
  "department": "front_desk",
  "shift": "Morning",
  "branchId": "br-001"
}
```

### PUT `/api/staff`
Update staff

### DELETE `/api/staff?id=staff_id`
Delete staff

---

## 6. Menu APIs

### GET `/api/menu`
Fetch menu items
- `?branchId=br-001`
- `?category=main_course`
- `?available=true`

### POST `/api/menu`
Add menu item
```json
{
  "name": "Grilled Tilapia",
  "category": "main_course",
  "price": 15000,
  "description": "Fresh tilapia with vegetables",
  "vegetarian": false,
  "spicy": false,
  "branchId": "br-001"
}
```

### PUT `/api/menu`
Update menu item

### DELETE `/api/menu?id=menu_id`
Delete menu item

---

## 7. Order APIs

### GET `/api/orders`
Fetch orders
- `?branchId=br-001`
- `?status=pending`
- `?roomId=room_id`

### POST `/api/orders`
Create order
```json
{
  "items": [
    {"id": "item1", "name": "Burger", "price": 8000, "quantity": 2}
  ],
  "total": 16000,
  "guestName": "John Doe",
  "roomId": "room_id",
  "roomCharge": true,
  "branchId": "br-001"
}
```

### PUT `/api/orders`
Update order status

### DELETE `/api/orders?id=order_id`
Cancel order

---

## 8. Spa Service APIs

### GET `/api/services`
Fetch spa services
- `?branchId=br-001`
- `?type=massage`
- `?available=true`

### POST `/api/services`
Add service
```json
{
  "name": "Swedish Massage",
  "type": "massage",
  "price": 50000,
  "duration": 60,
  "description": "Relaxing full body massage",
  "branchId": "br-001"
}
```

### PUT `/api/services`
Update service

### DELETE `/api/services?id=service_id`
Delete service

---

## 9. Message APIs

### GET `/api/messages`
Fetch messages
- `?branchId=br-001`
- `?read=false`

### POST `/api/messages`
Send message
```json
{
  "sender": "guest",
  "senderName": "John Doe",
  "senderEmail": "john@email.com",
  "message": "Need extra towels in room 301",
  "branchId": "br-001"
}
```

### PUT `/api/messages`
Mark as read

---

## 10. Contact APIs

### GET `/api/contacts`
Fetch contact submissions
- `?branchId=br-001`
- `?status=pending`

### POST `/api/contacts`
Submit contact form
```json
{
  "name": "Jane Doe",
  "email": "jane@email.com",
  "phone": "+250788123456",
  "subject": "Inquiry",
  "message": "I'd like to book for a wedding",
  "department": "events",
  "branchId": "br-001"
}
```

### PUT `/api/contacts`
Update status

---

## 11. Payment APIs

### GET `/api/payments`
Fetch payments
- `?branchId=br-001`
- `?bookingId=booking_id`
- `?status=completed`

### POST `/api/payments`
Create payment intent
```json
{
  "bookingId": "booking_id",
  "amount": 250000,
  "currency": "RWF",
  "paymentMethod": "card",
  "gateway": "stripe",
  "branchId": "br-001"
}
```

**Supported Gateways:**
- `stripe` - Credit/Debit cards (Global)
- `flutterwave` - Mobile Money & Cards (Africa)
- `paypal` - PayPal balance & Cards (Global)

### PUT `/api/payments`
Update payment status

### POST `/api/payments/webhook`
Payment confirmation webhook

---

## 12. Branch APIs

### GET `/api/branches`
Fetch all branches
- `?isActive=true`

Returns branch info with counts:
- Total rooms
- Total bookings
- Total staff

---

## 13. Utility APIs

### POST `/api/bookings/release-expired`
Release expired bookings and make rooms available

### POST `/api/rooms/check-availability`
Check room availability for dates
```json
{
  "roomId": "room_id",
  "checkIn": "2026-01-15",
  "checkOut": "2026-01-18"
}
```

---

## 🔐 Role-Based Access

- **Super Admin/Manager**: Access all branches
- **Branch Manager**: Access their branch only
- **Receptionist**: View guests, bookings, rooms
- **Waiter**: View orders, menu
- **Kitchen Staff**: View orders

---

## 💾 Database Schema

All data stored in MySQL via Prisma ORM:
- Branches
- Staff
- Guests
- Rooms
- Bookings
- Orders
- Menu Items
- Services
- Messages
- Contacts
- Payments
- Invoices
- Activity Logs

---

## 🚀 Frontend Integration

All frontend components should fetch from these APIs:

```typescript
// Example: Fetch rooms
const fetchRooms = async () => {
  const res = await fetch('/api/rooms?branchId=br-001');
  const data = await res.json();
  if (data.success) {
    setRooms(data.rooms);
  }
};

// Example: Create booking
const createBooking = async (bookingData) => {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData)
  });
  const data = await res.json();
  return data;
};
```

---

## ✅ All Features Are Real & Functional

✅ Real database operations (MySQL)
✅ Real payment gateways (Stripe, Flutterwave, PayPal)
✅ Real booking system with conflict detection
✅ Real guest history tracking
✅ Real order management
✅ Real messaging system
✅ Real contact forms
✅ Real spa service booking
✅ Branch-based filtering
✅ Role-based access control
