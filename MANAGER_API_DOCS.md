# Manager API Documentation

Complete API reference for Eastgate Hotel Branch Manager System

## Table of Contents

1. [Authentication](#authentication)
2. [Manager Dashboard API](#manager-dashboard-api)
3. [Staff Management API](#staff-management-api)
4. [Analytics API](#analytics-api)
5. [Reports API](#reports-api)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)

---

## Authentication

All manager API endpoints require authentication via NextAuth session.

### Headers

```http
Cookie: next-auth.session-token=<token>
```

### Permissions

| Role | Access Level |
|------|-------------|
| SUPER_ADMIN | All branches, all operations |
| SUPER_MANAGER | All branches, all operations |
| BRANCH_MANAGER | Own branch only, all operations |

---

## Manager Dashboard API

### Get Dashboard Data

Retrieve comprehensive dashboard metrics for branch management.

**Endpoint:** `GET /api/manager/dashboard`

**Query Parameters:**
- `period` (optional): `today`, `week`, `month`, `year` (default: `today`)
- `branchId` (optional): Target branch ID (SUPER_MANAGER only)

**Example Request:**
```http
GET /api/manager/dashboard?period=month&branchId=br_12345
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "period": "month",
  "dateRange": {
    "start": "2026-01-17T07:00:00.000Z",
    "end": "2026-02-17T07:00:00.000Z"
  },
  "branch": {
    "id": "br_12345",
    "name": "Eastgate Kigali",
    "location": "Kigali, Rwanda",
    "totalRooms": 50,
    "activeStaff": 23
  },
  "metrics": {
    "totalRevenue": 15000000,
    "roomRevenue": 10000000,
    "restaurantRevenue": 4000000,
    "serviceRevenue": 1000000,
    "totalBookings": 45,
    "confirmedBookings": 30,
    "checkedInBookings": 10,
    "occupancyRate": 87.5,
    "totalOrders": 234,
    "pendingOrders": 12,
    "activeStaff": 23,
    "totalGuests": 156,
    "averageRating": 4.6
  },
  "trends": {
    "revenueGrowth": 12.5
  },
  "recentActivities": [
    {
      "type": "booking",
      "id": "bk_789",
      "title": "Booking BK-001234",
      "description": "John Doe - Room 201",
      "timestamp": "2026-02-17T05:30:00.000Z",
      "status": "CONFIRMED"
    }
  ],
  "alerts": [
    {
      "type": "warning",
      "title": "High Pending Orders",
      "message": "12 orders are pending"
    },
    {
      "type": "success",
      "title": "High Occupancy",
      "message": "87.5% occupancy rate"
    }
  ],
  "topPerformers": {
    "staff": [
      {
        "id": "usr_123",
        "name": "Jane Smith",
        "role": "RECEPTIONIST",
        "shiftsWorked": 22,
        "rating": 4.8
      }
    ],
    "menuItems": {
      "Grilled Tilapia": 56,
      "Beef Brochette": 45,
      "Pilau Rice": 89
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized`: No valid session
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server error

---

## Staff Management API

### List Staff Members

Get all staff members with filtering and search.

**Endpoint:** `GET /api/manager/staff`

**Query Parameters:**
- `branchId` (optional): Filter by branch
- `role` (optional): Filter by role
- `status` (optional): Filter by status (ACTIVE, ON_LEAVE, SUSPENDED)
- `search` (optional): Search by name or email

**Example Request:**
```http
GET /api/manager/staff?role=WAITER&status=ACTIVE&search=john
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "staff": [
    {
      "id": "usr_123",
      "name": "John Waiter",
      "email": "john.waiter@eastgate.com",
      "phone": "+250788123456",
      "role": "WAITER",
      "status": "ACTIVE",
      "avatar": "https://...",
      "joinDate": "2025-06-15T00:00:00.000Z",
      "lastLogin": "2026-02-16T18:45:00.000Z",
      "mustChangePassword": false,
      "branch": {
        "id": "br_12345",
        "name": "Eastgate Kigali"
      },
      "shifts": [
        {
          "id": "shf_001",
          "date": "2026-02-17",
          "startTime": "08:00",
          "endTime": "16:00"
        }
      ],
      "performanceReviews": [
        {
          "id": "rev_001",
          "rating": 4.5,
          "createdAt": "2026-02-01T00:00:00.000Z"
        }
      ],
      "_count": {
        "bookingsCreated": 45,
        "ordersCreated": 123,
        "shifts": 22
      }
    }
  ],
  "stats": {
    "total": 23,
    "active": 20,
    "onLeave": 2,
    "suspended": 1,
    "byRole": {
      "WAITER": 5,
      "RECEPTIONIST": 3,
      "CHEF": 4,
      "HOUSEKEEPING": 6,
      "SECURITY": 3,
      "MAINTENANCE": 2
    }
  }
}
```

### Create Staff Member

Create a new staff account with credentials.

**Endpoint:** `POST /api/manager/staff`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@eastgate.com",
  "password": "SecurePassword123!",
  "phone": "+250788123456",
  "role": "RECEPTIONIST",
  "branchId": "br_12345"
}
```

**Validation Rules:**
- `name`: Minimum 2 characters
- `email`: Valid email format, must be unique
- `password`: Minimum 8 characters
- `role`: Must be one of the allowed staff roles
- `phone`: Optional, valid phone format

**Available Roles:**
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

**Success Response (201 Created):**
```json
{
  "success": true,
  "staff": {
    "id": "usr_new123",
    "name": "John Doe",
    "email": "john.doe@eastgate.com",
    "role": "RECEPTIONIST",
    "status": "ACTIVE",
    "branch": {
      "id": "br_12345",
      "name": "Eastgate Kigali"
    }
  },
  "credentials": {
    "email": "john.doe@eastgate.com",
    "temporaryPassword": "SecurePassword123!",
    "mustChangePassword": true
  },
  "message": "Staff member created successfully. Credentials will be sent to the staff member."
}
```

**Error Responses:**
- `400 Bad Request`: Validation error or email already exists
- `401 Unauthorized`: No valid session
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server error

### Update Staff Member

Update staff member details.

**Endpoint:** `PATCH /api/manager/staff`

**Request Body:**
```json
{
  "staffId": "usr_123",
  "name": "John Updated",
  "phone": "+250788999888",
  "status": "ON_LEAVE",
  "role": "SENIOR_RECEPTIONIST"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "staff": {
    "id": "usr_123",
    "name": "John Updated",
    "email": "john.doe@eastgate.com",
    "role": "SENIOR_RECEPTIONIST",
    "status": "ON_LEAVE",
    "phone": "+250788999888"
  },
  "message": "Staff member updated successfully"
}
```

---

## Analytics API

### Get Advanced Analytics

Retrieve advanced analytics with predictive insights.

**Endpoint:** `GET /api/manager/analytics`

**Query Parameters:**
- `branchId` (optional): Target branch ID
- `period` (optional): Number of days to analyze (default: 30)

**Example Request:**
```http
GET /api/manager/analytics?period=30&branchId=br_12345
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "period": 30,
  "dateRange": {
    "start": "2026-01-18T07:00:00.000Z",
    "end": "2026-02-17T07:00:00.000Z"
  },
  "analytics": {
    "revenue": {
      "trends": {
        "2026-02-01": {
          "total": 450000,
          "rooms": 300000,
          "restaurant": 120000,
          "services": 30000
        }
      },
      "total": 13500000,
      "average": 450000
    },
    "bookings": {
      "trends": {
        "2026-02-01": 3,
        "2026-02-02": 5
      },
      "total": 90,
      "bySource": {
        "WEBSITE": 45,
        "PHONE": 23,
        "WALK_IN": 12,
        "BOOKING_COM": 10
      },
      "byStatus": {
        "CONFIRMED": 60,
        "CHECKED_IN": 15,
        "CHECKED_OUT": 10,
        "CANCELLED": 5
      },
      "averageValue": 450000
    },
    "restaurant": {
      "totalOrders": 702,
      "totalRevenue": 3600000,
      "topItems": [
        {
          "name": "Grilled Tilapia",
          "quantity": 168,
          "revenue": 504000,
          "cost": 252000
        },
        {
          "name": "Beef Brochette",
          "quantity": 135,
          "revenue": 540000,
          "cost": 270000
        }
      ],
      "averageOrderValue": 51282
    },
    "guests": {
      "total": 369,
      "demographics": {
        "byNationality": {
          "Rwanda": 245,
          "Kenya": 45,
          "Uganda": 35,
          "Tanzania": 25,
          "Other": 19
        },
        "byLoyaltyTier": {
          "SILVER": 45,
          "GOLD": 23,
          "PLATINUM": 12,
          "DIAMOND": 5
        }
      },
      "returning": 156,
      "loyaltyMembers": 85
    },
    "satisfaction": {
      "averageRating": 4.6,
      "totalReviews": 78,
      "distribution": {
        "5": 45,
        "4": 25,
        "3": 6,
        "2": 2,
        "1": 0
      }
    },
    "payments": {
      "byMethod": {
        "CASH": 35,
        "VISA": 28,
        "MTN_MOBILE": 20,
        "BANK_TRANSFER": 7
      }
    }
  },
  "predictions": {
    "nextWeekRevenue": 3150000,
    "nextMonthRevenue": 12600000,
    "trend": "increasing",
    "daily": [
      {
        "day": 1,
        "predictedRevenue": 455000
      },
      {
        "day": 2,
        "predictedRevenue": 458500
      }
    ]
  },
  "insights": [
    {
      "type": "positive",
      "category": "revenue",
      "title": "Revenue Growth",
      "message": "Revenue increased by 12.5% compared to the previous week"
    },
    {
      "type": "positive",
      "category": "satisfaction",
      "title": "Excellent Customer Satisfaction",
      "message": "Average rating is 4.6/5. Keep up the great work!"
    },
    {
      "type": "positive",
      "category": "loyalty",
      "title": "High Guest Retention",
      "message": "42.3% of guests are returning customers"
    }
  ]
}
```

---

## Reports API

### Generate Reports

Generate comprehensive reports for different categories.

**Endpoint:** `GET /api/manager/reports`

**Query Parameters:**
- `type` (required): `financial`, `staff`, `operations`, `guest`
- `period` (optional): `week`, `month`, `quarter`, `year` (default: `month`)
- `branchId` (optional): Target branch ID

**Example Requests:**

```http
# Financial Report
GET /api/manager/reports?type=financial&period=month

# Staff Performance Report
GET /api/manager/reports?type=staff&period=quarter

# Operations Report
GET /api/manager/reports?type=operations&period=week

# Guest Analytics Report
GET /api/manager/reports?type=guest&period=year
```

### Financial Report Response

```json
{
  "success": true,
  "reportType": "financial",
  "period": "month",
  "dateRange": {
    "start": "2026-01-17T07:00:00.000Z",
    "end": "2026-02-17T07:00:00.000Z"
  },
  "branchId": "br_12345",
  "data": {
    "summary": {
      "totalRevenue": 13500000,
      "roomRevenue": 9000000,
      "restaurantRevenue": 3600000,
      "serviceRevenue": 900000,
      "totalBookingRevenue": 13050000,
      "totalOrderRevenue": 3510000,
      "grossProfit": 6750000,
      "profitMargin": 50.0
    },
    "breakdown": {
      "byPaymentMethod": {
        "CASH": 5400000,
        "VISA": 4050000,
        "MASTERCARD": 2700000,
        "MTN_MOBILE": 1350000
      },
      "bySource": {
        "bookings": 90,
        "orders": 702,
        "services": 900000
      }
    },
    "trends": [
      {
        "date": "2026-02-01",
        "total": 450000,
        "rooms": 300000,
        "restaurant": 120000,
        "services": 30000
      }
    ]
  },
  "generatedAt": "2026-02-17T07:00:00.000Z"
}
```

### Staff Performance Report Response

```json
{
  "success": true,
  "reportType": "staff",
  "data": {
    "summary": {
      "totalStaff": 23,
      "attendance": {
        "active": 20,
        "onLeave": 2,
        "suspended": 1
      },
      "totalShifts": 484,
      "totalHours": 3872
    },
    "performance": [
      {
        "id": "usr_001",
        "name": "Jane Smith",
        "role": "RECEPTIONIST",
        "status": "ACTIVE",
        "shiftsWorked": 22,
        "totalHours": 176,
        "bookingsCreated": 45,
        "ordersCreated": 12,
        "averageRating": 4.8,
        "latestReview": {
          "id": "rev_001",
          "rating": 5,
          "comment": "Excellent performance"
        }
      }
    ],
    "topPerformers": [
      {
        "id": "usr_001",
        "name": "Jane Smith",
        "role": "RECEPTIONIST",
        "averageRating": 4.8
      }
    ]
  }
}
```

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "error": "Error message",
  "details": "Additional details (optional)",
  "code": "ERROR_CODE (optional)"
}
```

### Common Error Codes

| Status Code | Description |
|------------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - No valid session |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

### Example Error Responses

**Validation Error (400):**
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

**Unauthorized (401):**
```json
{
  "error": "Unauthorized",
  "message": "Valid authentication required"
}
```

**Forbidden (403):**
```json
{
  "error": "Access denied",
  "message": "Insufficient permissions for this resource"
}
```

**Not Found (404):**
```json
{
  "error": "Staff member not found",
  "id": "usr_nonexistent"
}
```

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse.

### Limits

| Endpoint Type | Limit |
|--------------|-------|
| Dashboard | 60 requests/minute |
| Staff Management (GET) | 120 requests/minute |
| Staff Management (POST/PATCH) | 20 requests/minute |
| Analytics | 30 requests/minute |
| Reports | 10 requests/minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1708156800
```

### Rate Limit Exceeded Response (429)

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

---

## Best Practices

1. **Caching:** Cache dashboard and analytics data for 5-10 minutes
2. **Pagination:** Use pagination for large datasets (staff lists, bookings)
3. **Error Handling:** Always handle errors gracefully
4. **Rate Limits:** Respect rate limits, implement exponential backoff
5. **Security:** Never log or expose credentials
6. **Validation:** Validate all input on client side before sending
7. **Date Formats:** Use ISO 8601 format for all dates

---

**Version:** 2.0  
**Last Updated:** February 2026  
**Base URL:** `http://localhost:3000/api` (development)
