# EastGate APIs - Quick Reference Guide

## 🚀 Core APIs Overview

### 1. Payment Processing
**Endpoint:** `POST /api/payments/process`
**Auth:** Bearer token (any authenticated user)
**Purpose:** Real payment processing for bookings, orders, events, services

```json
{
  "amount": 25000,
  "currency": "RWF",
  "entityType": "booking|order|event|service",
  "entityId": "id_123",
  "paymentMethod": "card|mobile_money|cash|bank_transfer|wallet",
  "paymentGateway": "stripe|flutterwave|paypal|mtn_momo|airtel_money"
}
```

**Payment Methods:**
- `card` → Stripe, Flutterwave, PayPal
- `mobile_money` → MTN Momo, Airtel Money
- `cash` → Local processing
- `bank_transfer` → SWIFT/Local bank
- `wallet` → In-app wallet

**Gateways Available:**
- **Stripe** - card payments with clientSecret
- **PayPal** - order creation with approval flow
- **Flutterwave** - multi-method with payment link
- **MTN Mobile Money** - MSISDN-based requests
- **Airtel Money** - subscriber-based payments

---

### 2. Manager Assignment
**Endpoint:** `POST /api/super-admin/managers/assign`
**Auth:** Bearer token (SUPER_ADMIN only)
**Purpose:** Assign managers to multiple branches with permission flags

```json
{
  "managerId": "mg_001",
  "branchIds": ["br_kigali", "br_butare", "br_gisenyi", "br_muhanga"],
  "canManageMenu": true,
  "canManageStaff": true,
  "canManageRevenue": true,
  "notes": "Assigned to northern branches"
}
```

**View Assignments:**
```
GET /api/super-admin/managers/assign?level=manager&isActive=true
```

---

### 3. Staff Management
**Endpoint:** `POST /api/manager/staff`
**Auth:** Bearer token (manager/super_manager/super_admin)
**Purpose:** Create staff with automatic role-based permissions

```json
{
  "name": "Jean Claude",
  "email": "jean@eastgate.rw",
  "password": "SecurePass123!",
  "phone": "+250788123456",
  "role": "waiter|stock_manager|receptionist|kitchen_staff",
  "department": "restaurant|reception|kitchen|housekeeping|stock",
  "branchId": "br_001",
  "shift": "morning|afternoon|night",
  "salary": 150000,
  "reportsTo": "mgr_001"
}
```

**Staff Roles & Auto-Generated Permissions:**

| Role | Permissions | Key Actions |
|------|-------------|-------------|
| **Waiter** | take_orders, view_menu, update_order_status, add_payment, view_table_status | Serve customers, manage orders |
| **Stock Manager** | manage_inventory, view_stock_reports, create_purchase_orders, manage_suppliers | Monitor stock, order supplies |
| **Receptionist** | manage_bookings, check_in_guests, check_out_guests, issue_invoices | Handle guest registration |
| **Kitchen Staff** | view_orders, update_order_status, view_menu_items, mark_item_ready | Prepare food items |

**Fetch Staff:**
```
GET /api/manager/staff?branchId=br_001&role=waiter&status=active&page=1&limit=10
```

**Update Staff:**
```
PATCH /api/manager/staff/:id
```

**Deactivate Staff (Soft Delete):**
```
DELETE /api/manager/staff/:id
```

---

### 4. Menu Management
**Endpoint:** `POST /api/manager/menu`
**Auth:** Bearer token (manager with canManageMenu permission)
**Purpose:** Create menu items with local device image uploads

**Upload Menu Item:**
```bash
curl -X POST http://localhost:3000/api/manager/menu \
  -H "Authorization: Bearer [token]" \
  -F "name=Brochettes" \
  -F "description=Grilled meat skewers" \
  -F "category=Main Course" \
  -F "price=8500" \
  -F "preparationTime=15" \
  -F "images=@brochettes.jpg" \
  -F "images=@brochettes2.jpg"
```

**Fetch Menu Items:**
```
GET /api/manager/menu?branchId=br_001&category=appetizer&isApproved=true
```

**Update Menu Item:**
```
PATCH /api/manager/menu/:id
```

**Delete Menu Item:**
```
DELETE /api/manager/menu/:id
```

---

### 5. Revenue Analytics
**Endpoint:** `GET /api/manager/revenue/advanced`
**Auth:** Bearer token (manager/super_manager/super_admin)
**Purpose:** Revenue tracking with date range, method, and type filters

```
GET /api/manager/revenue/advanced?startDate=2024-01-01&endDate=2024-01-31&paymentType=order&paymentMethod=card
```

**Response Includes:**
- Total revenue for period
- Payment method breakdown (card, mobile_money, cash, etc.)
- Revenue by type (booking, order, event, service)
- Daily revenue aggregation
- Branch-wise breakdown

**Helper Functions:**
```
getSummary(branchIds) → { today, thisMonth, thisYear }
generateReports(branchIds, period) → { periods: [...] } by daily/weekly/monthly
```

---

### 6. Manager Dashboard
**Endpoint:** `GET /api/manager/dashboard`
**Auth:** Bearer token (manager/super_manager/super_admin)
**Purpose:** Comprehensive real-time dashboard metrics

```
GET /api/manager/dashboard?branchId=br_kigali
```

