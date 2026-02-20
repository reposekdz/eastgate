# Manager Branch Management System - Complete Implementation Guide

## 🚀 Overview

A production-ready, full-stack branch management system with real API integration, database storage, and advanced features for hotel managers.

## 📊 Database Schema

### Enhanced Models

#### Branch Model
- Added `status`, `performanceScore`, `monthlyTarget`
- New relations: `branchReports`, `branchTargets`

#### BranchReport Model
```prisma
- Financial metrics (revenue, expenses, profit)
- Operational metrics (occupancy, ADR, RevPAR)
- Staff and guest metrics
- Supports DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY reports
```

#### BranchTarget Model
```prisma
- Revenue and occupancy targets
- Real-time progress tracking
- Status: IN_PROGRESS, ACHIEVED, MISSED, EXCEEDED
```

## 🔌 API Endpoints

### 1. Dashboard API
**Endpoint:** `/api/manager/dashboard`
**Method:** GET
**Query Params:**
- `branchId` (required)
- `period` (optional): "today" | "month"

**Response:**
```json
{
  "branch": { "id", "name", "status", "totalRooms" },
  "metrics": {
    "totalRevenue", "restaurantRevenue", "occupancyRate",
    "occupiedRooms", "availableRooms", "activeStaff",
    "pendingServices", "activeOrders", "totalBookings", "totalOrders"
  },
  "bookings": [...],
  "orders": [...],
  "services": [...],
  "dailyFinancial": {...}
}
```

### 2. Bookings API
**Endpoint:** `/api/manager/bookings`

**GET** - List bookings
- Query: `branchId`, `status`, `search`, `page`, `limit`
- Returns: Paginated bookings with guest and room details

**POST** - Create booking
- Body: `guestId`, `roomId`, `branchId`, `checkInDate`, `checkOutDate`, `adults`, `children`, `roomRate`, `specialRequests`, `createdById`
- Auto-calculates: nights, taxes, total amount
- Updates room status to RESERVED

**PATCH** - Update booking
- Body: `id`, `status`, `paymentStatus`, `actualCheckIn`, `actualCheckOut`
- Auto-updates room status based on booking status

**DELETE** - Cancel booking
- Query: `id`
- Sets status to CANCELLED and frees room

### 3. Staff API
**Endpoint:** `/api/manager/staff`

**GET** - List staff
- Query: `branchId`, `role`, `status`
- Includes: shifts (last 7 days), performance reviews

**POST** - Add staff member
- Body: `email`, `name`, `password`, `phone`, `role`, `branchId`
- Auto-hashes password with bcrypt

**PATCH** - Update staff
- Body: `id`, `name`, `phone`, `role`, `status`, `avatar`

**DELETE** - Terminate staff
- Query: `id`
- Sets status to TERMINATED (soft delete)

### 4. Orders API
**Endpoint:** `/api/manager/orders`

**GET** - List orders
- Query: `branchId`, `status`, `type`, `date`
- Includes: order items with menu details, guest info
- Returns summary statistics

**POST** - Create order
- Body: `branchId`, `tableNumber`, `roomNumber`, `guestId`, `items`, `type`, `createdById`, `notes`
- Auto-generates order number
- Creates order status history

**PATCH** - Update order
- Body: `id`, `status`, `priority`, `userId`
- Tracks status timestamps (sentToKitchen, preparedAt, servedAt)
- Creates status history entry

### 5. Services API
**Endpoint:** `/api/manager/services`

**GET** - List service requests
- Query: `branchId`, `type`, `status`, `priority`
- Sorted by priority and date
- Returns summary statistics

**POST** - Create service request
- Body: `branchId`, `type`, `description`, `roomNumber`, `location`, `bookingId`, `priority`, `assignedTo`, `scheduledFor`

**PATCH** - Update service
- Body: `id`, `status`, `assignedTo`, `priority`, `notes`, `rating`, `feedback`
- Tracks timestamps (startedAt, completedAt)

**DELETE** - Cancel service
- Query: `id`
- Sets status to CANCELLED

### 6. Analytics API
**Endpoint:** `/api/manager/analytics`

**GET** - Comprehensive analytics
- Query: `branchId`, `period`, `startDate`, `endDate`
- Returns:
  - Revenue analytics (by source, payment method)
  - Occupancy metrics
  - Guest analytics (new vs returning)
  - Staff performance
  - Daily breakdown
  - Top selling items
  - Booking and order statistics

### 7. Reports API
**Endpoint:** `/api/manager/reports`

**GET** - List reports
- Query: `branchId`, `type`, `period`

**POST** - Generate report
- Body: `branchId`, `reportType`, `period`, `startDate`, `endDate`
- Aggregates all metrics for the period
- Stores in BranchReport table

**DELETE** - Delete report
- Query: `id`

