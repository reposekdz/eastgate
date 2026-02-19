# Advanced Stock & Financial Management Implementation

## Overview
This document details the implementation of comprehensive stock/inventory management, kitchen stock, financial analytics, stock alerts, and payment processing for the EastGate Hotel Management System.

---

## 1. Database Schema Enhancements

### New Models Added

#### StockItem
```prisma
model StockItem {
  id              String        @id @default(cuid())
  name            String
  sku             String        @unique
  category        String        // FOOD, KITCHEN, HOUSEKEEPING, MAINTENANCE
  subCategory     String?
  quantity        Float
  unit            String        // KG, LITERS, PIECES, etc.
  unitCost        Float
  reorderLevel    Float         @default(10)
  reorderQuantity Float?
  location        String?
  status          StockStatus   @default(IN_STOCK)
  expiryDate      DateTime?
  supplierId      String?
  branchId        String
  transactions    StockTransaction[]
  orderItems      OrderItem[]
  ...
}
```

#### StockTransaction
```prisma
model StockTransaction {
  id              String        @id @default(cuid())
  stockItemId     String
  type            TransactionType  // IN, OUT, ADJUSTMENT, RETURN, WASTAGE, TRANSFER
  quantity        Float
  quantityBefore  Float?
  quantityAfter   Float?
  unitCost        Float?
  totalCost       Float?
  reference       String?
  notes           String?
  performedBy     String?
  branchId        String
  createdAt       DateTime      @default(now())
}
```

#### Supplier
```prisma
model Supplier {
  id              String        @id @default(cuid())
  name            String
  contactPerson   String?
  email           String?
  phone           String?
  address         String?
  category        String?
  paymentTerms    String?
  rating          Int?
  isActive        Boolean       @default(true)
  branchId        String?
  stockItems      StockItem[]
  purchases       PurchaseOrder[]
}
```

#### PurchaseOrder
```prisma
model PurchaseOrder {
  id              String        @id @default(cuid())
  orderNumber     String        @unique
  supplierId      String
  status          PurchaseStatus  // PENDING, APPROVED, ORDERED, RECEIVED, CANCELLED
  items           Json
  subtotal        Float
  taxAmount       Float
  totalAmount     Float
  orderDate       DateTime
  expectedDelivery DateTime?
  receivedDate    DateTime?
  branchId        String
  createdById     String?
}
```

#### Expense
```prisma
model Expense {
  id              String        @id @default(cuid())
  category        ExpenseCategory  // SALARIES, FOOD_COST, BEVERAGES, SUPPLIES, etc.
  subCategory     String?
  description     String
  amount          Float
  currency        String        @default("RWF")
  paymentMethod   String?
  reference       String?
  status          ExpenseStatus  // PENDING, APPROVED, PAID, REJECTED, CANCELLED
  expenseDate     DateTime
  dueDate         DateTime?
  paidDate        DateTime?
  vendorName      String?
  vendorId        String?
  approvedBy      String?
  approvedAt      DateTime?
  branchId        String
  isRecurring     Boolean       @default(false)
  recurringPeriod String?
  notes           String?
  receiptUrl      String?
}
```

#### DailyFinancial
```prisma
model DailyFinancial {
  id              String        @id @default(cuid())
  date            DateTime
  dateString      String        // YYYY-MM-DD
  branchId        String
  // Income
  roomIncome      Float
  restaurantIncome Float
  barIncome       Float
  spaIncome       Float
  eventIncome     Float
  otherIncome     Float
  totalIncome     Float
  // Expenses
  foodExpense    Float
  beverageExpense Float
  staffExpense   Float
  maintenanceExpense Float
  utilitiesExpense Float
  marketingExpense Float
  otherExpense   Float
  totalExpense   Float
  // Net
  netProfit       Float
  profitMargin    Float
  // Metrics
  totalOrders     Int
  totalBookings   Int
  occupancyRate   Float
}
```

### Updated Models

#### NotificationType
Added `STOCK` and `ALERT` types for stock notifications.

#### Payment
Added `branchId` field for branch-specific payment tracking.

---

## 2. API Endpoints

### Stock Management
- **GET `/api/manager/stock`** - Get all stock items with filtering
- **POST `/api/manager/stock`** - Add new stock item
- **PUT `/api/manager/stock`** - Update stock item
- **DELETE `/api/manager/stock`** - Soft delete stock item

### Kitchen Stock Management
- **GET `/api/manager/kitchen-stock`** - Get kitchen-specific stock
- **POST `/api/manager/kitchen-stock`** - Add/Use/Waste/Adjust stock
- **PUT `/api/manager/kitchen-stock`** - Update kitchen stock

