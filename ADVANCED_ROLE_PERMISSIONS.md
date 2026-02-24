# Advanced Role & Permission System - Complete Documentation

## Overview
This document describes the advanced role-based access control (RBAC) system implemented for the Eastgate Hotel Management System.

## Table of Contents
1. [User Roles](#user-roles)
2. [Role Permissions](#role-permissions)
3. [API Endpoints](#api-endpoints)
4. [Staff Types](#staff-types)
5. [Dashboard Features](#dashboard-features)

---

## User Roles

### 1. SUPER_ADMIN
- Full system access
- Can manage all branches
- Can assign managers to branches
- Can create/delete any staff
- Access to all analytics and reports

### 2. SUPER_MANAGER
- High-level management access
- Can manage all branches
- Can assign managers to branches
- Cannot delete super admin accounts
- Access to most analytics and reports

### 3. BRANCH_MANAGER
- Assigned to specific branch(es)
- Can manage staff at their branch only
- Can add waiters, receptionists, kitchen staff
- Can view branch-specific analytics
- Cannot access other branches' data

### 4. MANAGER
- General manager role
- Similar to branch manager but without explicit branch restriction
- Can manage staff, rooms, bookings, orders

### 5. RECEPTIONIST
- Front desk operations
- Can register guests
- Can check-in/check-out guests
- Can manage bookings
- Can view rooms

### 6. WAITER
- Restaurant service
- Can take orders
- Can serve orders
- Can view menu

### 7. CHEF
- Kitchen management
- Can manage kitchen orders
- Can view menu
- Can manage food preparation

### 8. KITCHEN_STAFF
- Kitchen support
- Can view kitchen orders
- Can update order status

### 9. STAFF
- General staff
- Basic view access
- Cannot modify data

---

## Role Permissions

| Permission | SUPER_ADMIN | SUPER_MANAGER | BRANCH_MANAGER | MANAGER | RECEPTIONIST | WAITER | CHEF | KITCHEN_STAFF |
|------------|-------------|---------------|----------------|---------|--------------|--------|------|----------------|
| manage_users | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| manage_staff | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| manage_branches | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| manage_rooms | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| manage_bookings | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| manage_orders | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| manage_menu | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| manage_events | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| manage_inventory | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| manage_finance | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| view_analytics | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| manage_settings | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| manage_ai_insights | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| assign_managers | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| manage_all_branches | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| manage_branch_only | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| add_waiters | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| add_receptionists | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| add_kitchen_staff | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| register_guests | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| check_in_guests | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| check_out_guests | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| manage_guests | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| view_rooms | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| take_orders | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| serve_orders | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| manage_tables | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| view_menu | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| kitchen_orders | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| prepare_food | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| manage_prep | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| view_own_tasks | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

---

## API Endpoints

### 1. Super Admin - Manager Assignment API
**Endpoint:** `/api/super-admin/assign-managers`

#### GET - Fetch all managers and branches
```
Query Parameters:
- branchId (optional): Filter by specific branch

Response:
{
  "success": true,
  "managers": [...],
  "branches": [...],
  "count": 5
}
```

#### POST - Create new manager
```json
{
  "name": "John Doe",
  "email": "john@eastgate.com",
  "phone": "+1234567890",
  "password": "securepassword123",
  "role": "BRANCH_MANAGER",
  "department": "Management",
  "branchId": "branch_uuid_here"
}
```

#### PUT - Assign manager to branch
```json
{
  "branchId": "branch_uuid_here",
  "managerId": "manager_uuid_here",
  "action": "assign" // or "unassign"
}
```

#### DELETE - Remove manager
```
Query Parameters:
- id: Manager ID
```

---

### 2. Branch Staff Management API
**Endpoint:** `/api/branch/staff`

#### GET - Fetch branch staff
```
Query Parameters:
- branchId (optional): Filter by branch (super admin only)
- status (optional): Filter by status (active/inactive)
- role (optional): Filter by role
- department (optional): Filter by department
- search (optional): Search by name/email/phone
```

#### POST - Add new staff member
```json
{
  "name": "Jane Smith",
  "email": "jane@eastgate.com",
  "phone": "+1234567890",
  "role": "WAITER", // WAITER, RECEPTIONIST, CHEF, KITCHEN_STAFF, STAFF
  "department": "Restaurant",
  "shift": "morning",
  "password": "staffpassword123"
}
```

#### PUT - Update staff member
```json
{
  "id": "staff_uuid_here",
  "name": "Jane Smith",
  "phone": "+1234567890",
  "shift": "evening",
  "status": "active"
}
```

#### DELETE - Remove staff
```
Query Parameters:
- id: Staff ID
```

---

### 3. Waiter Dashboard API
**Endpoint:** `/api/waiter/dashboard`

#### GET - Fetch waiter dashboard data
```
Query Parameters:
- date (optional): Filter by date (YYYY-MM-DD)

Response:
{
  "success": true,
  "date": "2024-01-15",
  "orders": {
    "all": [...],
    "pending": [...],
    "preparing": [...],
    "ready": [...],
    "served": [...],
    "myOrders": [...]
  },
  "tableStats": {...},
  "menuItems": [...],
  "revenue": 1500.00,
  "orderStats": {...}
}
```

#### POST - Create new order
```json
{
  "tableNumber": 5,
  "guestName": "Guest Name",
  "items": [
    {"id": "item_id", "name": "Burger", "price": 15.00, "quantity": 2}
  ],
  "notes": "No onions",
  "roomCharge": false,
  "roomId": "room_uuid_here"
}
```

#### PUT - Update order status
```json
{
  "orderId": "order_uuid_here",
  "status": "served" // pending, preparing, ready, served, completed
}
```

---

### 4. Kitchen Dashboard API
**Endpoint:** `/api/kitchen/dashboard`

#### GET - Fetch kitchen dashboard data
```
Query Parameters:
- date (optional): Filter by date (YYYY-MM-DD)

Response:
{
  "success": true,
  "date": "2024-01-15",
  "orders": [...],
  "ordersByStatus": {
    "pending": [...],
    "preparing": [...],
    "ready": [...],
    "completed": [...]
  },
  "stats": {...},
  "menuItems": [...],
  "avgPrepTime": 15
}
```

#### POST - Update order preparation status
```json
{
  "orderId": "order_uuid_here",
  "action": "start_preparing" // start_preparing, mark_ready, complete
}
```

#### PUT - Bulk update orders
```json
{
  "orderIds": ["order1", "order2", "order3"],
  "status": "ready"
}
```

---

### 5. Receptionist Dashboard API
**Endpoint:** `/api/receptionist/dashboard`

#### GET - Fetch receptionist dashboard data
```
Query Parameters:
- date (optional): Filter by date (YYYY-MM-DD)

Response:
{
  "success": true,
  "date": "2024-01-15",
  "bookings": {
    "today": [...],
    "active": [...],
    "todayCheckIns": [...],
    "todayCheckOuts": [...]
  },
  "rooms": {
    "all": [...],
    "available": [...],
    "occupancy": {...}
  },
  "guests": [...],
  "stats": {...}
}
```

#### POST - Register guest or create booking

**Register Guest:**
```json
{
  "action": "register_guest",
  "name": "Guest Name",
  "email": "guest@email.com",
  "phone": "+1234567890",
  "nationality": "USA"
}
```

**Create Booking:**
```json
{
  "action": "create_booking",
  "guestName": "Guest Name",
  "guestEmail": "guest@email.com",
  "guestPhone": "+1234567890",
  "roomId": "room_uuid_here",
  "roomNumber": "101",
  "roomType": "Standard",
  "checkIn": "2024-01-15",
  "checkOut": "2024-01-18",
  "adults": 2,
  "children": 0,
  "totalAmount": 300.00,
  "paymentMethod": "card",
  "specialRequests": "Early check-in"
}
```

#### PUT - Check in/out guests
```json
{
  "bookingId": "booking_uuid_here",
  "action": "check_in" // check_in, check_out, confirm_booking, cancel_booking
}
```

---

## Staff Types

### Front Desk Staff
- **RECEPTIONIST**: Handles guest registration, bookings, check-in/check-out

### Restaurant Staff
- **WAITER**: Takes orders, serves food, manages tables

### Kitchen Staff
- **CHEF**: Head chef, manages kitchen operations
- **KITCHEN_STAFF**: Kitchen support staff

### Management Staff
- **BRANCH_MANAGER**: Manages a specific branch
- **MANAGER**: General manager role
- **SUPER_MANAGER**: High-level manager with multi-branch access
- **SUPER_ADMIN**: Full system administrator

---

## Dashboard Features

### Waiter Dashboard
- View all orders (pending, preparing, ready, served)
- Take new orders
- View menu items
- Track table status
- View daily revenue
- Personal order tracking

### Kitchen Dashboard
- View pending orders
- Start order preparation
- Mark orders as ready
- Bulk order processing
- View menu reference
- Preparation time tracking

### Receptionist Dashboard
- Today's bookings
- Check-in/Check-out management
- Available rooms
- Room occupancy stats
- Guest registration
- Guest history
- Booking management

---

## Authentication

All API endpoints require authentication via NextAuth.js JWT tokens. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

## Error Handling

All endpoints return standard HTTP status codes:
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Server Error

Error response format:
```json
{
  "error": "Error message description"
}
```

Success response format:
```json
{
  "success": true,
  "data": {...}
}
```

---

## Default Passwords

When creating new staff without a password:
- Default password format: `{email_prefix}123`
- Example: `john@eastgate.com` → `john123`

---

## Database Schema Updates

The following changes were made to support the new role system:

### Branches Table
- Added `manager_id` field to track assigned manager

### Staff Table Roles
- `SUPER_ADMIN`: System administrator
- `SUPER_MANAGER`: High-level manager
- `BRANCH_MANAGER`: Branch-specific manager
- `MANAGER`: General manager
- `RECEPTIONIST`: Front desk staff
- `WAITER`: Restaurant waiter
- `CHEF`: Head chef
- `KITCHEN_STAFF`: Kitchen support
- `STAFF`: General staff

## Overview
This document describes the advanced role-based access control (RBAC) system implemented for the Eastgate Hotel Management System.

## Table of Contents
1. [User Roles](#user-roles)
2. [Role Permissions](#role-permissions)
3. [API Endpoints](#api-endpoints)
4. [Staff Types](#staff-types)
5. [Dashboard Features](#dashboard-features)

---

## User Roles

### 1. SUPER_ADMIN
- Full system access
- Can manage all branches
- Can assign managers to branches
- Can create/delete any staff
- Access to all analytics and reports

### 2. SUPER_MANAGER
- High-level management access
- Can manage all branches
- Can assign managers to branches
- Cannot delete super admin accounts
- Access to most analytics and reports

### 3. BRANCH_MANAGER
- Assigned to specific branch(es)
- Can manage staff at their branch only
- Can add waiters, receptionists, kitchen staff
- Can view branch-specific analytics
- Cannot access other branches' data

### 4. MANAGER
- General manager role
- Similar to branch manager but without explicit branch restriction
- Can manage staff, rooms, bookings, orders

### 5. RECEPTIONIST
- Front desk operations
- Can register guests
- Can check-in/check-out guests
- Can manage bookings
- Can view rooms

### 6. WAITER
- Restaurant service
- Can take orders
- Can serve orders
- Can view menu

### 7. CHEF
- Kitchen management
- Can manage kitchen orders
- Can view menu
- Can manage food preparation

### 8. KITCHEN_STAFF
- Kitchen support
- Can view kitchen orders
- Can update order status

### 9. STAFF
- General staff
- Basic view access
- Cannot modify data

---

## Role Permissions

| Permission | SUPER_ADMIN | SUPER_MANAGER | BRANCH_MANAGER | MANAGER | RECEPTIONIST | WAITER | CHEF | KITCHEN_STAFF |
|------------|-------------|---------------|----------------|---------|--------------|--------|------|----------------|
| manage_users | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| manage_staff | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| manage_branches | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| manage_rooms | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| manage_bookings | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| manage_orders | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| manage_menu | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| manage_events | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| manage_inventory | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| manage_finance | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| view_analytics | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| manage_settings | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| manage_ai_insights | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| assign_managers | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| manage_all_branches | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| manage_branch_only | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| add_waiters | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| add_receptionists | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| add_kitchen_staff | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| register_guests | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| check_in_guests | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| check_out_guests | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| manage_guests | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| view_rooms | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| take_orders | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| serve_orders | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| manage_tables | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| view_menu | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| kitchen_orders | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| prepare_food | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| manage_prep | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| view_own_tasks | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

---

## API Endpoints

### 1. Super Admin - Manager Assignment API
**Endpoint:** `/api/super-admin/assign-managers`

#### GET - Fetch all managers and branches
```
Query Parameters:
- branchId (optional): Filter by specific branch

Response:
{
  "success": true,
  "managers": [...],
  "branches": [...],
  "count": 5
}
```

#### POST - Create new manager
```json
{
  "name": "John Doe",
  "email": "john@eastgate.com",
  "phone": "+1234567890",
  "password": "securepassword123",
  "role": "BRANCH_MANAGER",
  "department": "Management",
  "branchId": "branch_uuid_here"
}
```

#### PUT - Assign manager to branch
```json
{
  "branchId": "branch_uuid_here",
  "managerId": "manager_uuid_here",
  "action": "assign" // or "unassign"
}
```

#### DELETE - Remove manager
```
Query Parameters:
- id: Manager ID
```

---

### 2. Branch Staff Management API
**Endpoint:** `/api/branch/staff`

#### GET - Fetch branch staff
```
Query Parameters:
- branchId (optional): Filter by branch (super admin only)
- status (optional): Filter by status (active/inactive)
- role (optional): Filter by role
- department (optional): Filter by department
- search (optional): Search by name/email/phone
```

#### POST - Add new staff member
```json
{
  "name": "Jane Smith",
  "email": "jane@eastgate.com",
  "phone": "+1234567890",
  "role": "WAITER", // WAITER, RECEPTIONIST, CHEF, KITCHEN_STAFF, STAFF
  "department": "Restaurant",
  "shift": "morning",
  "password": "staffpassword123"
}
```

#### PUT - Update staff member
```json
{
  "id": "staff_uuid_here",
  "name": "Jane Smith",
  "phone": "+1234567890",
  "shift": "evening",
  "status": "active"
}
```

#### DELETE - Remove staff
```
Query Parameters:
- id: Staff ID
```

---

### 3. Waiter Dashboard API
**Endpoint:** `/api/waiter/dashboard`

#### GET - Fetch waiter dashboard data
```
Query Parameters:
- date (optional): Filter by date (YYYY-MM-DD)

Response:
{
  "success": true,
  "date": "2024-01-15",
  "orders": {
    "all": [...],
    "pending": [...],
    "preparing": [...],
    "ready": [...],
    "served": [...],
    "myOrders": [...]
  },
  "tableStats": {...},
  "menuItems": [...],
  "revenue": 1500.00,
  "orderStats": {...}
}
```

#### POST - Create new order
```json
{
  "tableNumber": 5,
  "guestName": "Guest Name",
  "items": [
    {"id": "item_id", "name": "Burger", "price": 15.00, "quantity": 2}
  ],
  "notes": "No onions",
  "roomCharge": false,
  "roomId": "room_uuid_here"
}
```

#### PUT - Update order status
```json
{
  "orderId": "order_uuid_here",
  "status": "served" // pending, preparing, ready, served, completed
}
```

---

### 4. Kitchen Dashboard API
**Endpoint:** `/api/kitchen/dashboard`

#### GET - Fetch kitchen dashboard data
```
Query Parameters:
- date (optional): Filter by date (YYYY-MM-DD)

Response:
{
  "success": true,
  "date": "2024-01-15",
  "orders": [...],
  "ordersByStatus": {
    "pending": [...],
    "preparing": [...],
    "ready": [...],
    "completed": [...]
  },
  "stats": {...},
  "menuItems": [...],
  "avgPrepTime": 15
}
```

#### POST - Update order preparation status
```json
{
  "orderId": "order_uuid_here",
  "action": "start_preparing" // start_preparing, mark_ready, complete
}
```

#### PUT - Bulk update orders
```json
{
  "orderIds": ["order1", "order2", "order3"],
  "status": "ready"
}
```

---

### 5. Receptionist Dashboard API
**Endpoint:** `/api/receptionist/dashboard`

#### GET - Fetch receptionist dashboard data
```
Query Parameters:
- date (optional): Filter by date (YYYY-MM-DD)

Response:
{
  "success": true,
  "date": "2024-01-15",
  "bookings": {
    "today": [...],
    "active": [...],
    "todayCheckIns": [...],
    "todayCheckOuts": [...]
  },
  "rooms": {
    "all": [...],
    "available": [...],
    "occupancy": {...}
  },
  "guests": [...],
  "stats": {...}
}
```

#### POST - Register guest or create booking

**Register Guest:**
```json
{
  "action": "register_guest",
  "name": "Guest Name",
  "email": "guest@email.com",
  "phone": "+1234567890",
  "nationality": "USA"
}
```

**Create Booking:**
```json
{
  "action": "create_booking",
  "guestName": "Guest Name",
  "guestEmail": "guest@email.com",
  "guestPhone": "+1234567890",
  "roomId": "room_uuid_here",
  "roomNumber": "101",
  "roomType": "Standard",
  "checkIn": "2024-01-15",
  "checkOut": "2024-01-18",
  "adults": 2,
  "children": 0,
  "totalAmount": 300.00,
  "paymentMethod": "card",
  "specialRequests": "Early check-in"
}
```

#### PUT - Check in/out guests
```json
{
  "bookingId": "booking_uuid_here",
  "action": "check_in" // check_in, check_out, confirm_booking, cancel_booking
}
```

---

## Staff Types

### Front Desk Staff
- **RECEPTIONIST**: Handles guest registration, bookings, check-in/check-out

### Restaurant Staff
- **WAITER**: Takes orders, serves food, manages tables

### Kitchen Staff
- **CHEF**: Head chef, manages kitchen operations
- **KITCHEN_STAFF**: Kitchen support staff

### Management Staff
- **BRANCH_MANAGER**: Manages a specific branch
- **MANAGER**: General manager role
- **SUPER_MANAGER**: High-level manager with multi-branch access
- **SUPER_ADMIN**: Full system administrator

---

## Dashboard Features

### Waiter Dashboard
- View all orders (pending, preparing, ready, served)
- Take new orders
- View menu items
- Track table status
- View daily revenue
- Personal order tracking

### Kitchen Dashboard
- View pending orders
- Start order preparation
- Mark orders as ready
- Bulk order processing
- View menu reference
- Preparation time tracking

### Receptionist Dashboard
- Today's bookings
- Check-in/Check-out management
- Available rooms
- Room occupancy stats
- Guest registration
- Guest history
- Booking management

---

## Authentication

All API endpoints require authentication via NextAuth.js JWT tokens. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

## Error Handling

All endpoints return standard HTTP status codes:
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Server Error

Error response format:
```json
{
  "error": "Error message description"
}
```

Success response format:
```json
{
  "success": true,
  "data": {...}
}
```

---

## Default Passwords

When creating new staff without a password:
- Default password format: `{email_prefix}123`
- Example: `john@eastgate.com` → `john123`

---

## Database Schema Updates

The following changes were made to support the new role system:

### Branches Table
- Added `manager_id` field to track assigned manager

### Staff Table Roles
- `SUPER_ADMIN`: System administrator
- `SUPER_MANAGER`: High-level manager
- `BRANCH_MANAGER`: Branch-specific manager
- `MANAGER`: General manager
- `RECEPTIONIST`: Front desk staff
- `WAITER`: Restaurant waiter
- `CHEF`: Head chef
- `KITCHEN_STAFF`: Kitchen support
- `STAFF`: General staff

