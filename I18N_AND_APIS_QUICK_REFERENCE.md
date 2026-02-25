"""
╔════════════════════════════════════════════════════════════════════════════╗
║                    I18N & ADVANCED APIS QUICK REFERENCE                    ║
╚════════════════════════════════════════════════════════════════════════════╝

COMPLETE GUIDE FOR:
  ✅ Internationalization (10 Languages)
  ✅ Production-Ready APIs with JWT Authentication
  ✅ Reception, Kitchen, and Waiter Systems
  ✅ Real Database Operations (No Mocks)
"""

# ═══════════════════════════════════════════════════════════════════════════
# 1️⃣  INTERNATIONALIZATION SYSTEM
# ═══════════════════════════════════════════════════════════════════════════

## SETUP IN LAYOUT

// src/app/layout.tsx
import { LocaleProvider } from '@/lib/i18n/useTranslation';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LocaleProvider>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}

## USAGE IN COMPONENTS

import { useLocale } from '@/lib/i18n/useTranslation';

function MyComponent() {
  const { t, locale, setLocale } = useLocale();
  
  return (
    <>
      {/* Display translation */}
      <h1>{t('hero', 'title')}</h1>
      
      {/* Show current language */}
      <p>Language: {locale}</p>
      
      {/* Change language */}
      <select value={locale} onChange={(e) => setLocale(e.target.value)}>
        <option value="en">English</option>
        <option value="fr">Français</option>
        <option value="es">Español</option>
        <option value="de">Deutsch</option>
        <option value="pt">Português</option>
        <option value="ar">العربية</option>
        <option value="zh">中文</option>
        <option value="ja">日本語</option>
        <option value="sw">Kiswahili</option>
        <option value="rw">Kinyarwanda</option>
      </select>
    </>
  );
}

## TRANSLATION NAMESPACES

Available namespaces in translations.ts:
  - common       (90+ keys: buttons, labels, common UI)
  - hero         (5+ keys: homepage hero section)
  - nav          (10+ keys: navigation menu)
  - homepage     (4+ keys: feature descriptions)
  - booking      (10+ keys: reservations)
  - payment      (8+ keys: payment processing)
  - order        (7+ keys: menu orders)
  - staff        (8+ keys: staff management)
  - admin        (10+ keys: admin dashboard)
  - messages     (11+ keys: errors & status)

## ADDING NEW TRANSLATIONS

In src/lib/i18n/translations.ts:

export const translations: Translations = {
  en: {
    myNamespace: {
      myKey: 'English text',
      // ... more keys
    }
  },
  fr: {
    myNamespace: {
      myKey: 'Texte français',
      // ... more keys
    }
  },
  // ... repeat for all 10 languages
};

Then use: t('myNamespace', 'myKey')

# ═══════════════════════════════════════════════════════════════════════════
# 2️⃣  RECEPTION API - REGISTER GUEST & CHECK-IN
# ═══════════════════════════════════════════════════════════════════════════

METHOD:   POST
ENDPOINT: /api/receptionist/register-guest
AUTH:     JWT Bearer Token (RECEPTIONIST, MANAGER, or ADMIN role)

REQUIRED HEADERS:
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs...",
  "Content-Type": "application/json"
}

REQUEST BODY:
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+250788123456",
  "idNumber": "ID123456",
  "nationality": "Kenyan",
  "address": "123 Main St",
  "dateOfBirth": "1990-01-15",
  "roomId": "room-uuid",
  "checkIn": "2024-01-15T14:00:00Z",
  "checkOut": "2024-01-18T11:00:00Z",
  "numberOfGuests": 2,
  "specialRequests": "High floor view",
  "branchId": "branch-uuid"
}

VALIDATIONS APPLIED:
  ✅ Name: 2+ characters
  ✅ Phone: Valid format
  ✅ ID Number: 5+ characters
  ✅ Email: RFC 5322 format
  ✅ Room: Must be available
  ✅ Check-out: After check-in
  ✅ Check-in: Not in past
  ✅ Duration: 1-365 days

RESPONSE (201 Created):
{
  "success": true,
  "message": "Guest registered and checked in successfully",
  "booking": {
    "id": "booking-uuid",
    "guestId": "guest-uuid",
    "roomId": "room-uuid",
    "status": "checked_in",
    "checkIn": "2024-01-15T14:00:00Z",
    "checkOut": "2024-01-18T11:00:00Z",
    "totalAmount": 450,
    "paymentStatus": "paid",
    "checkedInBy": "staff-uuid",
    "checkedInAt": "2024-01-15T15:30:00Z"
  },
  "guest": { /* ... */ }
}

ERROR RESPONSES:
  400: Validation error (invalid input)
  401: Unauthorized (missing/invalid token)
  403: Forbidden (insufficient role)
  409: Conflict (room not available)
  500: Server error

# ═══════════════════════════════════════════════════════════════════════════
# 3️⃣  RECEPTION API - DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════

METHOD:   GET
ENDPOINT: /api/receptionist/dashboard
AUTH:     JWT Bearer Token (RECEPTIONIST, MANAGER, or ADMIN role)