### Stock Alerts
- **GET `/api/manager/stock-alerts`** - Get all stock alerts
- **POST `/api/manager/stock-alerts`** - Create purchase order or dismiss alerts

### Financial Analytics
- **GET `/api/manager/finance`** - Get financial analytics
- **POST `/api/manager/finance`** - Create expense
- **PUT `/api/manager/finance`** - Update expense status

### Payment Processing
- **GET `/api/manager/payments`** - Get all payments
- **POST `/api/manager/payments`** - Create payment (Card, Cash, Mobile)
- **PUT `/api/manager/payments`** - Update payment status (webhook)

### Supplier Management
- **GET `/api/manager/suppliers`** - Get all suppliers
- **POST `/api/manager/suppliers`** - Create supplier
- **PUT `/api/manager/suppliers`** - Update supplier
- **DELETE `/api/manager/suppliers`** - Deactivate supplier

---

## 3. Features

### Branch-Specific Stock Management
- Each branch manages its own inventory
- Super Admin/Manager can view all branches
- Stock categories: FOOD, KITCHEN, HOUSEKEEPING, MAINTENANCE
- Real-time stock tracking with transactions

### Kitchen Stock Management
- Food categories: PRODUCE, PROTEINS, DAIRY, DRY_GOODS, BEVERAGES
- Track expiry dates with alerts
- Add stock, use stock, waste tracking, adjustments
- Link stock to menu items and orders
- Automatic low stock notifications

### Financial Analytics
- **Income Tracking**:
  - Room revenue (bookings)
  - Restaurant revenue (orders)
  - Event revenue
  - Spa/Service revenue
- **Expense Tracking**:
  - Categories: SALARIES, FOOD_COST, BEVERAGES, SUPPLIES, MAINTENANCE, UTILITIES, MARKETING, INSURANCE, RENT, TAXES, BANK_FEES, OTHER
  - Approval workflow
  - Recurring expenses
- **Analytics**:
  - Daily/Weekly/Monthly/Yearly reports
  - Profit margin calculation
  - Category breakdown
  - Trend analysis

### Stock Alerts
- **Low Stock Alerts** - Items below reorder level
- **Out of Stock Alerts** - Zero quantity items
- **Expiring Soon Alerts** - Items expiring within 7 days
- **Critical Alerts** - Items below 20% of reorder level
- Auto-create purchase orders from alerts

### Payment Processing
- **Card Payments** (Stripe integration ready)
- **Cash Payments** - Instant processing
- **Mobile Money** (MTN, Airtel) - Simulated for Rwanda
- **Refunds** - Full and partial refunds
- **Payment Summaries** - By status, method, date range

---

## 4. Usage Examples

### Adding Kitchen Stock
```javascript
POST /api/manager/kitchen-stock
{
  "action": "ADD_STOCK",
  "name": "Chicken Breast",
  "category": "PROTEINS",
  "quantity": 50,
  "unit": "KG",
  "unitCost": 2500,
  "expiryDate": "2026-03-15",
  "notes": "Fresh delivery from Butchery"
}
```

### Using Kitchen Stock
```javascript
POST /api/manager/kitchen-stock
{
  "action": "USE_STOCK",
  "stockItemId": "stock_item_id",
  "useQuantity": 5,
  "orderId": "order_123"
}
```

### Creating Expense
```javascript
POST /api/manager/finance
{
  "category": "FOOD_COST",
  "description": "Weekly produce order",
  "amount": 150000,
  "vendorName": "Fresh Farm Suppliers",
  "expenseDate": "2026-02-19",
  "paymentMethod": "BANK_TRANSFER"
}
```

### Processing Payment
```javascript
POST /api/manager/payments
{
  "type": "PROCESS_CASH",
  "amount": 50000,
  "bookingId": "booking_id",
  "description": "Check-in payment"
}
```

### Getting Financial Report
```javascript
GET /api/manager/finance?period=monthly&startDate=2026-01-01&endDate=2026-01-31
```

---

## 5. Next Steps

To activate these features:

1. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

2. **Run Database Migration**:
   ```bash
   npx prisma db push
   # or
   npx prisma migrate dev
   ```

3. **Configure Environment Variables** (for real Stripe):
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

4. **Test APIs** using the endpoints documented above.

---

## 6. Security

- All endpoints require authentication
- Role-based access control (RBAC)
- Branch-level data isolation
- Audit trails via transactions

---

## 7. Error Handling

All APIs return consistent JSON responses:
```json
{
  "success": true,
  "data": { ... },
  "error": "Error message if failed"
}
```

---

## Implementation Date: 2026-02-19