**Dashboard Includes:**
- **Overview:** Today/week/month revenue, transactions, orders, bookings
- **Rooms:** Status breakdown (available, occupied, maintenance, cleaning)
- **Staff:** Total, active, online count, breakdown by role/department
- **Bookings:** Total, occupancy rate, revenue, status breakdown
- **Orders:** Total, pending, paid/unpaid count, status breakdown
- **Payments:** Completed/pending/failed by method
- **Top Items:** 5 most-ordered menu items
- **Recent Activity:** 15 most recent activity logs
- **Alerts:** Pending items needing attention

---

## 🔐 Authentication

**Token Format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Contents:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "role": "manager|super_manager|super_admin|waiter|...",
  "branchId": "br_001",
  "permissions": {
    "take_orders": true,
    "view_menu": true,
    "...": true
  },
  "type": "access",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Role Hierarchy:**
```
SUPER_ADMIN (all access)
  ↓
SUPER_MANAGER (multiple branches)
  ↓
MANAGER (single branch)
  ↓
STAFF (role-based permissions)
```

---

## 🛠️ Database Models

**Branch**
- 4 branches: Kigali, Butare, Gisenyi, Muhanga
- Each has rooms, staff, reservations

**Manager**
- 3 levels: manager, senior_manager, super_manager
- Assigned to branches via ManagerAssignment M2M

**Staff**
- 4 roles: waiter, stock_manager, receptionist, kitchen_staff
- Each has automatic permissions JSON based on role
- Reports to manager/supervisor

**Payment**
- Unified for booking/order/event/service
- 5 payment methods, 4 gateways
- Full transaction tracking

**MenuItem**
- Has images stored locally in public/menu-items
- Track creator/modifier
- Approval status

---

## 📊 Quick Stats Endpoints

**Today's Revenue:**
```
GET /api/manager/dashboard → data.overview.today.totalRevenue
```

**Staff Count by Status:**
```
GET /api/manager/dashboard → data.staff.active, inactive, onlineCount
```

**Room Occupancy:**
```
GET /api/manager/dashboard → data.rooms.status
```

**Pending Orders:**
```
GET /api/manager/dashboard → data.orders.pending
```

**Pending Payments:**
```
GET /api/manager/dashboard → data.payments.pending
```

---

## 🔄 Common Workflows

### Workflow 1: Assign Manager to Branches
1. Super Admin calls `POST /api/super-admin/managers/assign`
2. Pass managerId and array of 4 branchIds
3. Set permission flags (canManageMenu, canManageStaff, canManageRevenue)
4. Manager can now access branch data

### Workflow 2: Create Waiter
1. Manager calls `POST /api/manager/staff`
2. Role = "waiter"
3. System auto-generates permissions (take_orders, view_menu, etc.)
4. Waiter receives credentials and must change password on first login

### Workflow 3: Upload Menu Items
1. Manager calls `POST /api/manager/menu` with multipart form
2. Includes images from local device (JPG, PNG)
3. Images stored in public/menu-items with UUID names
4. Menu item created with image metadata

### Workflow 4: Process Payment
1. Customer/guest calls `POST /api/payments/process`
2. Select payment method (card, mobile_money, cash, etc.)
3. System routes to appropriate gateway
4. Returns transaction status and receipt URL

### Workflow 5: View Dashboard
1. Manager calls `GET /api/manager/dashboard?branchId=br_kigali`
2. Returns ~50+ metrics in single request (11 parallel queries)
3. Auto-scoped to manager's assigned branches

---

## ⚠️ Important Notes

**File Uploads:**
- Images are stored locally in `public/menu-items/`
- No external URLs - pure local storage
- Filenames are UUID-based to prevent collisions
- Metadata (uploadedAt, uploadedBy) tracked in JSON

**Payment Processing:**
- All gateways ready for LIVE integration
- Environment variables needed: API keys from each provider
- Transaction IDs generated for tracking
- Activity logs created for every payment

**Access Control:**
- Managers see only their branch data
- Super managers see assigned branches only
- Super admin sees all data
- Cross-branch access is denied at endpoint level

**Activity Logging:**
- Every create/update/delete creates ActivityLog record
- Tracks: action, entity, entityId, userId, details
- Enables full audit trail for compliance

---

## 🚀 Quick Start Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Start development server
npm run dev

# Test specific endpoint
curl -X GET http://localhost:3000/api/manager/dashboard \
  -H "Authorization: Bearer [token]"
```

---

## 📋 Response Format

All successful responses follow:
```json
{
  "success": true,
  "data": { /* endpoint-specific data */ }
}
```

All error responses follow:
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400|401|403|404|500
}
```

---

## 🎯 API Maturity

| API | Status | Ready For |
|-----|--------|-----------|
| Payment Processing | ✅ Production | Live integration with API keys |
| Manager Assignment | ✅ Production | Branch management |
| Staff Management | ✅ Production | HR operations |
| Menu Management | ✅ Production | Chef/Manager uploads |
| Revenue Tracking | ✅ Production | Business analytics |
| Dashboard | ✅ Production | Real-time monitoring |

---

**Last Updated:** Final Implementation
**Version:** 1.0.0 - Complete
**Environment:** Next.js 15 + Prisma 6 + MySQL
