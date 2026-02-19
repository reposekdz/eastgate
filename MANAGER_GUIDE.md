# Branch Manager System Guide

## Overview

The Eastgate Hotel Branch Manager System provides comprehensive tools for managing hotel operations at the branch level. Managers receive credentials from Super Managers and have full access to branch-level operations, staff management, analytics, and reporting.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Database Setup (MySQL)](#database-setup-mysql)
3. [Manager Roles & Permissions](#manager-roles--permissions)
4. [Features](#features)
5. [API Endpoints](#api-endpoints)
6. [Staff Credential Management](#staff-credential-management)
7. [Analytics & Reports](#analytics--reports)
8. [Best Practices](#best-practices)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MySQL 8.0+ database server
- npm or yarn package manager
- Basic understanding of hotel operations

### Installation

1. **Clone the repository:**
   ```bash
   cd eastgate
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/eastgate_hotel"
   NEXTAUTH_SECRET="your-secret-key-change-in-production"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Initialize the database:**
   ```bash
   npx prisma db push
   npx prisma generate
   npm run db:seed
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`

## Database Setup (MySQL)

### MySQL Configuration

1. **Install MySQL Server:**
   - Download from [https://dev.mysql.com/downloads/](https://dev.mysql.com/downloads/)
   - Follow installation instructions for your operating system

2. **Create Database:**
   ```sql
   CREATE DATABASE eastgate_hotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Create Database User:**
   ```sql
   CREATE USER 'eastgate_user'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON eastgate_hotel.* TO 'eastgate_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

4. **Update DATABASE_URL:**
   ```env
   DATABASE_URL="mysql://eastgate_user:your_secure_password@localhost:3306/eastgate_hotel"
   ```

5. **Run Migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

### Database Schema

The system uses the following main tables:
- **User** - Staff and manager accounts
- **Branch** - Hotel branch information
- **Room** - Room inventory and status
- **Booking** - Guest reservations
- **Guest** - Customer information
- **Order** - Restaurant orders
- **MenuItem** - Menu items and pricing
- **Service** - Additional services (spa, events, etc.)
- **Payment** - Payment transactions
- **Revenue** - Daily revenue tracking
- **Shift** - Staff scheduling
- **PerformanceReview** - Staff evaluations
- **Notification** - System notifications

## Manager Roles & Permissions

### Role Hierarchy

1. **SUPER_ADMIN**
   - Full system access
   - Manage all branches
   - System configuration

2. **SUPER_MANAGER**
   - Manage multiple branches
   - Create branch managers
   - Generate system-wide reports

3. **BRANCH_MANAGER** (Your Role)
   - Manage single branch operations
   - Create and manage staff accounts
   - Access branch analytics and reports
   - Manage bookings, orders, and services
   - Set prices and availability
   - Generate branch reports

### Manager Permissions

As a Branch Manager, you can:
- ✅ Create staff accounts and generate credentials
- ✅ View comprehensive dashboard with real-time metrics
- ✅ Manage bookings (create, update, check-in, check-out)
- ✅ Manage room inventory and pricing
- ✅ Process orders and manage restaurant operations
- ✅ View and respond to guest reviews
- ✅ Generate financial, operational, and guest reports
- ✅ Access advanced analytics and predictions
- ✅ Manage staff schedules and performance
- ✅ Configure branch settings
- ❌ Cannot access other branches (unless SUPER_MANAGER)
- ❌ Cannot modify system-level settings

## Features

### 1. Dashboard

**Endpoint:** `GET /api/manager/dashboard`

The comprehensive dashboard provides:
- Real-time revenue metrics (room, restaurant, services)
- Occupancy rates and room status
- Active orders and pending requests
- Staff attendance and performance
- Recent activities timeline
- Performance trends and comparisons
- Smart alerts and notifications
- Top performing staff and menu items

**Query Parameters:**
- `period` - Data period: today, week, month, year
- `branchId` - Target branch (SUPER_MANAGER only)

**Example Response:**
```json
{
  "success": true,
  "period": "month",
  "metrics": {
    "totalRevenue": 150000,
    "occupancyRate": 87.5,
    "totalBookings": 45,
    "activeStaff": 23,
    "averageRating": 4.6
  },
  "trends": {
    "revenueGrowth": 12.5
  },
  "alerts": [
    {
      "type": "success",
      "title": "High Occupancy",
      "message": "87.5% occupancy rate"
    }
  ]
}
```

### 2. Staff Management

**Endpoints:**
- `GET /api/manager/staff` - List all staff
- `POST /api/manager/staff` - Create new staff member
- `PATCH /api/manager/staff` - Update staff details

#### Creating Staff Accounts

When creating a new staff member, you (the manager) set their initial credentials:

```javascript
// POST /api/manager/staff
{
  "name": "John Doe",
  "email": "john.doe@eastgate.com",
  "password": "TemporaryPassword123!",
  "phone": "+250788123456",
  "role": "RECEPTIONIST",
  "branchId": "your-branch-id"
}
```

**Available Staff Roles:**
- RECEPTIONIST
- WAITER
- RESTAURANT_STAFF
- CHEF
- KITCHEN_STAFF
- HOUSEKEEPING
- SPA_THERAPIST
- ACCOUNTANT
- EVENT_MANAGER
- SECURITY
- MAINTENANCE
- DRIVER

**Response:**
```json
{
  "success": true,
  "staff": {
    "id": "usr_xxx",
    "name": "John Doe",
    "email": "john.doe@eastgate.com",
    "role": "RECEPTIONIST"
  },
  "credentials": {
    "email": "john.doe@eastgate.com",
    "temporaryPassword": "TemporaryPassword123!",
    "mustChangePassword": true
  },
  "message": "Staff member created successfully"
}
```

**Security Features:**
- Passwords are hashed using bcrypt (12 rounds)
- Staff must change password on first login
- Credentials are shown only once at creation
- System notification sent to new staff member

### 3. Advanced Analytics

**Endpoint:** `GET /api/manager/analytics`

Advanced analytics with predictive insights:

```javascript
// GET /api/manager/analytics?period=30
{
  "analytics": {
    "revenue": {
      "trends": { /* daily revenue */ },
      "total": 450000,
      "average": 15000
    },
    "bookings": {
      "trends": { /* daily bookings */ },
      "bySource": {
        "WEBSITE": 45,
        "PHONE": 23,
        "WALK_IN": 12
      },
      "averageValue": 45000
    },
    "restaurant": {
      "totalOrders": 234,
      "topItems": [
        {
          "name": "Grilled Tilapia",
          "quantity": 56,
          "revenue": 168000
        }
      ]
    },
    "guests": {
      "total": 123,
      "returning": 45,
      "loyaltyMembers": 67
    }
  },
  "predictions": {
    "nextWeekRevenue": 105000,
    "nextMonthRevenue": 420000,
    "trend": "increasing"
  },
  "insights": [
    {
      "type": "positive",
      "category": "revenue",
      "title": "Revenue Growth",
      "message": "Revenue increased by 12.5% compared to previous week"
    }
  ]
}
```

### 4. Comprehensive Reports

**Endpoint:** `GET /api/manager/reports`

Generate detailed reports:

**Report Types:**
- `financial` - Revenue, costs, profit analysis
- `staff` - Performance, attendance, hours worked
- `operations` - Room status, orders, maintenance
- `guest` - Demographics, satisfaction, loyalty

**Example:**
```javascript
// GET /api/manager/reports?type=financial&period=month
{
  "reportType": "financial",
  "data": {
    "summary": {
      "totalRevenue": 450000,
      "roomRevenue": 300000,
      "restaurantRevenue": 120000,
      "serviceRevenue": 30000,
      "grossProfit": 225000,
      "profitMargin": 50.0
    },
    "breakdown": {
      "byPaymentMethod": {
        "CASH": 180000,
        "VISA": 180000,
        "MTN_MOBILE": 90000
      }
    },
    "trends": [ /* daily breakdown */ ]
  }
}
```

### 5. Branch Operations

#### Room Management
- View real-time room status
- Update room availability
- Set dynamic pricing
- Schedule maintenance
- Assign housekeeping tasks

#### Booking Management
- Create and modify bookings
- Process check-ins and check-outs
- Handle cancellations
- Apply discounts
- Track payment status

#### Restaurant Operations
- Manage orders
- Update menu items
- Set pricing
- Track inventory
- Monitor kitchen performance

#### Guest Services
- Manage service requests
- Schedule spa appointments
- Organize events
- Handle special requests
- Track guest satisfaction

## API Endpoints

### Manager Dashboard
```
GET /api/manager/dashboard?period=month&branchId=xxx
```

### Staff Management
```
GET    /api/manager/staff?role=WAITER&status=ACTIVE&search=john
POST   /api/manager/staff
PATCH  /api/manager/staff
```

### Analytics
```
GET /api/manager/analytics?period=30&branchId=xxx
```

### Reports
```
GET /api/manager/reports?type=financial&period=quarter&branchId=xxx
GET /api/manager/reports?type=staff&period=month
GET /api/manager/reports?type=operations&period=week
GET /api/manager/reports?type=guest&period=year
```

### Branch Operations (Existing Endpoints)
```
GET    /api/bookings?branchId=xxx
POST   /api/bookings
PATCH  /api/bookings/[id]

GET    /api/rooms?branchId=xxx
POST   /api/rooms
PATCH  /api/rooms/[id]

GET    /api/orders?branchId=xxx
POST   /api/orders
PATCH  /api/orders/[id]

GET    /api/menu?branchId=xxx
POST   /api/menu
PATCH  /api/menu/[id]

GET    /api/guests?branchId=xxx
GET    /api/guests/[id]
```

## Staff Credential Management

### Creating Staff Accounts

1. **Navigate to Staff Management:**
   ```
   Manager Dashboard → Staff Management → Add New Staff
   ```

2. **Fill in Staff Details:**
   - Full Name
   - Email (company email recommended)
   - Phone Number
   - Role (select from dropdown)
   - Initial Password (strong password required)

3. **Submit and Save Credentials:**
   - System generates the account
   - Temporary credentials are displayed ONCE
   - Save these credentials securely
   - Share with the staff member through secure channel

4. **Staff First Login:**
   - Staff member logs in with provided credentials
   - System forces password change
   - New password must meet security requirements:
     - Minimum 8 characters
     - At least one uppercase letter
     - At least one number
     - At least one special character

### Security Best Practices

1. **Password Generation:**
   - Use strong, unique passwords
   - Consider using a password generator
   - Never reuse passwords

2. **Credential Distribution:**
   - Share credentials through secure channels
   - Never email passwords in plain text
   - Use encrypted messaging or in-person delivery

3. **Account Monitoring:**
   - Review last login dates regularly
   - Suspend inactive accounts
   - Monitor failed login attempts

4. **Access Control:**
   - Assign appropriate roles
   - Review permissions regularly
   - Revoke access immediately when staff leaves

## Analytics & Reports

### Dashboard Metrics

The manager dashboard provides real-time KPIs:

1. **Revenue Metrics**
   - Total revenue (all sources)
   - Revenue by category (rooms, restaurant, services)
   - Revenue growth trends
   - Average transaction value

2. **Occupancy Metrics**
   - Current occupancy rate
   - Available vs occupied rooms
   - Room status breakdown
   - Maintenance schedule

3. **Staff Metrics**
   - Active staff count
   - Shift coverage
   - Performance ratings
   - Top performers

4. **Guest Metrics**
   - Total guests
   - New vs returning guests
   - Satisfaction scores
   - Loyalty program enrollment

### Predictive Analytics

The system uses historical data to predict:

- **Revenue Forecasting:** Next week/month projected revenue
- **Occupancy Trends:** Expected occupancy patterns
- **Demand Prediction:** Peak periods and slow seasons
- **Staff Requirements:** Optimal staffing levels

### Actionable Insights

The system automatically generates insights based on data analysis:

- Revenue growth/decline alerts
- High cancellation rate warnings
- Low satisfaction score alerts
- Staff performance recognition
- Inventory alerts
- Maintenance reminders

## Best Practices

### Daily Operations

1. **Morning Routine:**
   - Check dashboard for overnight activities
   - Review pending check-ins for the day
   - Confirm staff assignments
   - Check inventory levels

2. **Throughout the Day:**
   - Monitor order queue
   - Respond to guest requests
   - Track room status changes
   - Handle staff escalations

3. **Evening Tasks:**
   - Process check-outs
   - Review daily revenue
   - Prepare next day schedule
   - Check maintenance requests

### Weekly Tasks

1. **Staff Management:**
   - Review performance metrics
   - Schedule shifts for next week
   - Conduct team meetings
   - Address training needs

2. **Financial Review:**
   - Analyze weekly revenue report
   - Compare with targets
   - Identify trends
   - Adjust pricing if needed

3. **Guest Relations:**
   - Review feedback and reviews
   - Respond to complaints
   - Recognize repeat guests
   - Update loyalty programs

### Monthly Tasks

1. **Comprehensive Reports:**
   - Generate all report types
   - Analyze performance trends
   - Create actionable plans
   - Present to senior management

2. **Staff Evaluations:**
   - Conduct performance reviews
   - Provide feedback
   - Set goals
   - Plan training programs

3. **Strategic Planning:**
   - Review predictions
   - Adjust strategies
   - Plan promotions
   - Budget for next month

### Data-Driven Decision Making

1. **Use Analytics:**
   - Review analytics daily
   - Track KPIs consistently
   - Monitor trends
   - Act on insights

2. **Report Analysis:**
   - Generate regular reports
   - Compare periods
   - Identify patterns
   - Make informed decisions

3. **Continuous Improvement:**
   - Set measurable goals
   - Track progress
   - Adjust strategies
   - Celebrate successes

## Troubleshooting

### Common Issues

1. **Database Connection Error:**
   ```
   Error: Can't reach database server
   ```
   - Check MySQL service is running
   - Verify DATABASE_URL in .env
   - Check firewall settings

2. **Authentication Failed:**
   - Verify credentials are correct
   - Check account status (not suspended)
   - Ensure password hasn't expired

3. **Access Denied:**
   - Verify your role permissions
   - Check branch assignment
   - Contact system administrator

### Support

For technical support:
- Email: support@eastgate.com
- Phone: +250 788 XXX XXX
- System Admin: admin@eastgate.com

---

## Additional Resources

- [API Documentation](./API_DOCS.md)
- [User Manual](./USER_MANUAL.md)
- [Security Guidelines](./SECURITY.md)
- [Training Videos](https://training.eastgate.com)

---

**Version:** 2.0  
**Last Updated:** February 2026  
**Maintained by:** Eastgate Hotel IT Department
