# EastGate Hotel - Quick Implementation Guide

**For Developers**: Step-by-step integration instructions  
**Time to Full Implementation**: 2-4 days  
**Difficulty**: Intermediate to Advanced

---

## Phase 1: Setup (30 minutes)

### 1. Install Dependencies

Already in `package.json`:
```bash
npm install
```

### 2. Configure Environment Variables

Create `.env.local`:
```bash
# Database
DATABASE_URL="mysql://user:password@localhost:3306/eastgate_hotel"

# JWT
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
JWT_2FA_SECRET=$(openssl rand -hex 32)

# Payment Gateways
STRIPE_PUBLIC_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
FLUTTERWAVE_PUBLIC_KEY="FLWPUBK_TEST_..."
FLUTTERWAVE_SECRET_KEY="FLWSECK_TEST_..."
PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="notification@eastgate.rw"
SMTP_PASSWORD="..."
```

### 3. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Create/migrate database
npm run db:push

# Seed with test data
npm run db:seed
```

---

## Phase 2: Authentication Integration (1 hour)

### 1. Update Login Route

Replace existing login endpoint in `src/app/api/auth/login/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { validateEmail, validateString, errorResponse, successResponse } from "@/lib/validators";
import { generateTokens, verifyPassword } from "@/lib/auth-advanced";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    const emailValidation = validateEmail(email);
    const passwordValidation = validateString(password, 8);

    if (!emailValidation.valid || !passwordValidation.valid) {
      return errorResponse("Invalid email or password", [], 400);
    }

    // Find staff
    const staff = await prisma.staff.findUnique({
      where: { email },
      include: { branch: true }
    });

    if (!staff || !staff.password) {
      return errorResponse("Invalid credentials", [], 401);
    }

    // Verify password
    const isValid = verifyPassword(password, staff.password);
    if (!isValid) {
      return errorResponse("Invalid credentials", [], 401);
    }

    // Check if 2FA enabled
    if (staff.twoFactorEnabled) {
      // Return 2FA token instead of full tokens
      return successResponse({
        requiresTwoFactor: true,
        message: "2FA required",
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: staff.id,
      email: staff.email,
      role: staff.role,
      branchId: staff.branchId,
      permissions: staff.permissions || [],
    });

    // Create response
    const response = successResponse({
      user: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        branchId: staff.branchId,
      },
    });

    // Set secure cookies
    response.cookies.set("eastgate-auth", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 minutes
    });

    response.cookies.set("eastgate-refresh", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Internal server error", [], 500);
  }
}
```

### 2. Add 2FA Endpoint

Create `src/app/api/auth/2fa/verify/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/validators";
import {
  verifyOTP,
  generate2FAToken,
  generateTokens,
  verifyToken,
} from "@/lib/auth-advanced";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { staffId, code } = await request.json();

    if (!staffId || !code) {
      return errorResponse("Missing staffId or code", [], 400);
    }

    // Get staff with 2FA secret
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff || !staff.twoFactorEnabled) {
      return errorResponse("2FA not enabled", [], 400);
    }

    // Verify OTP
    const isValid = verifyOTP(staff.permissions as any, code);
    if (!isValid) {
      return errorResponse("Invalid OTP code", [], 401);
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: staff.id,
      email: staff.email,
      role: staff.role,
      branchId: staff.branchId,
      permissions: staff.permissions || [],
    });

    const response = successResponse({
      message: "2FA verification successful",
    });

    response.cookies.set("eastgate-auth", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    response.cookies.set("eastgate-refresh", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("2FA verification error:", error);
    return errorResponse("Verification failed", [], 500);
  }
}
```

---

## Phase 3: Payment Integration (2 hours)

### 1. Create Payment Route

Create `src/app/api/payments/process-v2/route.ts`:

```typescript
import { ProcessPayment } from "c:\eastgate\src\app\api\payments\advanced\route";

export const POST = ProcessPayment;
```

### 2. Test Payment Processing

```bash
# Test with Stripe test card
curl -X POST http://localhost:3000/api/payments/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 250000,
    "currency": "RWF",
    "method": "stripe",
    "email": "test@example.com",
    "fullName": "Test Guest",
    "bookingId": "booking_123"
  }'
```

### 3. Setup Webhook Handlers

Create `src/app/api/webhooks/stripe.ts`:

```typescript
import { handlePaymentWebhook } from "@/lib/payment-system";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  body.gateway = "stripe";
  return await handlePaymentWebhook(req);
}
```

---

## Phase 4: Booking System (1.5 hours)

### 1. Create Booking Routes

Already created in:
- `src/app/api/bookings/advanced/route.ts`

### 2. Update Existing Booking Logic

Replace `src/app/api/bookings/route.ts` with:

```typescript
import { handleGetBooking, handleCreateBooking, handleUpdateBooking } from "@/app/api/bookings/advanced/route";

export { handleCreateBooking as POST, handleGetBooking as GET, handleUpdateBooking as PUT };
```

### 3. Test Booking Flow

```bash
# Search available rooms
curl http://localhost:3000/api/bookings/search \
  -H "Content-Type: application/json" \
  -d '{
    "checkInDate": "2026-03-01",
    "checkOutDate": "2026-03-03"
  }'

