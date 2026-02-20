# 📡 EastGate Hotel - API Documentation

## Base URL
```
Development: http://localhost:3000/api
Production: https://eastgate.rw/api
```

## Authentication
All protected endpoints require authentication via NextAuth session or JWT token.

```typescript
// Headers
Authorization: Bearer <token>
Cookie: next-auth.session-token=<session>
```

---

## 🔐 Authentication Endpoints

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "eastgate@gmail.com",
  "password": "2026"
}

Response 200:
{
  "user": {
    "id": "user-id",
    "name": "EastGate Admin",
    "email": "eastgate@gmail.com",
    "role": "super_admin",
    "branchId": "br-001"
  },
  "token": "jwt-token"
}
```

### Logout
```http
POST /api/auth/logout

Response 200:
{
  "success": true
}
```

### Change Password
```http
POST /api/auth/change-password
Content-Type: application/json

{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}

Response 200:
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

## 🏨 Booking Endpoints

### Get All Bookings
```http
GET /api/bookings?branchId=br-001&status=CONFIRMED&startDate=2026-01-01

Response 200:
[
  {
    "id": "booking-id",
    "bookingNumber": "BK-2024001",
    "guest": {
      "firstName": "Sarah",
      "lastName": "Mitchell",
      "email": "sarah@email.com"
    },
    "room": {
      "number": "101",
      "type": "DELUXE"
    },
    "checkInDate": "2026-02-10",
    "checkOutDate": "2026-02-14",
    "status": "CONFIRMED",
    "totalAmount": 1300000,
    "paymentStatus": "PAID"
  }
]
```

### Create Booking
```http
POST /api/bookings
Content-Type: application/json

{
  "guestInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@email.com",
    "phone": "+250 788 123 456",
    "nationality": "Rwanda",
    "idType": "National ID",
    "idNumber": "1234567890123456"
  },
  "roomId": "room-id",
  "checkInDate": "2026-03-01",
  "checkOutDate": "2026-03-05",
  "adults": 2,
  "children": 0,
  "specialRequests": "Late check-in",
  "paymentMethod": "CARD",
  "source": "ONLINE"
}

Response 201:
{
  "id": "booking-id",
  "bookingNumber": "BK-2024010",
  "status": "CONFIRMED",
  "totalAmount": 1300000
}
```

### Get Booking by ID
```http
GET /api/bookings/[id]

Response 200:
{
  "id": "booking-id",
  "bookingNumber": "BK-2024001",
  "guest": { ... },
  "room": { ... },
  "payments": [ ... ],
  "services": [ ... ]
}
```

### Update Booking
```http
PUT /api/bookings/[id]
Content-Type: application/json

{
  "status": "CHECKED_IN",
  "actualCheckIn": "2026-02-10T14:30:00Z"
}

Response 200:
{
  "id": "booking-id",
  "status": "CHECKED_IN"
}
```

### Check-In
```http
POST /api/bookings/[id]/check-in

Response 200:
{
  "success": true,
  "booking": { ... }
}
```

### Check-Out
```http
POST /api/bookings/[id]/check-out

Response 200:
{
  "success": true,
  "finalBill": {
    "roomCharges": 1300000,
    "serviceCharges": 50000,
    "tax": 243000,
    "total": 1593000
  }
}
```

### Cancel Booking
```http
POST /api/bookings/[id]/cancel
Content-Type: application/json

{
  "reason": "Customer request",
  "refundAmount": 1300000
}

Response 200:
{
  "success": true,
  "refundId": "refund-id"
}
```

---

## 👤 Guest Endpoints

### Get All Guests
```http
GET /api/guests?branchId=br-001&search=sarah

Response 200:
[
  {
    "id": "guest-id",
    "firstName": "Sarah",
    "lastName": "Mitchell",
    "email": "sarah@email.com",
    "phone": "+1 555-0101",
    "loyaltyTier": "PLATINUM",
    "loyaltyPoints": 15200,
    "totalStays": 12,
    "totalSpent": 37050000
  }
]
```

### Create Guest
```http
POST /api/guests
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@email.com",
  "phone": "+250 788 999 888",
  "nationality": "USA",
  "idType": "Passport",
  "idNumber": "US987654",
  "branchId": "br-001"
}

Response 201:
{
  "id": "guest-id",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

### Get Guest History
```http
GET /api/guests/[id]/history

Response 200:
{
  "guest": { ... },
  "bookings": [ ... ],
  "totalSpent": 5000000,
  "averageStayDuration": 3.5,
  "preferredRoomType": "DELUXE"
}
```

### Get Guest Loyalty
```http
GET /api/guests/[id]/loyalty