RESPONSE (200 OK):
{
  "success": true,
  "data": {
    "todayCheckIns": [
      {
        "id": "booking-uuid",
        "guestName": "Jane Smith",
        "checkIn": "2024-01-15T14:00:00Z",
        "roomNumber": 245,
        "guest": { "phone": "+250...", "email": "..." }
      }
    ],
    "todayCheckOuts": [ /* similar */ ],
    "availableRooms": [
      {
        "id": "room-uuid",
        "roomNumber": 301,
        "type": "deluxe",
        "price": 250,
        "status": "available"
      }
    ],
    "activeBookings": [ /* ... */ ],
    "pendingBookings": [ /* ... */ ],
    "stats": {
      "totalRooms": 120,
      "occupiedRooms": 87,
      "availableRoomsCount": 33,
      "occupancyRate": 72.5,
      "todayCheckInsCount": 5,
      "todayCheckOutsCount": 3,
      "todayRevenue": 3500
    }
  }
}

UPDATE BOOKING (PUT REQUEST):
{
  "bookingId": "booking-uuid",
  "action": "checkin|checkout|confirm|cancel"
}

Valid Actions:
  - checkin   → Check guest in
  - checkout  → Check guest out
  - confirm   → Confirm pending booking
  - cancel    → Cancel booking

# ═══════════════════════════════════════════════════════════════════════════
# 4️⃣  KITCHEN API - FETCH ORDERS
# ═══════════════════════════════════════════════════════════════════════════

METHOD:   GET
ENDPOINT: /api/kitchen/orders?branchId=xxx&status=preparing
AUTH:     JWT Bearer Token (CHEF, KITCHEN_STAFF, MANAGER, or ADMIN role)

QUERY PARAMETERS:
  ?branchId=uuid          (optional, defaults to user's branch)
  ?status=preparing       (optional: pending, confirmed, preparing, ready)
  ?priority=high          (optional: high, medium, low)

RESPONSE (200 OK):
{
  "success": true,
  "orders": [
    {
      "id": "order-uuid",
      "orderNumber": "ORD-001",
      "status": "preparing",
      "createdAt": "2024-01-15T12:30:00Z",
      "itemCount": 3,
      "maxPreparationTime": 25,
      "estimatedCompletionTime": "2024-01-15T12:55:00Z",
      "items": [
        {
          "id": "item-uuid",
          "quantity": 2,
          "menuItem": {
            "name": "Grilled Fish",
            "category": "FOOD",
            "preparationTime": 25,
            "ingredients": [ "fish", "lemon", "garlic" ]
          }
        }
      ],
      "booking": {
        "roomNumber": 245,
        "guestName": "John Smith"
      },
      "notes": null
    }
  ],
  "total": 8
}

# ═══════════════════════════════════════════════════════════════════════════
# 5️⃣  KITCHEN API - UPDATE ORDER STATUS
# ═══════════════════════════════════════════════════════════════════════════

METHOD:   PUT
ENDPOINT: /api/kitchen/orders
AUTH:     JWT Bearer Token (CHEF, KITCHEN_STAFF, MANAGER, or ADMIN role)

REQUEST BODY:
{
  "orderId": "order-uuid",
  "status": "ready",
  "notes": "Extra heat requested"
}

Valid Statuses:
  - pending    → Just received
  - confirmed  → Acknowledged by kitchen
  - preparing  → Currently being prepared
  - ready      → Ready for waiter pickup
  - completed  → Served to guest
  - cancelled  → Order cancelled

RESPONSE (200 OK):
{
  "success": true,
  "message": "Order status updated to ready",
  "order": {
    "id": "order-uuid",
    "status": "ready",
    "readyAt": "2024-01-15T12:55:00Z",
    "items": [ /* ... */ ],
    "notes": "Extra heat requested"
  }
}

# ═══════════════════════════════════════════════════════════════════════════
# 6️⃣  WAITER API - DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════

METHOD:   GET
ENDPOINT: /api/waiter/dashboard
AUTH:     JWT Bearer Token (WAITER, MANAGER, or ADMIN role)

RESPONSE (200 OK):
{
  "success": true,
  "data": {
    "activeOrders": [
      {
        "id": "order-uuid",
        "status": "ready",
        "createdAt": "2024-01-15T12:30:00Z",
        "total": 85.50,
        "items": [
          {
            "quantity": 2,
            "menuItem": {
              "name": "Grilled Fish",
              "price": 35
            }
          }
        ],
        "booking": {
          "roomNumber": 245,
          "guestName": "John Smith"
        }
      }
    ],
    "todayStats": {
      "totalOrders": 24,
      "completedOrders": 19,
      "revenue": 2150.75,
      "estimatedTips": 215.08
    },
    "recentOrders": [ /* latest 10 */ ],
    "branch": "branch-uuid"
  }
}

# ═══════════════════════════════════════════════════════════════════════════
# 7️⃣  WAITER API - UPDATE ORDER STATUS
# ═══════════════════════════════════════════════════════════════════════════

METHOD:   PUT
ENDPOINT: /api/waiter/dashboard
AUTH:     JWT Bearer Token (WAITER, MANAGER, or ADMIN role)

REQUEST BODY:
{
  "orderId": "order-uuid",
  "action": "serve"
}

Valid Actions:
  - serve      → Mark as served (requires "ready" status)
  - complete   → Complete order (for room service)
  - cancel     → Cancel order
  - ready      → Mark as ready for pickup

RESPONSE (200 OK):
{
  "success": true,
  "message": "Order serve successfully",
  "order": { /* updated order */ }
}

# ═══════════════════════════════════════════════════════════════════════════
# 8️⃣  STANDARD HTTP STATUS CODES
# ═══════════════════════════════════════════════════════════════════════════

200 OK
  ✅ Successful GET or PUT request
  Response: { success: true, data: {...} }

201 Created
  ✅ Successful POST request (resource created)
  Response: { success: true, message: "...", booking/order: {...} }

400 Bad Request
  ❌ Validation error (invalid input)
  Response: { success: false, error: "Description of what's wrong" }

401 Unauthorized
  ❌ Missing or invalid JWT token
  Response: { success: false, error: "Unauthorized: Invalid token" }

403 Forbidden
  ❌ Valid token but insufficient permissions
  Response: { success: false, error: "Forbidden: Insufficient permissions" }

404 Not Found
  ❌ Resource doesn't exist
  Response: { success: false, error: "Booking/Order not found" }

409 Conflict
  ❌ Business logic conflict (room already booked, etc.)
  Response: { success: false, error: "Room is not available" }

500 Server Error
  ❌ Server-side error
  Response: { success: false, error: "Failed to process request" }

# ═══════════════════════════════════════════════════════════════════════════
# 9️⃣  CURL EXAMPLES FOR TESTING
# ═══════════════════════════════════════════════════════════════════════════

## Register Guest

curl -X POST http://localhost:3000/api/receptionist/register-guest \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Guest",
    "phone": "+250788123456",
    "idNumber": "ID123456",
    "roomId": "room-uuid",
    "checkIn": "2024-01-15T14:00:00Z",
    "checkOut": "2024-01-18T11:00:00Z"
  }'

