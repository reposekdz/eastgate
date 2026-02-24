# EastGate Hotel - Advanced API Documentation

## 🚀 Complete API Endpoints

### 1. **Rooms API** - `/api/public/rooms`

#### GET - Fetch Rooms (Advanced Filtering)
```
GET /api/public/rooms?type=deluxe&status=available&branchId=br-001&minPrice=100&maxPrice=500&search=suite&page=1&limit=10&sortBy=price&sortOrder=asc
```

**Query Parameters:**
- `type` - Room type (standard, deluxe, family, executive_suite, presidential_suite)
- `status` - Room status (available, occupied, maintenance, cleaning)
- `branchId` - Filter by branch
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `maxOccupancy` - Minimum guest capacity
- `search` - Search in number, type, description
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sortBy` - Sort field (price, number, type)
- `sortOrder` - Sort direction (asc, desc)

**Response:**
```json
{
  "success": true,
  "rooms": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

#### POST - Create Room
```json
{
  "number": "501",
  "floor": 5,
  "type": "presidential_suite",
  "price": 599,
  "description": "Luxury presidential suite",
  "imageUrl": "https://...",
  "branchId": "br-001",
  "maxOccupancy": 4,
  "bedType": "king",
  "size": 85,
  "amenities": ["Wi-Fi", "Smart TV", "Jacuzzi"]
}
```

---

### 2. **Room Analytics API** - `/api/analytics/rooms`

#### GET - Room Analytics & Insights
```
GET /api/analytics/rooms?branchId=br-001&startDate=2026-01-01&endDate=2026-12-31
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "overview": {
      "totalRooms": 120,
      "availableRooms": 45,
      "occupiedRooms": 65,
      "maintenanceRooms": 10,
      "occupancyRate": "54.17",
      "availabilityRate": "37.50"
    },
    "bookings": {
      "total": 1250,
      "revenue": 450000,
      "avgRoomPrice": 185.50
    },
    "roomsByType": [...],
    "recentBookings": [...]
  }
}
```

---

### 3. **Availability Check API** - `/api/bookings/availability`

#### POST - Real-time Availability Check
```json
{
  "checkIn": "2026-06-15",
  "checkOut": "2026-06-20",
  "branchId": "br-001",
  "roomType": "deluxe",
  "guests": 2
}
```

**Response:**
```json
{
  "success": true,
  "available": 12,
  "rooms": [...]
}
```

---

### 4. **Menu Search API** - `/api/menu/search`

#### GET - Advanced Menu Search
```
GET /api/menu/search?q=pasta&category=main&vegetarian=true&minPrice=10&maxPrice=50&branchId=br-001
```

**Query Parameters:**
- `q` - Search query
- `category` - Menu category
- `branchId` - Filter by branch
- `vegetarian` - Vegetarian only (true/false)
- `vegan` - Vegan only (true/false)
- `spicy` - Spicy items (true/false)
- `glutenFree` - Gluten-free items (true/false)
- `halal` - Halal items (true/false)
- `minPrice` - Minimum price
- `maxPrice` - Maximum price

**Response:**
```json
{
  "success": true,
  "items": [...],
  "count": 15
}
```

---

### 5. **Reviews API** - `/api/reviews/submit`

#### POST - Submit Review
```json
{
  "type": "room",
  "rating": 5,
  "title": "Amazing Stay!",
  "comment": "Best hotel experience ever",
  "guestName": "John Doe",
  "guestEmail": "john@example.com",
  "branchId": "br-001",
  "roomId": "room-123"
}
```

#### GET - Fetch Reviews
```
GET /api/reviews/submit?branchId=br-001&type=room&limit=20
```

**Response:**
```json
{
  "success": true,
  "reviews": [...],
  "avgRating": 4.7,
  "totalReviews": 245
}
```

---

## 🎯 React Hooks

### useRooms (Advanced)

```tsx
import { useRooms } from "@/hooks/use-rooms-advanced";

function MyComponent() {
  const { rooms, loading, error, pagination, fetchRooms, checkAvailability } = useRooms({
    branchId: "br-001",
    type: "deluxe",
    status: "available",
    minPrice: 100,
    maxPrice: 500,
    search: "suite",
    page: 1,
    limit: 10,
    autoFetch: true,
  });

  const handleCheckAvailability = async () => {
    const result = await checkAvailability("2026-06-15", "2026-06-20", 2);
    console.log(result);
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {rooms.map(room => (
        <div key={room.id}>{room.number}</div>
      ))}
    </div>
  );
}
```

---

## 🔐 Authentication

All management APIs require authentication via JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## 📊 Database Schema

### Room Model
- `id` - Unique identifier
- `number` - Room number
- `floor` - Floor number
- `type` - Room type
- `status` - Current status
- `price` - Price per night
- `description` - Room description
- `imageUrl` - Room image
- `maxOccupancy` - Maximum guests
- `bedType` - Bed type
- `size` - Room size (m²)
- `branchId` - Branch reference

### Booking Model
- `id` - Unique identifier
- `bookingRef` - Booking reference
- `guestName` - Guest name
- `guestEmail` - Guest email
- `roomId` - Room reference
- `checkIn` - Check-in date
- `checkOut` - Check-out date
- `status` - Booking status
- `totalAmount` - Total amount
- `branchId` - Branch reference

---

## 🌍 Multi-Language Support

All APIs support 10 languages:
- English (en)
- Kinyarwanda (rw)
- French (fr)
- Swahili (sw)
- Spanish (es)
- German (de)
- Chinese (zh)
- Arabic (ar)
- Portuguese (pt)
- Japanese (ja)

---

## 📈 Performance

- **Caching**: Redis caching for frequently accessed data
- **Pagination**: All list endpoints support pagination
- **Indexing**: Database indexes on frequently queried fields
- **Rate Limiting**: 100 requests per minute per IP

---

## 🔄 Real-time Updates

WebSocket support for:
- Room availability changes
- Booking confirmations
- Order status updates
- Live chat messages

---

## 📝 Error Handling

Standard error response:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

© 2026 EastGate Hotel Rwanda
