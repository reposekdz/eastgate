# 🔐 JWT Authentication System - EastGate Hotel

## Overview
Advanced JWT-based authentication with automatic role-based dashboard routing, token refresh, and comprehensive security features.

## Features
✅ JWT Access & Refresh Tokens  
✅ HTTP-Only Secure Cookies  
✅ Token Blacklist/Revocation  
✅ Rate Limiting (10 attempts per 15 min)  
✅ Automatic Role-Based Redirect  
✅ Middleware Protection  
✅ bcrypt Password Hashing  
✅ Token Auto-Refresh  

## Environment Variables (.env.local)
```env
JWT_ACCESS_SECRET=eastgate_jwt_access_secret_key_2026_secure_random_string_change_in_production
JWT_REFRESH_SECRET=eastgate_jwt_refresh_secret_key_2026_secure_random_string_change_in_production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
BCRYPT_ROUNDS=12
```

## API Endpoints

### 1. Login
**POST** `/api/auth/login`

**Request:**
```json
{
  "email": "eastgate@gmail.com",
  "password": "2026",
  "branchId": "branch-1"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-1",
    "email": "eastgate@gmail.com",
    "name": "Admin User",
    "role": "super_admin",
    "branchId": "branch-1"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  },
  "redirectTo": "/admin"
}
```

### 2. Refresh Token
**POST** `/api/auth/refresh`

Automatically uses refresh token from HTTP-only cookie.

**Response:**
```json
{
  "success": true,
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}
```

### 3. Logout
**POST** `/api/auth/logout`

Revokes tokens and clears cookies.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 4. Get Current User
**GET** `/api/auth/me`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-1",
    "email": "eastgate@gmail.com",
    "name": "Admin User",
    "role": "super_admin",
    "branchId": "branch-1"
  }
}
```

## Role-Based Dashboard Routing

| Role              | Dashboard Route | Auto-Redirect |
|-------------------|-----------------|---------------|
| SUPER_ADMIN       | `/admin`        | ✅            |
| SUPER_MANAGER     | `/admin`        | ✅            |
| ACCOUNTANT        | `/admin`        | ✅            |
| EVENT_MANAGER     | `/admin`        | ✅            |
| BRANCH_MANAGER    | `/manager`      | ✅            |
| RECEPTIONIST      | `/receptionist` | ✅            |
| WAITER            | `/waiter`       | ✅            |
| RESTAURANT_STAFF  | `/waiter`       | ✅            |
| CHEF              | `/kitchen`      | ✅            |
| KITCHEN_STAFF     | `/kitchen`      | ✅            |

## Middleware Protection

The middleware automatically:
1. Verifies JWT tokens from cookies or Authorization header
2. Checks role-based permissions
3. Redirects to correct dashboard if accessing wrong route
4. Redirects to login if unauthenticated

**Protected Routes:**
- `/admin/*`
- `/manager/*`
- `/receptionist/*`
- `/waiter/*`
- `/kitchen/*`
- `/dashboard/*`
- `/profile/*`

## Usage in API Routes

```typescript
import { getCurrentUser } from "@/lib/auth-advanced";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  // Check role
  if (user.role !== "super_admin") {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 }
    );
  }
  
  // Your protected logic here
}
```

## Client-Side Usage

```typescript
// Login
const response = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password, branchId }),
});

const data = await response.json();
if (data.success) {
  window.location.href = data.redirectTo; // Auto-redirect to dashboard
}

// Logout
await fetch("/api/auth/logout", { method: "POST" });
window.location.href = "/login";

// Get current user
const response = await fetch("/api/auth/me");
const data = await response.json();
console.log(data.user);
```

## Security Best Practices

1. **Change JWT secrets in production** - Use strong random strings
2. **Enable HTTPS** - Secure cookies require HTTPS in production
3. **Implement Redis** - For token blacklist and rate limiting in production
4. **Hash passwords** - Use bcrypt with 12+ rounds
5. **Short access tokens** - 15 minutes default
6. **Rotate refresh tokens** - On each refresh
7. **Monitor failed attempts** - Rate limiting prevents brute force

## Token Structure

**Access Token Payload:**
```json
{
  "id": "user-1",
  "email": "user@eastgate.rw",
  "role": "super_admin",
  "branchId": "branch-1",
  "permissions": ["*"],
  "type": "access",
  "iat": 1234567890,
  "exp": 1234568790
}
```

## Testing

**Test Accounts:**
- Super Admin: `eastgate@gmail.com` / `2026`
- Manager: `jp@eastgate.rw` / `jp123`
- Receptionist: `grace@eastgate.rw` / `grace123`
- Waiter: `patrick@eastgate.rw` / `patrick123`

All accounts automatically redirect to their correct dashboard upon login.
