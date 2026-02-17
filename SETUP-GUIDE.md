# EastGate Hotel System - Professional Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Git

### Installation Steps

1. **Install Dependencies**
```bash
npm install
```

2. **Configure Environment**
Create `.env` file in project root:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/eastgate_hotel"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secure-random-string-here"

# Payments (Optional for development)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLIC_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

3.- **Database**: Connected to Neon PostgreSQL (Production).
- **Authentication**: NextAuth.js configured.
- **Payment**: Stripe Test Mode.

### 2. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🔐 Production Access

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@eastgate.rw | admin123 |
| Super Manager | manager@eastgate.rw | manager123 |

> **Note**: These are default credentials. Please change passwords immediately after first login.
> Use these accounts to create Branch Managers and other staff.

---

## 📁 Project Structure

```
eastgate/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── auth/
│   │   │   ├── bookings/
│   │   │   ├── rooms/
│   │   │   ├── orders/
│   │   │   ├── guests/
│   │   │   ├── menu/
│   │   │   ├── analytics/
│   │   │   └── payments/
│   │   ├── admin/
│   │   ├── manager/
│   │   ├── receptionist/
│   │   └── waiter/
│   ├── components/
│   ├── lib/
│   │   ├── auth.ts        # NextAuth config
│   │   └── prisma.ts      # Prisma client
│   └── stores/
└── package.json
```

---

## 🛠️ Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with test data
npm run db:studio    # Open Prisma Studio (Database GUI)
npm run db:migrate   # Create database migration
```

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout

### Bookings
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/[id]` - Get booking details
- `PATCH /api/bookings/[id]` - Update booking

### Rooms
- `GET /api/rooms` - List rooms
- `POST /api/rooms` - Create room
- `PATCH /api/rooms/[id]` - Update room

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `PATCH /api/orders/[id]` - Update order

### Guests
- `GET /api/guests` - List guests
- `POST /api/guests` - Create guest
- `GET /api/guests/[id]` - Get guest details
- `PATCH /api/guests/[id]` - Update guest

### Menu
- `GET /api/menu` - List menu items
- `POST /api/menu` - Create menu item

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard KPIs

### Payments
- `POST /api/payments/create-intent` - Create payment
- `POST /api/payments/webhook` - Stripe webhook

---

## 🎯 Key Features

✅ **Database Integration** - PostgreSQL with Prisma ORM
✅ **Authentication** - NextAuth.js with JWT sessions
✅ **Payment Processing** - Stripe integration
✅ **Real-time Analytics** - KPI calculations
✅ **Advanced Menu Management**:
  - Managers can create branch-specific items.
  - Global menu items managed by Super Admin.
  - Full CRUD operations with rich details (nutrition, allergens).
✅ **Staff Management**: Role-based access control.
✅ **Role-Based Access** - 10 user types with permissions
✅ **Multi-Branch Support** - 4 hotel locations
✅ **Booking Management** - Availability checking & conflict detection
✅ **Restaurant Orders** - Kitchen workflow tracking
✅ **Guest CRM** - Loyalty program & history
✅ **Data Validation** - Zod schemas

---

## 🔧 Configuration

### Database
The system uses PostgreSQL. For local development, install PostgreSQL or use a cloud service:
- **Supabase** (recommended for development)
- **Railway**
- **Neon**
- **Local PostgreSQL**

### Authentication
NextAuth is configured with credentials provider. Update `src/lib/auth.ts` to add OAuth providers if needed.

### Payments
Stripe integration is ready. Get API keys from [stripe.com/dashboard](https://stripe.com/dashboard)

---

## 📊 Database Schema Highlights

- **20+ Models** covering all hotel operations
- **Users & Auth** - Multi-role system
- **Bookings** - Complete reservation lifecycle
- **Rooms** - Inventory with real-time status
- **Orders** - Restaurant management
- **Guests** - CRM with loyalty tiers
- **Payments** - Transaction tracking
- **Analytics** - Revenue & KPI data

---

## 🐛 Troubleshooting

**Database connection failed (P1001/DatabaseNotReachable):**
- **CRITICAL**: Ensure PostgreSQL is running!
- Verify `DATABASE_URL` in `.env`.
- Check if database `eastgate_hotel` exists.
- If using Docker: `docker run --name pg -e POSTGRES_PASSWORD=password -e POSTGRES_DB=eastgate_hotel -p 5432:5432 -d postgres`

**Prisma 7 Compatibility:**
- This project uses `@prisma/adapter-pg` for connection.
- Do NOT add `url` to `schema.prisma`.
- Connection string is handled in `src/lib/prisma.ts`.

**Installation Issues:**
- Run `npm install` to ensure `@prisma/adapter-pg` and `pg` are installed.
- Delete `node_modules` and `package-lock.json` if issues persist.

---

## 📚 Next Steps

1. ✅ Frontend integration with API hooks
2. ✅ Real-time updates with Pusher
3. ✅ Email notifications
4. ✅ SMS integration
5. ✅ Mobile responsiveness
6. ✅ Production deployment

---

## 🌐 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Database
- Use Supabase or Railway for PostgreSQL
- Update DATABASE_URL in production

---

## 📧 Support

For issues or questions, refer to:
- Implementation Plan: `implementation_plan.md`
- Walkthrough: `walkthrough.md`
- Prisma Docs: [prisma.io/docs](https://www.prisma.io/docs)
- Next.js Docs: [nextjs.org/docs](https://nextjs.org/docs)
