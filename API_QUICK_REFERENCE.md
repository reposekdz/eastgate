# 🚀 EastGate Hotel API Quick Reference

## 📍 Base URL
```
Development: http://localhost:3000/api
Production: https://eastgate.rw/api
```

---

## 🛏️ Rooms API

### GET /api/public/rooms
Fetch available rooms with filtering

**Query Parameters:**
```
?status=available          # Filter by status
&type=deluxe              # Filter by room type
&branchId=br-kigali-main  # Filter by branch
&minPrice=100000          # Minimum price
&maxPrice=500000          # Maximum price
&maxOccupancy=2           # Minimum capacity
&search=suite             # Search term
&page=1                   # Page number
&limit=6                  # Items per page
&sortBy=price             # Sort field
&sortOrder=asc            # Sort direction
```

**Response:**
```json
{
  "success": true,
  "message": "Rooms retrieved successfully",
  "data": {
    "rooms": [...],
    "pagination": {
      "page": 1,
      "limit": 6,
      "total": 36,
      "pages": 6
    }
  }
}
```

---

## 📅 Bookings API

### GET /api/bookings
Fetch bookings with filters

**Query Parameters:**
```
?status=confirmed
&branchId=br-kigali-main
&roomId=room-id
&guestEmail=john@example.com
&checkInFrom=2026-02-01
&checkInTo=2026-02-28
&search=john
&page=1
&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [...],
    "stats": {
      "total": 150,
      "pending": 20,
      "confirmed": 50,
      "checked_in": 30,
      "checked_out": 40,
      "cancelled": 10,
      "totalRevenue": 45000000
    },
    "pagination": {...}
  }
}
```

### POST /api/bookings
Create new booking

**Request Body:**
```json
{
  "roomId": "room-id",
  "guestName": "John Doe",
  "guestEmail": "john@example.com",
  "guestPhone": "+250788123456",
  "checkIn": "2026-02-01",
  "checkOut": "2026-02-05",
  "adults": 2,
  "children": 1,
  "specialRequests": "Late check-in",
  "branchId": "br-kigali-main"
}
```

### PUT /api/bookings
Update booking

**Request Body:**
```json
{
  "id": "booking-id",
  "status": "confirmed",
  "checkIn": "2026-02-02",
  "adults": 3
}
```

### DELETE /api/bookings?id=booking-id&reason=Guest%20cancelled
Cancel booking

---

## 🍽️ Orders API

### GET /api/orders
Fetch orders with filters

**Query Parameters:**
```
?status=pending
&branchId=br-kigali-main
&roomId=room-id
&tableNumber=5
&startDate=2026-02-01
&endDate=2026-02-28
&search=chicken
&page=1
&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "stats": {
      "total": 200,
      "pending": 15,
      "preparing": 10,
      "ready": 5,
      "served": 165,
      "cancelled": 5
    },
    "pagination": {...}
  }
}
```

### POST /api/orders
Create new order

**Request Body:**
```json
{
  "items": [
    {
      "menuItemId": "menu-item-id",
      "quantity": 2,
      "notes": "No onions"
    }
  ],
  "guestName": "John Doe",
  "roomId": "room-id",
  "tableNumber": 5,
  "roomCharge": false,
  "notes": "Urgent",
  "branchId": "br-kigali-main"
}
```

### PUT /api/orders
Update order status

**Request Body:**
```json
{
  "id": "order-id",
  "status": "preparing",
  "notes": "Started cooking"
}
```

### DELETE /api/orders?id=order-id
Cancel order

---

## 🍴 Menu API

### GET /api/menu
Fetch menu items with filters

**Query Parameters:**
```
?category=Lunch
&branchId=br-kigali-main
&available=true
&popular=true
&vegetarian=true
&vegan=false
&glutenFree=true
&spicy=true
&minPrice=10000
&maxPrice=50000
&search=chicken
&page=1
&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": {
    "menuItems": [...],
    "categories": [
      { "name": "Breakfast", "count": 15 },
      { "name": "Lunch", "count": 25 }
    ],
    "stats": {
      "total": 80,
      "avgPrice": 25000,
      "minPrice": 8000,
      "maxPrice": 85000
    },
    "pagination": {...}
  }
}
```

### POST /api/menu
Create menu item

**Request Body:**
```json
{
  "name": "Grilled Chicken",
  "category": "Lunch",
  "price": 35000,
  "description": "Tender grilled chicken",
  "imageUrl": "https://...",
  "branchId": "br-kigali-main",
  "available": true,
  "vegetarian": false,
  "spicy": true,
  "spicyLevel": 2,
  "prepTime": 20,
  "calories": 450
}
```

---

## 👥 Guests API

### GET /api/guests
Fetch guests with filters

**Query Parameters:**
```
?branchId=br-kigali-main
&loyaltyTier=gold
&isVip=true
&nationality=Rwanda
&search=john
&page=1
&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": {
    "guests": [...],
    "stats": {
      "total": 500,
      "vip": 50,
      "bronze": 200,
      "silver": 150,
      "gold": 80,
      "platinum": 20,
      "topNationalities": [
        { "nationality": "Rwanda", "count": 300 },
        { "nationality": "Kenya", "count": 100 }
      ]
    },
    "pagination": {...}
  }
}
```

### POST /api/guests
Create guest

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+250788123456",
  "nationality": "Rwanda",
  "idType": "National ID",
  "idNumber": "1234567890123456",
  "branchId": "br-kigali-main"
}
```

---

## 🏢 Branches

### Branch IDs
```
br-kigali-main    # Kigali Main (Flagship)
br-ngoma          # Ngoma Branch
br-kirehe         # Kirehe Branch
br-gatsibo        # Gatsibo Branch
```

---

## 📊 Common Response Codes

```
200 - Success
201 - Created
400 - Bad Request (Validation Error)
401 - Unauthorized
403 - Forbidden
404 - Not Found
409 - Conflict (e.g., room already booked)
500 - Internal Server Error
```

---

## 🔍 Search Tips

All search parameters support:
- Case-insensitive matching
- Partial matching
- Multiple field search

Example:
```
?search=john
# Searches in: name, email, phone, booking ref, etc.
```

---

## 📄 Pagination

Default pagination:
```
page: 1
limit: 50
max limit: 100
```

Response includes:
```json
{
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

---

## 🎯 Sorting

Available sort fields:
- `createdAt` (default)
- `updatedAt`
- `name`
- `price`
- `status`
- `checkIn`
- `total`

Sort order:
- `asc` - Ascending
- `desc` - Descending (default)

Example:
```
?sortBy=price&sortOrder=asc
```

---

## 💡 Pro Tips

1. **Always include branchId** for branch-specific data
2. **Use pagination** for large datasets
3. **Combine filters** for precise results
4. **Use search** for quick lookups
5. **Check stats** for analytics

---

## 🛠️ Error Handling

All errors follow this structure:
```json
{
  "success": false,
  "error": "Error message",
  "details": {
    "field": "Specific error details"
  }
}
```

---

## 📞 Support

For API issues or questions:
- Email: dev@eastgate.rw
- Docs: https://eastgate.rw/docs/api
- GitHub: https://github.com/eastgate/hotel

---

**Version:** 2.0.0  
**Last Updated:** January 2026
