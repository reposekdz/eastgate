# 🚀 EastGate Hotel - Database & API Integration Guide

## Overview

This guide explains how to integrate the real database, payment systems, and advanced APIs into your existing EastGate Hotel application.

## 📦 What's Already Included

Your `package.json` already has all necessary dependencies:
- ✅ Prisma ORM (`@prisma/client`, `prisma`)
- ✅ PostgreSQL adapter (`@prisma/adapter-pg`, `pg`)
- ✅ Stripe payment (`stripe`, `@stripe/stripe-js`)
- ✅ Authentication (`bcryptjs`, `jsonwebtoken`)
- ✅ Real-time (`pusher`, `pusher-js`)
- ✅ Email (`resend`)

## 🗄️ Database Setup

### Step 1: Install PostgreSQL

**Option A: Local Installation**
```bash
# Windows (using Chocolatey)
choco install postgresql

# Or download from: https://www.postgresql.org/download/windows/
```

**Option B: Use Cloud Database (Recommended for Production)**
- [Supabase](https://supabase.com) - Free tier available
- [Neon](https://neon.tech) - Serverless Postgres
- [Railway](https://railway.app) - Easy deployment
- [Vercel Postgres](https://vercel.com/storage/postgres) - Integrated with Vercel

### Step 2: Create Database

```sql
CREATE DATABASE eastgate_hotel;
```

### Step 3: Configure Environment Variables

Create `.env` file in project root:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/eastgate_hotel?schema=public"

# For Supabase (example):
# DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long"
JWT_REFRESH_SECRET="your-refresh-token-secret-min-32-characters"

# Stripe (Get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# PayPal (Optional - Get from https://developer.paypal.com)
PAYPAL_CLIENT_ID="your_paypal_client_id"
PAYPAL_CLIENT_SECRET="your_paypal_secret"
PAYPAL_MODE="sandbox"

# MTN Mobile Money Rwanda (Optional)
MTN_MOMO_API_KEY="your_mtn_api_key"
MTN_MOMO_USER_ID="your_user_id"
MTN_MOMO_SUBSCRIPTION_KEY="your_subscription_key"

# Email (Get from https://resend.com)
EMAIL_FROM="noreply@eastgate.rw"
RESEND_API_KEY="re_..."

# Real-time (Get from https://pusher.com)
PUSHER_APP_ID="your_app_id"
PUSHER_KEY="your_key"
PUSHER_SECRET="your_secret"
PUSHER_CLUSTER="eu"
NEXT_PUBLIC_PUSHER_KEY="your_key"
NEXT_PUBLIC_PUSHER_CLUSTER="eu"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### Step 4: Initialize Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with initial data (branches, staff, rooms, menu items)
npm run db:seed

# Open Prisma Studio to view data
npm run db:studio
```

## 🔐 Authentication System

The system uses JWT tokens with HTTP-only cookies for security.

### Login Flow:
1. User submits email/password
2. API validates credentials against database
3. Generates access token (15min) + refresh token (7 days)
4. Sets HTTP-only cookies
5. Returns user data

### Protected Routes:
- Middleware checks cookies on every request
- Invalid/expired tokens redirect to login
- Role-based access control enforced

## 💳 Payment Integration

### Stripe Setup:

1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from Dashboard
3. Add to `.env`
4. Test with card: `4242 4242 4242 4242`

### Mobile Money (MTN/Airtel Rwanda):

1. Register at [MTN MoMo Developer Portal](https://momodeveloper.mtn.com)
2. Get API credentials
3. Implement webhook for payment confirmation

## 📡 API Endpoints

### Authentication
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/change-password
```

### Guests
```
GET    /api/guests              # List all guests (with filters)
POST   /api/guests              # Create new guest
GET    /api/guests/[id]         # Get guest details
PATCH  /api/guests/[id]         # Update guest
DELETE /api/guests/[id]         # Delete guest
```

### Bookings
```
GET    /api/bookings            # List bookings
POST   /api/bookings            # Create booking
GET    /api/bookings/[id]       # Get booking details
PATCH  /api/bookings/[id]       # Update booking
POST   /api/bookings/[id]/check-in   # Check-in guest
POST   /api/bookings/[id]/check-out  # Check-out guest
DELETE /api/bookings/[id]       # Cancel booking
```

### Payments
```
GET    /api/payments            # List payments
POST   /api/payments            # Process payment
GET    /api/payments/[id]       # Get payment details
POST   /api/payments/stripe/webhook  # Stripe webhook
POST   /api/payments/momo/callback   # Mobile money callback
```

### Rooms
```
GET    /api/rooms               # List rooms (by branch/status)
POST   /api/rooms               # Add new room
PATCH  /api/rooms/[id]          # Update room status
GET    /api/rooms/available     # Get available rooms
```

### Orders (Restaurant)
```
GET    /api/orders              # List orders
POST   /api/orders              # Create order
PATCH  /api/orders/[id]         # Update order status
GET    /api/orders/active       # Get active orders
```

### Staff
```
GET    /api/staff               # List staff
POST   /api/staff               # Add staff member
PATCH  /api/staff/[id]          # Update staff
DELETE /api/staff/[id]          # Remove staff
GET    /api/staff/shifts        # Get shift schedule
```

### Services
```
GET    /api/services            # List service requests
POST   /api/services            # Create service request
PATCH  /api/services/[id]       # Update service status
```

### Analytics
```
GET    /api/analytics           # Dashboard metrics
GET    /api/analytics/revenue   # Revenue reports
GET    /api/analytics/occupancy # Occupancy trends
GET    /api/analytics/branch/[id] # Branch-specific analytics
```

## 🔄 Real-time Features

Using Pusher for live updates:

```typescript
// Subscribe to channel
const channel = pusher.subscribe('branch-br-001')

// Listen for events
channel.bind('new-booking', (data) => {
  // Update UI
})

channel.bind('room-status-changed', (data) => {
  // Refresh room status
})

channel.bind('new-order', (data) => {
  // Alert kitchen/waiter
})
```

## 🎯 Implementation Steps

### Phase 1: Database (Week 1)
1. ✅ Set up PostgreSQL
2. ✅ Configure Prisma schema
3. ✅ Run migrations
4. ✅ Seed initial data
5. ✅ Test database connections

### Phase 2: Authentication (Week 2)
1. ✅ Implement JWT auth
2. ✅ Create login/logout APIs
3. ✅ Add middleware protection
4. ✅ Test role-based access

### Phase 3: Core APIs (Week 3-4)
1. ✅ Guests CRUD
2. ✅ Bookings management
3. ✅ Rooms management
4. ✅ Orders system
5. ✅ Staff management

### Phase 4: Payments (Week 5)
1. ✅ Stripe integration
2. ✅ Mobile money (MTN/Airtel)
3. ✅ Payment tracking
4. ✅ Receipt generation

### Phase 5: Advanced Features (Week 6-7)
1. ✅ Real-time notifications
2. ✅ Analytics dashboard
3. ✅ Reporting system
4. ✅ Email notifications

### Phase 6: Testing & Deployment (Week 8)
1. ✅ API testing
2. ✅ Security audit
3. ✅ Performance optimization
4. ✅ Production deployment

## 🚀 Quick Start (Development)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your credentials

# 3. Initialize database
npm run db:push
npm run db:seed

# 4. Start development server
npm run dev

# 5. Open Prisma Studio (optional)
npm run db:studio
```

## 📊 Database Schema Overview

### Core Tables:
- **Branch** - Hotel branches (4 locations)
- **Staff** - Employees with roles and assignments
- **Guest** - Customer records with loyalty tiers
- **Room** - Room inventory with status tracking
- **Booking** - Reservations and stays
- **Payment** - Transaction records
- **Order** - Restaurant orders
- **MenuItem** - Menu catalog
- **Service** - Guest service requests
- **Event** - Conference/wedding bookings
- **Expense** - Financial tracking
- **Shift** - Staff scheduling
- **ActivityLog** - Audit trail

### Relationships:
- Branch → Staff (one-to-many)
- Branch → Rooms (one-to-many)
- Guest → Bookings (one-to-many)
- Booking → Payments (one-to-many)
- Order → OrderItems → MenuItem
- Staff → Services (assigned tasks)

## 🔒 Security Best Practices

1. **Never commit `.env` file**
2. **Use strong JWT secrets** (min 32 characters)
3. **Hash passwords** with bcrypt (12 rounds)
4. **Validate all inputs** with Zod schemas
5. **Use HTTP-only cookies** for tokens
6. **Implement rate limiting** on APIs
7. **Enable CORS** properly
8. **Sanitize database queries**
9. **Log security events**
10. **Regular security audits**

## 📱 Mobile Money Integration (Rwanda)

### MTN Mobile Money:
```typescript
// Request payment
const response = await fetch('/api/payments/momo/request', {
  method: 'POST',
  body: JSON.stringify({
    amount: 50000,
    phone: '250788123456',
    currency: 'RWF'
  })
})

// Check status
const status = await fetch(`/api/payments/momo/status/${transactionId}`)
```

### Airtel Money:
Similar implementation with Airtel API credentials.

## 🌐 Deployment

### Vercel (Recommended):
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Database Hosting:
- **Supabase**: Free tier, auto-backups
- **Neon**: Serverless, pay-as-you-go
- **Railway**: Simple deployment

## 📞 Support

For issues or questions:
- Check Prisma docs: https://www.prisma.io/docs
- Stripe docs: https://stripe.com/docs
- Next.js docs: https://nextjs.org/docs

## 🎉 Success Checklist

- [ ] Database connected
- [ ] Prisma schema pushed
- [ ] Initial data seeded
- [ ] Login working
- [ ] Bookings CRUD functional
- [ ] Payments processing
- [ ] Real-time updates working
- [ ] All roles accessible
- [ ] Mobile responsive
- [ ] Production deployed

---

**Built with ❤️ for EastGate Hotel Rwanda**