# Create booking
curl -X POST http://localhost:3000/api/bookings/create \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "room_123",
    "guestId": "guest_456",
    "checkInDate": "2026-03-01",
    "checkOutDate": "2026-03-03",
    "numberOfGuests": 2,
    "paymentMethod": "stripe"
  }'
```

---

## Phase 5: Ordering System (1.5 hours)

### 1. Create Order Routes

Create `src/app/api/orders/advanced/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withPermission } from "@/lib/middleware-advanced";
import { createOrder, updateOrderStatus, getKitchenDisplay } from "@/lib/ordering-system";
import { successResponse, errorResponse, validateRequestBody } from "@/lib/validators";

export const POST = withPermission("order:create", async (req: NextRequest) => {
  try {
    const { data: body, errors } = await validateRequestBody(req, [
      "guestName",
      "type",
      "items",
    ]);

    if (!body) {
      return errorResponse("Validation failed", errors, 400);
    }

    const user = (req as any).user;
    const order = await createOrder({
      ...body,
      branchId: user.branchId,
      createdBy: user.id,
    });

    return successResponse(order, 201);
  } catch (error) {
    return errorResponse("Failed to create order", [], 500);
  }
});

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const user = (req as any).user;
    const orders = await getKitchenDisplay(user.branchId);
    return successResponse({ orders });
  } catch (error) {
    return errorResponse("Failed to fetch orders", [], 500);
  }
});
```

### 2. Test Order Creation

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "guestName": "Guest Name",
    "tableNumber": 5,
    "type": "dine_in",
    "items": [
      {
        "menuItemId": "item_123",
        "name": "Grilled Fish",
        "quantity": 2,
        "unitPrice": 45000
      }
    ]
  }'
```

---

## Phase 6: Analytics Integration (1 hour)

### 1. Create Analytics Routes

Create `src/app/api/analytics/dashboard-v2/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware-advanced";
import { getDashboardMetrics, getOrderStatistics } from "@/lib/analytics-system";
import { successResponse, errorResponse } from "@/lib/validators";

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const user = (req as any).user;
    const { startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate = new Date() } = Object.fromEntries(
      new URL(req.url).searchParams
    );

    const metrics = await getDashboardMetrics(user.branchId, {
      start: new Date(startDate as any),
      end: new Date(endDate as any),
    });

    return successResponse({ metrics });
  } catch (error) {
    return errorResponse("Failed to fetch metrics", [], 500);
  }
});
```

---

## Phase 7: Testing & Validation (1 hour)

### 1. Unit Tests

Create `__tests__/auth.test.ts`:

```typescript
import { generateTokens, verifyToken } from "@/lib/auth-advanced";

describe("Authentication", () => {
  it("should generate and verify tokens", () => {
    const payload = {
      id: "user_123",
      email: "test@example.com",
      role: "MANAGER",
      branchId: "branch_456",
      permissions: ["booking:create"],
    };

    const { accessToken } = generateTokens(payload);
    const verified = verifyToken(accessToken, "access");

    expect(verified).toBeDefined();
    expect(verified?.email).toBe("test@example.com");
  });

  it("should reject invalid tokens", () => {
    const verified = verifyToken("invalid_token", "access");
    expect(verified).toBeNull();
  });
});
```

### 2. Integration Tests

Create `__tests__/booking.test.ts`:

```typescript
import { checkRoomAvailability } from "@/lib/booking-system";

describe("Booking System", () => {
  it("should check room availability", async () => {
    const availability = await checkRoomAvailability(
      "room_123",
      new Date("2026-03-01"),
      new Date("2026-03-03")
    );

    expect(availability).toBeDefined();
    expect(availability.available).toBeDefined();
    if (availability.available) {
      expect(availability.pricing).toBeDefined();
    }
  });
});
```

### 3. Run Tests

```bash
npm test
```

---

## Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] SSL/TLS certificates installed
- [ ] Payment gateway webhooks configured
- [ ] Email service tested
- [ ] Rate limiting verified
- [ ] CORS settings appropriate
- [ ] Database backups scheduled
- [ ] Monitoring/logging setup
- [ ] Performance testing completed

---

## Common Implementation Patterns

### Pattern 1: Protected API Endpoint

```typescript
export const GET = withPermission("resource:read", async (req) => {
  const user = (req as any).user;
  // Your logic here
});
```

### Pattern 2: Multiple Validations

```typescript
export const POST = withValidation(
  {
    email: { required: true, type: "string" },
    amount: { required: true, type: "number" },
  },
  withAuth(async (req) => {
    const body = (req as any).validatedBody;
    // Your logic here
  })
);
```

### Pattern 3: Error Handling

```typescript
try {
  const result = await someOperation();
  return successResponse(result);
} catch (error) {
  console.error("Operation error:", error);
  return errorResponse("Operation failed", [], 500);
}
```

---

## Troubleshooting

### Issue: Token verification fails
- Check JWT_ACCESS_SECRET in env
- Verify token format (Bearer space required)
- Check token expiration

### Issue: Payment processing hangs
- Verify gateway API keys
- Check network connectivity
- Review gateway logs

### Issue: Booking conflicts
- Clear Prisma cache
- Verify transaction isolation
- Check date format

---

## Next Steps

1. Complete all 7 phases
2. Run comprehensive tests
3. Deploy to staging
4. User acceptance testing
5. Production deployment
6. Monitor and optimize

---

**Support**: Check ADVANCED_FEATURES_COMPLETE_DOCUMENTATION.md for detailed API documentation.