## Get Reception Dashboard

curl -X GET http://localhost:3000/api/receptionist/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

## Get Kitchen Orders

curl -X GET "http://localhost:3000/api/kitchen/orders?status=pending" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

## Update Kitchen Order Status

curl -X PUT http://localhost:3000/api/kitchen/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-uuid",
    "status": "ready",
    "notes": "Ready at window"
  }'

## Get Waiter Dashboard

curl -X GET http://localhost:3000/api/waiter/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

## Update Waiter Order Status

curl -X PUT http://localhost:3000/api/waiter/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-uuid",
    "action": "complete"
  }'

# ═══════════════════════════════════════════════════════════════════════════
# 🔟  IMPLEMENTATION CHECKLIST
# ═══════════════════════════════════════════════════════════════════════════

For Frontend Developers:
  [ ] Import useLocale in all user-facing components
  [ ] Replace hardcoded strings with t('namespace', 'key')
  [ ] Wrap app with LocaleProvider in root layout
  [ ] Add JWT token to all API requests
  [ ] Handle 401/403 responses with login redirect
  [ ] Test language switching
  [ ] Test API calls with Bearer token

For Backend Developers:
  [ ] Ensure JWT token generation includes userId
  [ ] Verify staff table has branchId column
  [ ] Ensure all models (Booking, Order, Room) have branchId
  [ ] Set up logging for all API actions
  [ ] Configure rate limiting
  [ ] Test all validation rules
  [ ] Verify error messages are consistent

For DevOps/Deployment:
  [ ] Set JWT_SECRET environment variable (32+ chars)
  [ ] Configure CORS for frontend domain
  [ ] Enable HTTPS/TLS
  [ ] Set up log aggregation
  [ ] Configure database backups
  [ ] Load test API endpoints
  [ ] Monitor error rates
  [ ] Set up alerting

# ═══════════════════════════════════════════════════════════════════════════
# 📚 KEY FILES & LOCATIONS
# ═══════════════════════════════════════════════════════════════════════════

i18n System:
  src/lib/i18n/config.ts              → Language configuration
  src/lib/i18n/translations.ts        → Translation dictionary (1260 lines)
  src/lib/i18n/useTranslation.ts      → React hooks & provider

API Routes (Reception):
  src/app/api/receptionist/register-guest/route.ts
  src/app/api/receptionist/dashboard/route.ts

API Routes (Kitchen):
  src/app/api/kitchen/orders/route.ts
  src/app/api/kitchen/dashboard/route.ts

API Routes (Waiter):
  src/app/api/waiter/dashboard/route.ts

Authentication:
  src/lib/auth-advanced/jwt.ts        → JWT verification function
  src/lib/validators.ts               → Input validation

Components:
  src/components/sections/HeroSection.tsx → Updated with i18n

Documentation:
  src/I18N_AND_ADVANCED_APIS_COMPLETE.md  → Full documentation

════════════════════════════════════════════════════════════════════════════════
STATUS: ✅ PRODUCTION READY
VERSION: 3.0
LAST UPDATED: January 15, 2024
════════════════════════════════════════════════════════════════════════════════
"""