Response 200:
{
  "tier": "PLATINUM",
  "points": 15200,
  "nextTier": "DIAMOND",
  "pointsToNextTier": 4800,
  "benefits": [
    "Free room upgrade",
    "Late checkout",
    "Welcome drink"
  ]
}
```

---

## 🛏️ Room Endpoints

### Get All Rooms
```http
GET /api/rooms?branchId=br-001&status=AVAILABLE&type=DELUXE

Response 200:
[
  {
    "id": "room-id",
    "roomNumber": "101",
    "type": "DELUXE",
    "status": "AVAILABLE",
    "floor": 1,
    "basePrice": 325000,
    "currentPrice": 325000,
    "maxOccupancy": 2,
    "amenities": ["WiFi", "TV", "AC", "Mini Bar"]
  }
]
```

### Get Room Availability
```http
GET /api/rooms/availability?branchId=br-001&checkIn=2026-03-01&checkOut=2026-03-05&type=DELUXE

Response 200:
{
  "available": true,
  "rooms": [
    {
      "id": "room-id",
      "roomNumber": "102",
      "price": 325000
    }
  ],
  "totalAvailable": 15
}
```

### Update Room Status
```http
POST /api/rooms/[id]/status
Content-Type: application/json

{
  "status": "CLEANING"
}

Response 200:
{
  "id": "room-id",
  "status": "CLEANING"
}
```

---

## 💳 Payment Endpoints

### Process Payment
```http
POST /api/payments/process
Content-Type: application/json

{
  "amount": 325000,
  "method": "CARD",
  "branchId": "br-001",
  "bookingId": "booking-id",
  "currency": "RWF",
  "description": "Room payment"
}

Response 201:
{
  "id": "payment-id",
  "transactionId": "TXN-123456",
  "amount": 325000,
  "status": "PAID",
  "processedAt": "2026-02-10T15:30:00Z"
}
```

### Get Payment History
```http
GET /api/payments?branchId=br-001&startDate=2026-01-01&endDate=2026-01-31

Response 200:
{
  "payments": [
    {
      "id": "payment-id",
      "transactionId": "TXN-123456",
      "amount": 325000,
      "method": "CARD",
      "status": "PAID",
      "booking": { ... }
    }
  ],
  "summary": {
    "total": 50,
    "totalAmount": 16250000,
    "byMethod": {
      "CARD": 10000000,
      "MOBILE_MONEY": 5000000,
      "CASH": 1250000
    }
  }
}
```

### Refund Payment
```http
POST /api/payments/refund
Content-Type: application/json

{
  "paymentId": "payment-id",
  "amount": 325000,
  "reason": "Booking cancelled"
}

Response 200:
{
  "success": true,
  "refundId": "refund-id",
  "amount": 325000
}
```

---

## 🍽️ Order Endpoints

### Get All Orders
```http
GET /api/orders?branchId=br-001&status=PENDING

Response 200:
[
  {
    "id": "order-id",
    "orderNumber": "ORD-001",
    "type": "DINE_IN",
    "tableNumber": "5",
    "items": [
      {
        "menuItem": {
          "name": "Grilled Tilapia",
          "price": 23400
        },
        "quantity": 2,
        "subtotal": 46800
      }
    ],
    "subtotal": 46800,
    "tax": 8424,
    "total": 55224,
    "status": "PREPARING"
  }
]
```

### Create Order
```http
POST /api/orders
Content-Type: application/json

{
  "type": "DINE_IN",
  "tableNumber": "5",
  "items": [
    {
      "menuItemId": "menu-item-id",
      "quantity": 2,
      "notes": "No onions"
    }
  ],
  "branchId": "br-001"
}

Response 201:
{
  "id": "order-id",
  "orderNumber": "ORD-002",
  "total": 55224
}
```

### Update Order Status
```http
POST /api/orders/[id]/status
Content-Type: application/json

{
  "status": "READY"
}

Response 200:
{
  "id": "order-id",
  "status": "READY"
}
```

---

## 👥 Staff Endpoints

### Get All Staff
```http
GET /api/staff?branchId=br-001&role=receptionist

Response 200:
[
  {
    "id": "staff-id",
    "firstName": "Grace",
    "lastName": "Uwase",
    "email": "grace@eastgate.rw",
    "role": "receptionist",
    "branchId": "br-001",
    "phone": "+250 788 200 002",
    "salary": 800000,
    "isActive": true
  }
]
```

### Create Staff
```http
POST /api/staff
Content-Type: application/json

{
  "firstName": "New",
  "lastName": "Staff",
  "email": "newstaff@eastgate.rw",
  "password": "password123",
  "role": "waiter",
  "branchId": "br-001",
  "phone": "+250 788 999 999",
  "salary": 600000
}

Response 201:
{
  "id": "staff-id",
  "firstName": "New",
  "lastName": "Staff"
}
```

### Get Staff Shifts
```http
GET /api/staff/[id]/shifts?month=2026-02