## 🎨 React Components

### 1. ManagerAnalytics
**Location:** `src/components/manager/ManagerAnalytics.tsx`

**Features:**
- Real-time KPI cards (Revenue, Occupancy, Guests, Orders)
- Interactive charts (Line, Pie, Bar)
- Period selector (Today, Week, Month, Year)
- Export functionality
- Auto-refresh

**Charts:**
- Revenue Trend (Line chart)
- Revenue by Source (Pie chart)
- Top Selling Items (Bar chart)
- Payment Methods (Bar chart)

### 2. ManagerBookings
**Location:** `src/components/manager/ManagerBookings.tsx`

**Features:**
- Advanced search and filtering
- Real-time status updates
- Check-in/Check-out actions
- Booking details modal
- Pagination
- Status badges with color coding

**Actions:**
- View booking details
- Check in guest
- Check out guest
- Cancel booking

## 🪝 Custom Hooks

### useManagerApi
**Location:** `src/hooks/use-manager-api.ts`

**Features:**
- Generic API hook with loading/error states
- Methods: `get`, `post`, `patch`, `delete`
- Auto-handles query parameters
- Success/error callbacks

**Specific Hooks:**
- `useDashboard(branchId, period)`
- `useBookings(branchId)`
- `useStaff(branchId)`
- `useOrders(branchId)`
- `useServices(branchId)`
- `useAnalytics(branchId, period)`
- `useReports(branchId)`

## 🔧 Setup Instructions

### 1. Database Migration
```bash
npx prisma generate
npx prisma db push
```

### 2. Install Dependencies
```bash
npm install bcryptjs recharts
npm install -D @types/bcryptjs
```

### 3. Environment Variables
```env
DATABASE_URL="mysql://user:password@localhost:3306/eastgate"
```

### 4. Seed Database (Optional)
```bash
npx prisma db seed
```

## 📱 Usage Examples

### Dashboard
```tsx
import { useDashboard } from "@/hooks/use-manager-api";

const { data, loading, get } = useDashboard(branchId, "today");

useEffect(() => {
  get({ branchId, period: "today" });
}, [branchId]);
```

### Create Booking
```tsx
const { post } = useBookings(branchId);

await post({
  guestId: "guest-123",
  roomId: "room-456",
  branchId: "branch-789",
  checkInDate: "2025-01-15",
  checkOutDate: "2025-01-20",
  adults: 2,
  roomRate: 50000,
  createdById: userId,
});
```

### Update Order Status
```tsx
const { patch } = useOrders(branchId);

await patch({
  id: orderId,
  status: "PREPARING",
  userId: currentUserId,
});
```

## 🎯 Key Features

### Real-time Updates
- Auto-refresh every 30 seconds
- Manual refresh button
- Live status indicators

### Advanced Filtering
- Search by multiple fields
- Status filtering
- Date range filtering
- Role-based filtering

### Performance Optimization
- Pagination for large datasets
- Indexed database queries
- Efficient data aggregation
- Lazy loading

### Security
- Role-based access control
- Password hashing with bcrypt
- Input validation
- SQL injection prevention (Prisma)

### User Experience
- Loading states
- Error handling with toast notifications
- Responsive design
- Keyboard shortcuts
- Accessibility compliant

## 📊 Analytics Features

### Revenue Analytics
- Total revenue breakdown
- Revenue by source (Rooms, Restaurant, Events)
- Payment method distribution
- Daily/weekly/monthly trends

### Operational Metrics
- Occupancy rate
- Average Daily Rate (ADR)
- Revenue Per Available Room (RevPAR)
- Room status distribution

### Guest Insights
- New vs returning guests
- Loyalty tier distribution
- Guest spending patterns
- Booking sources

### Staff Performance
- Performance ratings
- Shift attendance
- Task completion rates
- Department efficiency

## 🚀 Next Steps

1. **Implement remaining components:**
   - ManagerStaff
   - ManagerOrders
   - ManagerServices
   - ManagerReports

2. **Add real-time features:**
   - WebSocket integration
   - Push notifications
   - Live order tracking

3. **Enhance analytics:**
   - Predictive analytics
   - Trend forecasting
   - Competitor analysis

4. **Mobile optimization:**
   - Progressive Web App (PWA)
   - Mobile-first design
   - Offline support

## 📝 Notes

- All APIs use Prisma for type-safe database access
- Error handling includes detailed logging
- Timestamps are automatically managed
- Soft deletes preserve data integrity
- Audit trails track all changes

## 🔐 Security Considerations

- Always validate user permissions
- Sanitize user inputs
- Use environment variables for secrets
- Implement rate limiting
- Enable CORS properly
- Use HTTPS in production

---

**Built with:** Next.js 15, Prisma, TypeScript, Tailwind CSS, shadcn/ui, Recharts
