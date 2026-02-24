# EastGate Hotel - Complete Advanced System Documentation

**Version**: 2.0 Advanced  
**Last Updated**: February 2026  
**Status**: Production Ready

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Authentication & Security](#authentication--security)
3. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
4. [Payment System](#payment-system)
5. [Booking Engine](#booking-engine)
6. [Ordering System](#ordering-system)
7. [Management Systems](#management-systems)
8. [Analytics & Reporting](#analytics--reporting)
9. [API Documentation](#api-documentation)
10. [Configuration](#configuration)

---

## System Overview

### Architecture

The EastGate Hotel system is built on a modern, scalable architecture with:

- **Frontend**: Next.js with React UI components
- **Backend**: Next.js API routes with Express-like middleware
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT with refresh tokens and 2FA support
- **Payment Processing**: Multi-gateway integration (Stripe, Flutterwave, PayPal)
- **Real-time Updates**: WebSocket support (prepared for implementation)
- **Caching**: Optimized for performance

### Core Features

✅ **Complete Booking Management**
- Real-time availability checking
- Conflict detection
- Cancellation policies with automatic refunds
- Check-in/check-out workflows

✅ **Advanced Ordering System**
- Order creation and tracking
- Kitchen display system (KDS) ready
- Inventory integration
- Real-time status updates

✅ **Multi-Gateway Payments**
- Stripe integration
- Flutterwave (Africa)
- PayPal
- Bank transfers
- Cash payments
- Mobile money support

✅ **Role-Based Access Control**
- 8 predefined roles with granular permissions
- Resource-level access control
- Permission validation middleware
- Audit logging

✅ **Comprehensive Analytics**
- Real-time dashboards
- Financial reporting
- Guest analytics
- Performance metrics
- Revenue forecasting

✅ **Staff Management**
- Employee records
- Attendance tracking
- Performance metrics
- Shift scheduling
- Salary management

✅ **Inventory Management**
- Stock tracking
- Low stock alerts
- Supplier management
- Inventory valuation
- Reorder level management

---

## Authentication & Security

### Authentication Flow

```
1. User Login with Email/Password
   ├─ Password verified with bcryptjs
   ├─ 2FA challenge sent if enabled
   └─ JWT tokens generated (access + refresh)

2. Token Management
   ├─ Access token: 15 minutes expiry
   ├─ Refresh token: 7 days expiry
   ├─ Stored in secure HTTP-only cookies
   └─ Also available in Authorization header

3. Request Authentication
   ├─ Token extracted from header or cookie
   ├─ Signature verified
   ├─ Expiration checked
   └─ Permission validated
```

### Security Features

#### Password Security
```typescript
// Password hashing with random salt
const hashedPassword = hashPassword(plainPassword);

// Password strength validation
const validation = validatePasswordStrength(password);
// Requires: 8+ chars, uppercase, lowercase, number, special char
```

#### Two-Factor Authentication (2FA)
```typescript
// Generate 2FA secret
const { secret, qrCode } = generate2FASecret();

// Verify OTP
const isValid = verifyOTP(secret, userProvidedCode);

// Send OTP via email
await sendOTPEmail(email, otp);
```

#### JWT Token Management
```typescript
// Generate tokens
const { accessToken, refreshToken } = generateTokens({
  id: staff.id,
  email: staff.email,
  role: staff.role,
  branchId: staff.branchId,
  permissions: staff.permissions,
});

// Verify token
const payload = verifyToken(token, "access");

// Token payload structure
interface TokenPayload {
  id: string;
  email: string;
  role: string;
  branchId: string;
  permissions: string[];
  iat: number;
  exp: number;
  type: "access" | "refresh" | "twoFactor";
}
```

#### Rate Limiting
```typescript
// Automatic rate limiting on all API endpoints
// Default: 5 attempts per 60 seconds per IP
// Customizable per endpoint

const success = checkRateLimit(
  key, // IP address or user ID
  maxAttempts, // 5
  windowMs // 60000 (1 minute)
);
```

#### API Security
- CORS protection
- Request validation
- SQL injection prevention via Prisma
- XSS protection with output encoding
- Secure session management
- Audit logging of all actions

---

## Role-Based Access Control (RBAC)

### Roles Hierarchy

```
SUPER_ADMIN (Level 100)
    ├─ Full system access
    ├─ Manage all users
    ├─ Configure settings
    └─ View all analytics

SUPER_MANAGER (Level 90)
    ├─ Manage multiple branches
    ├─ Create/delete staff
    ├─ View all reports
    └─ Limited financial controls

BRANCH_MANAGER (Level 80)
    ├─ Manage single branch
    ├─ Manage branch staff
    ├─ Create rooms/menus
    └─ View branch analytics

MANAGER (Level 70)
    ├─ Daily operations
    ├─ Create bookings/orders
    ├─ Process payments
    └─ View reports

RECEPTIONIST (Level 50)
    ├─ Check-in guests
    ├─ Create bookings
    ├─ Process payments
    └─ Handle guest requests

WAITER (Level 30)
    ├─ Take orders
    ├─ Track orders
    ├─ Serve guests
    └─ Process payments

CHEF (Level 30)
    ├─ View kitchen orders
    ├─ Update order status
    ├─ Manage inventory
    └─ View menu

KITCHEN_STAFF (Level 20)
    ├─ View orders
    ├─ Prepare food
    └─ Update status
```

### Permissions System

```typescript
// Check single permission
if (hasPermission(userPermissions, "booking:create")) {
  // Allow action
}

// Check multiple permissions
if (hasAnyPermission(userPermissions, [
  "order:create",
  "order:read"
])) {
  // Allow action
}

// Check all permissions
if (hasAllPermissions(userPermissions, [
  "payment:create",
  "payment:read",
  "invoice:create"
])) {
  // Allow action
}
```

### Resource-Level Access Control

```typescript
// Check access to specific resource
const hasAccess = checkResourceAccess(
  "booking", // resource
  "view",    // action
  {
    role: userRole,
    userId: userId,
    bookingGuestId: guestId, // User can only view own bookings
  }
);
```

### API Endpoint Protection

```typescript
// Protect endpoint with permission
export const POST = withPermission("booking:create", async (req) => {
  // Only users with booking:create permission can access
});

// Protect with role requirement
export const GET = withRole("MANAGER", async (req) => {
  // Only MANAGER and above can access
});

// Protect with resource access
export const PUT = withResourceAccess(
  "booking",
  "update",
  async (req) => {
    // Resource-level access checked
  }
);
```

---

## Payment System

### Supported Payment Methods

1. **Stripe** - Global credit/debit card processing
2. **Flutterwave** - Africa-focused (cards, mobile money, bank transfer)
3. **PayPal** - Global alternative payment
4. **Bank Transfer** - Direct transfer with manual verification
5. **Cash** - Physical payment at property
6. **Mobile Money** - MTN, Airtel, etc.

### Payment Flow

```
1. Payment Request
   ├─ Validate amount
   ├─ Route to appropriate gateway
   ├─ Create payment record
   └─ Return payment details

2. Gateway Processing
   ├─ Send to payment provider
   ├─ Get transaction ID
   ├─ Return redirect URL if needed
   └─ Store external ID

3. Webhook Handling
   ├─ Receive payment status update
   ├─ Verify webhook signature
   ├─ Update payment status
   ├─ Trigger confirmations
   └─ Update bookings/orders

4. Reconciliation
   ├─ Daily reconciliation
   ├─ Identify discrepancies
   ├─ Generate reports
   └─ Alert on issues
```

### Processing Payment

```typescript
const paymentResponse = await processPayment({
  amount: 250000, // RWF
  currency: "RWF",
  method: PaymentMethod.FLUTTERWAVE,
  email: "guest@example.com",
  fullName: "John Doe",
  description: "Booking for room XYZ",
  bookingId: "booking_123",
  branchId: branch.id,
  metadata: {
    checkInDate: "2026-02-25",
    checkOutDate: "2026-02-27",
  }
});

// Response:
{
  id: "payment_id",
  transactionId: "TXN-20260224-ABC123",
  status: PaymentStatus.PROCESSING,
  amount: 250000,
  currency: "RWF",
  method: PaymentMethod.FLUTTERWAVE,
  redirectUrl: "https://payment-provider.com/...",
  timestamp: new Date()
}
```

### Processing Refund

```typescript
const refundResult = await processRefund({
  paymentId: "payment_123",
  amount: 125000, // Optional - partial refund
  reason: RefundReason.BOOKING_CANCELLATION,
  notes: "Guest requested cancellation"
});

// Response:
{
  success: true,
  refundId: "refund_123",
  amount: 125000,
  status: "pending"
}
```

### Payment Status Tracking

```typescript
enum PaymentStatus {
  PENDING = "pending",          // Awaiting processing
  PROCESSING = "processing",    // In progress
  COMPLETED = "completed",      // Successfully paid
  FAILED = "failed",            // Payment declined
  CANCELLED = "cancelled",      // User cancelled
  REFUNDED = "refunded",        // Fully refunded
  PARTIAL_REFUND = "partial_refund" // Partially refunded
}
```

### Webhook Signature Verification

```typescript
// Implemented for each gateway
// Stripe: Uses stripe-signature header with shared secret
// Flutterwave: Uses signature in request body
// PayPal: Uses certificate validation

const verified = verifyWebhookSignature(gateway, request, body);
```

---

## Booking Engine

### Availability Checking

```typescript
// Check single room
const availability = await checkRoomAvailability(
  roomId,
  new Date("2026-02-25"),
  new Date("2026-02-27")
);

if (availability.available) {
  console.log("Pricing:", availability.pricing);
  // {
  //   roomPrice: 150000,
  //   totalNights: 2,
  //   subtotal: 300000,
  //   taxes: 54000,
  //   total: 354000
  // }
}

// Check multiple rooms
const roomAvailability = await checkMultipleRoomsAvailability(
  ["room_1", "room_2", "room_3"],
  startDate,
  endDate
);

// Search available rooms
const availableRooms = await getAvailableRooms(
  branchId,
  startDate,
  endDate,
  {
    roomType: "deluxe",
    minPrice: 100000,
    maxPrice: 500000,
    occupancy: 2
  }
);
```

### Creating Booking

```typescript
const booking = await createBooking({
  guestId: "guest_123",
  roomId: "room_456",
  checkInDate: new Date("2026-02-25"),
  checkOutDate: new Date("2026-02-27"),
  numberOfGuests: 2,
  specialRequests: "High floor preferred, late check-in",
  cancellationPolicy: CancellationPolicy.MODERATE,
  branchId: "branch_789"
});

// Returns:
{
  id: "booking_123",
  status: "pending",
  checkInDate: Date,
  checkOutDate: Date,
  totalAmount: 354000,
  paidAmount: 0,
  // ... more fields
}
```

### Booking Status Lifecycle

```
PENDING → CONFIRMED → CHECKED_IN → CHECKED_OUT
   ↓
CANCELLED
(with refund based on policy)

or:
   
CHECKED_IN → NO_SHOW (if guest doesn't arrive)
```

### Cancellation Policies

```typescript
enum CancellationPolicy {
  FREE: "free",                    // 0% charge
  MODERATE: "moderate",            // 50% if cancelled < 7 days
  STRICT: "strict",                // Non-refundable if < 3 days
  NON_REFUNDABLE: "non_refundable" // 100% non-refundable
}

// Automatic refund calculation
const refundAmount = calculateRefund(booking);
// Based on policy and days until check-in
```

### Check-in/Check-out

```typescript
// Check in guest
await checkInGuest(bookingId, roomKeysIssued);

// Check out guest
await checkOutGuest(bookingId, damages, notes);
// Returns booking with final amount including damages
```

---

## Ordering System

### Creating Order

```typescript
const order = await createOrder({
  guestName: "Guest Name",
  guestId: "guest_123",
  tableNumber: 5,
  type: OrderType.DINE_IN,
  items: [
    {
      menuItemId: "menu_1",
      name: "Grilled Fish",
      quantity: 2,
      unitPrice: 45000,
      specialRequests: "Extra lemon",
      preparationNotes: "Less salt"
    }
  ],
  specialRequests: "Birthday celebration",
  priority: OrderPriority.NORMAL,
  branchId: "branch_123",
  createdBy: "staff_456"
});

// Returns:
{
  id: "order_123",
  orderNumber: "ORD-20260224-ABC123",
  status: OrderStatus.PENDING,
  items: [...],
  total: 90000,
  createdAt: Date
}
```

### Order Status Tracking

```typescript
enum OrderStatus {
  PENDING = "pending",      // Just created
  CONFIRMED = "confirmed",  // Sent to kitchen
  PREPARING = "preparing",  // Being prepared
  READY = "ready",          // Ready to serve
  SERVED = "served",        // Served to guest
  COMPLETED = "completed",  // Completed
  CANCELLED = "cancelled"   // Cancelled with refund
}

// Update order status
await updateOrderStatus(orderId, OrderStatus.READY, notes);

// Update item status within order
await updateOrderItemStatus(orderId, itemId, "ready");
```

### Kitchen Display System (KDS)

```typescript
// Get kitchen display orders
const kitchenOrders = await getKitchenDisplay(branchId);
// Returns orders in CONFIRMED/PREPARING status
// Sorted by priority, then creation time

// Staff updates item status as they prepare
await updateOrderItemStatus(orderId, itemId, "preparing");
await updateOrderItemStatus(orderId, itemId, "ready");
// When all items ready, order auto-moves to READY
```

### Order Analytics

```typescript
const stats = await getOrderStatistics(
  branchId,
  startDate,
  endDate
);

// Returns:
{
  totalOrders: 150,
  pendingOrders: 5,
  completedOrders: 140,
  avgPrepTime: 18,     // minutes
  avgOrderValue: 75000,
  topItems: [
    { name: "Grilled Fish", count: 45 },
    { name: "Ugali", count: 38 },
    // ...
  ]
}
```

---

## Management Systems

### Staff Management

```typescript
// Create staff
const staff = await createStaffMember({
  name: "John Doe",
  email: "john@eastgate.rw",
  password: "SecureP@ss123",
  phone: "+250788123456",
  role: "RECEPTIONIST",
  department: "Front Desk",
  shift: ShiftType.MORNING,
  salary: 500000,
  branchId: "branch_123"
});

// Update staff
await updateStaffMember(staffId, {
  salary: 550000,
  shift: ShiftType.AFTERNOON
});

// Get staff by role
const receptionists = await getStaffByRole(branchId, "RECEPTIONIST");

// Record attendance
await recordAttendance(
  staffId,
  new Date(),
  clockInTime,
  clockOutTime
);

// Get performance metrics
const performance = await getStaffPerformance(staffId, "month");
```

### Inventory Management

```typescript
// Create inventory item
const item = await createInventoryItem({
  name: "Canned Tomatoes",
  sku: "SKU-001",
  category: "food",
  quantity: 50,
  unit: "pieces",
  unitPrice: 5000,
  reorderLevel: 10,
  supplier: "Local Supplier",
  branchId: "branch_123"
});

// Update quantity
await updateInventoryQuantity(itemId, 5, "add", "Purchase order #123");
await updateInventoryQuantity(itemId, 2, "subtract", "Used in meal prep");
await updateInventoryQuantity(itemId, 100, "set", "Physical count");

// Check low stock
const lowStock = await getLowStockItems(branchId);

// Get inventory value
const totalValue = await getInventoryValue(branchId);
```

### Financial Management

```typescript
// Record expense
const expense = await recordExpense({
  category: "utilities",
  amount: 250000,
  description: "Electricity bill - February",
  vendor: "EWSA",
  receipt: "https://...",
  date: new Date(),
  branchId: "branch_123"
});

// Get expenses for period
const expenses = await getBranchExpenses(
  branchId,
  startDate,
  endDate
);

// Get expense summary
const summary = await getExpenseSummary(
  branchId,
  startDate,
  endDate
);

// Returns:
{
  total: 1500000,
  byCategory: {
    utilities: 250000,
    salaries: 1000000,
    supplies: 250000
  },
  count: 25
}
```

---

## Analytics & Reporting

### Dashboard Metrics

```typescript
const metrics = await getDashboardMetrics(
  branchId,
  {
    start: new Date("2026-02-01"),
    end: new Date("2026-02-28")
  }
);

// Returns comprehensive metrics:
{
  revenue: {
    today: 850000,
    week: 5200000,
    month: 18500000,
    trend: 12.5  // percent
  },
  bookings: {
    total: 45,
    confirmed: 40,
    pending: 3,
    cancellations: 2
  },
  occupancy: {
    rate: 78.5,  // percent
    occupiedRooms: 31,
    availableRooms: 9,
    totalRooms: 40
  },
  guests: {
    total: 2500,
    newGuests: 85,
    returningGuests: 1200,
    vipGuests: 120
  },
  operations: {
    averageOrderValue: 75000,
    completedOrders: 450,
    averageServiceTime: 18,  // minutes
    customerSatisfaction: 4.5  // out of 5
  }
}
```

### Financial Reports

```typescript
const report = await generateFinancialReport(
  branchId,
  "monthly",
  new Date("2026-02-01")
);

// Returns:
{
  period: "monthly-2026-02-01",
  revenue: {
    accommodation: 5000000,
    food_beverage: 2500000,
    services: 1500000,
    events: 800000,
    total: 9800000
  },
  expenses: {
    salaries: 3000000,
    utilities: 500000,
    maintenance: 300000,
    supplies: 200000,
    other: 100000,
    total: 4100000
  },
  profit: 5700000,
  profitMargin: 58.16  // percent
}
```

### Guest Analytics

```typescript
const guestAnalytics = await getGuestAnalytics(
  branchId,
  { start: new Date("2026-02-01"), end: new Date("2026-02-28") }
);

// Returns:
{
  totalGuests: 2500,
  newGuests: 85,
  returningGuests: 1200,
  avgStayDuration: 2.5,  // nights
  avgSpendPerGuest: 450000,
  loyaltyDistribution: {
    bronze: 500,
    silver: 1800,
    gold: 180,
    platinum: 20
  },
  topSourceMarkets: [
    { country: "Uganda", count: 250 },
    { country: "Kenya", count: 180 },
    { country: "Tanzania", count: 150 }
  ],
  satisfaction: 4.5  // out of 5
}
```

### Revenue Forecasting

```typescript
const forecast = await forecastRevenue(branchId, 30);

// Returns 30-day revenue forecast:
[
  {
    date: Date("2026-02-25"),
    forecast: 950000,  // predicted revenue
    confidence: 0.87   // confidence level
  },
  // ... 29 more days
]
```

---

## API Documentation

### Authentication Endpoints

#### `POST /api/auth/login`
```json
{
  "email": "staff@eastgate.rw",
  "password": "SecurePassword123"
}
```

Response:
```json
{
  "success": true,
  "user": {
    "id": "staff_123",
    "name": "Staff Name",
    "email": "staff@eastgate.rw",
    "role": "RECEPTIONIST",
    "branchId": "branch_123",
    "permissions": ["booking:create", "booking:read", ...]
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### Booking Endpoints

#### `POST /api/bookings/search`
Search for available rooms

#### `POST /api/bookings/create`
Create new booking with optional payment

#### `GET /api/bookings/:id`
Get booking details

#### `PUT /api/bookings/:id`
Update booking information

#### `DELETE /api/bookings/:id`
Cancel booking

### Payment Endpoints

#### `POST /api/payments/process`
Process payment through selected gateway

#### `POST /api/payments/refund`
Process payment refund

#### `GET /api/payments/:transactionId`
Get payment details

### Order Endpoints

#### `POST /api/orders`
Create new order

#### `GET /api/orders/:id`
Get order details

#### `PUT /api/orders/:id`
Update order status

#### `DELETE /api/orders/:id`
Cancel order

### Management Endpoints

#### `GET /api/staff`
Get all staff

#### `POST /api/staff`
Create new staff member

#### `GET /api/inventory`
Get inventory items

#### `PUT /api/inventory/:id`
Update inventory

### Analytics Endpoints

#### `GET /api/analytics/dashboard`
Get dashboard metrics

#### `GET /api/analytics/financial`
Get financial reports

#### `GET /api/analytics/guests`
Get guest analytics

#### `GET /api/analytics/forecast`
Get revenue forecast

---

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="mysql://user:password@localhost:3306/eastgate"

# JWT Secrets
JWT_ACCESS_SECRET="your-access-token-secret"
JWT_REFRESH_SECRET="your-refresh-token-secret"
JWT_2FA_SECRET="your-2fa-secret"

# Payment Gateways
STRIPE_PUBLIC_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."

FLUTTERWAVE_PUBLIC_KEY="FLWPUBK_..."
FLUTTERWAVE_SECRET_KEY="FLWSECK_..."

PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."

# Email Service
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="notification@eastgate.rw"
SMTP_PASSWORD="..."

# Application
APP_URL="https://eastgate.rw"
NODE_ENV="production"
```

### Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Create/update database schema
npm run db:push

# Seed with initial data
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### Deployment

```bash
# Build application
npm run build

# Start production server
npm start

# Or use PM2
pm2 start npm --name "eastgate" -- start
```

---

## Support & Maintenance

### Common Issues

**Issue**: Payment webhook not processing
- Verify webhook signature secret
- Check endpoint authentication
- Review gateway logs

**Issue**: Booking availability conflicts
- Clear cache if using Redis
- Verify database transaction isolation
- Check timezone settings

**Issue**: Staff role changes not applying
- Clear JWT tokens
- Verify permission table updated
- Restart application

### Monitoring

- Monitor API response times
- Track payment gateway status
- Monitor database performance  
- Set up alerts for errors
- Regular backup of database

### Updates & Upgrades

Regular updates recommended for:
- Security patches
- New payment gateway features
- Database optimizations
- UI/UX improvements

---

**End of Documentation**

For more detailed information, contact the development team or visit the API documentation portal.