Response 200:
[
  {
    "id": "shift-id",
    "date": "2026-02-10",
    "startTime": "08:00",
    "endTime": "16:00",
    "type": "MORNING",
    "status": "COMPLETED"
  }
]
```

---

## 📊 Analytics Endpoints

### Dashboard Analytics
```http
GET /api/analytics/dashboard?branchId=br-001

Response 200:
{
  "kpis": {
    "totalRevenue": 3702750000,
    "revenueChange": 12.5,
    "occupancyRate": 78,
    "occupancyChange": 3.2,
    "adr": 500500,
    "revpar": 390000
  },
  "revenueByCategory": {
    "rooms": 2145000000,
    "restaurant": 650000000,
    "events": 450000000,
    "spa": 200000000
  },
  "todayActivity": {
    "checkIns": 15,
    "checkOuts": 12,
    "newBookings": 8,
    "activeOrders": 23
  }
}
```

### Revenue Analytics
```http
GET /api/analytics/revenue?branchId=br-001&period=monthly&year=2026

Response 200:
{
  "monthly": [
    {
      "month": "January",
      "rooms": 546000000,
      "restaurant": 169000000,
      "events": 110500000,
      "total": 825500000
    }
  ],
  "yearToDate": 5775000000,
  "growth": 12.5
}
```

### Occupancy Analytics
```http
GET /api/analytics/occupancy?branchId=br-001&period=daily&days=30

Response 200:
{
  "daily": [
    {
      "date": "2026-02-10",
      "occupancyRate": 78,
      "occupiedRooms": 94,
      "totalRooms": 120
    }
  ],
  "average": 76.5,
  "peak": 92,
  "low": 65
}
```

---

## 🎫 Event Endpoints

### Get All Events
```http
GET /api/events?branchId=br-001&status=upcoming

Response 200:
[
  {
    "id": "event-id",
    "eventNumber": "EV-001",
    "name": "Kigali Tech Summit",
    "type": "CONFERENCE",
    "eventDate": "2026-02-20",
    "attendees": 380,
    "venue": "Grand Ballroom",
    "status": "UPCOMING",
    "totalAmount": 58500000
  }
]
```

### Create Event
```http
POST /api/events
Content-Type: application/json

{
  "name": "Corporate Meeting",
  "type": "CORPORATE",
  "branchId": "br-001",
  "clientName": "ABC Company",
  "clientEmail": "contact@abc.com",
  "clientPhone": "+250 788 111 222",
  "eventDate": "2026-03-15",
  "startTime": "09:00",
  "endTime": "17:00",
  "attendees": 50,
  "venue": "Conference Room A",
  "totalAmount": 5000000
}

Response 201:
{
  "id": "event-id",
  "eventNumber": "EV-010"
}
```

---

## 🔔 Notification Endpoints

### Get Notifications
```http
GET /api/notifications?recipientId=user-id&isRead=false

Response 200:
[
  {
    "id": "notification-id",
    "type": "BOOKING",
    "title": "New Booking",
    "message": "New booking received for Room 101",
    "isRead": false,
    "createdAt": "2026-02-10T10:30:00Z"
  }
]
```

### Mark as Read
```http
PUT /api/notifications/[id]
Content-Type: application/json

{
  "isRead": true
}

Response 200:
{
  "success": true
}
```

---

## 📦 Inventory Endpoints

### Get Inventory
```http
GET /api/manager/inventory?branchId=br-001

Response 200:
[
  {
    "id": "inventory-id",
    "itemName": "Bed Sheets",
    "category": "LINENS",
    "quantity": 500,
    "minStock": 100,
    "maxStock": 800,
    "unitCost": 15000,
    "status": "IN_STOCK"
  }
]
```

### Update Stock
```http
PUT /api/manager/inventory/[id]
Content-Type: application/json

{
  "quantity": 550,
  "lastRestocked": "2026-02-10"
}

Response 200:
{
  "success": true
}
```

---

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## 📝 Rate Limiting

- **Rate Limit**: 100 requests per minute per IP
- **Headers**:
  - `X-RateLimit-Limit`: 100
  - `X-RateLimit-Remaining`: 95
  - `X-RateLimit-Reset`: 1234567890

---

## 🔒 Security

- All endpoints use HTTPS in production
- JWT tokens expire after 7 days
- Passwords are hashed with bcrypt (10 rounds)
- SQL injection prevention via Prisma ORM
- XSS protection enabled
- CSRF tokens for state-changing operations

---

## 📞 Support

For API support:
- Email: api@eastgate.rw
- Documentation: https://docs.eastgate.rw
- Status: https://status.eastgate.rw

---

**© 2026 EastGate Hotel Rwanda. All rights reserved.**
