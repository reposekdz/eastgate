# 🚀 Quick Start Guide - EastGate Hotel Management System

## ⚡ 5-Minute Setup

### Step 1: Prerequisites
- ✅ Node.js 18+ installed
- ✅ PostgreSQL 14+ installed and running
- ✅ Git installed

### Step 2: Clone & Install
```bash
cd eastgate
npm install
```

### Step 3: Configure Database
1. Copy `.env.example` to `.env`
2. Update `DATABASE_URL` with your PostgreSQL credentials:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/eastgate_hotel"
```

### Step 4: Setup Database (Automated)
```bash
# Windows (PowerShell)
.\setup-database.ps1

# Linux/Mac
chmod +x setup-database.sh
./setup-database.sh
```

### Step 5: Start Application
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Login Credentials

### Super Admin (Full Access)
```
Email: eastgate@gmail.com
Password: 2026
Access: All branches, all features
```

### Super Manager
```
Email: manager@eastgate.rw
Password: manager123
Access: All branches, management features
```

### Branch Managers

**Kigali Main**
```
Email: jp@eastgate.rw
Password: jp123
```

**Ngoma Branch**
```
Email: diane@eastgate.rw
Password: diane123
```

**Kirehe Branch**
```
Email: patrick.n@eastgate.rw
Password: patrick.n123
```

**Gatsibo Branch**
```
Email: emmanuel.m@eastgate.rw
Password: emmanuel123
```

### Receptionists

**Kigali Main**
```
Email: grace@eastgate.rw
Password: grace123
```

**Ngoma**
```
Email: eric.n@eastgate.rw
Password: eric123
```

**Kirehe**
```
Email: esperance@eastgate.rw
Password: esperance123
```

**Gatsibo**
```
Email: sylvie@eastgate.rw
Password: sylvie123
```

### Waiters

**Kigali Main**
```
Email: patrick@eastgate.rw
Password: patrick123
```

### Kitchen Staff

**Kigali Main**
```
Email: kitchen@eastgate.rw
Password: kitchen123
```

---

## 📊 What's Included

### ✅ Real Database Integration
- PostgreSQL with Prisma ORM
- 340+ rooms across 4 branches
- 28 staff members with real assignments
- Sample bookings and guests
- Menu items and inventory

### ✅ Advanced Features

#### Super Admin Dashboard
- Real-time analytics across all branches
- Revenue tracking and forecasting
- Staff management and payroll
- Inventory control
- Financial reports

#### Branch Manager Dashboard
- Branch-specific KPIs
- Booking management
- Staff oversight
- Daily operations
- Performance metrics

#### Receptionist Dashboard
- Guest registration (walk-in)
- Check-in/Check-out processing
- Room status management
- Service request handling
- Payment processing

#### Waiter Dashboard
- Order management
- Table assignments
- Kitchen coordination
- Room service
- Bill generation

### ✅ Payment Integration
- Stripe (Card payments)
- Mobile Money (MTN, Airtel)
- Cash payments
- Bank transfers
- Real-time processing

### ✅ Real-Time Features
- Live room status updates
- Order tracking
- Instant notifications
- Activity logging

---

## 🗄️ Database Commands

```bash
# View database in browser
npm run db:studio

# Reset database
npm run db:push -- --force-reset
npm run db:seed

# Create migration
npm run db:migrate

# Generate Prisma Client
npm run db:generate
```

---

## 🏗️ Project Structure

```
eastgate/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── admin/             # Super admin pages
│   │   ├── manager/           # Branch manager pages
│   │   ├── receptionist/      # Receptionist pages
│   │   └── waiter/            # Waiter pages
│   ├── components/            # React components
│   ├── lib/
│   │   ├── prisma.ts          # Database client
│   │   ├── auth.ts            # Authentication
│   │   └── store/             # Zustand stores
│   └── middleware.ts          # Route protection
├── .env                       # Environment variables
└── package.json
```

---

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/eastgate_hotel"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"

# Payments (Optional for development)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Email (Optional)
SENDGRID_API_KEY="SG...."
EMAIL_FROM="noreply@eastgate.rw"

# Storage (Optional)
CLOUDINARY_CLOUD_NAME="your_cloud"
CLOUDINARY_API_KEY="your_key"
CLOUDINARY_API_SECRET="your_secret"
```

---

## 📱 Features by Role

### Super Admin Can:
- ✅ View all branches
- ✅ Manage all staff
- ✅ Access financial reports
- ✅ Control inventory
- ✅ Set pricing
- ✅ Generate analytics
- ✅ Approve expenses
- ✅ Manage events

### Branch Manager Can:
- ✅ View branch dashboard
- ✅ Manage branch staff
- ✅ Handle bookings
- ✅ Process payments
- ✅ View branch reports
- ✅ Manage inventory
- ✅ Approve services
- ✅ Track performance

### Receptionist Can:
- ✅ Register walk-in guests
- ✅ Check-in/Check-out
- ✅ Manage room status
- ✅ Process payments
- ✅ Handle service requests
- ✅ View guest history
- ✅ Generate receipts

### Waiter Can:
- ✅ Take orders
- ✅ Manage tables
- ✅ Process room service
- ✅ Generate bills
- ✅ Track order status
- ✅ View menu

---

## 🧪 Testing

### Test Data Included
- 4 Branches (Kigali, Ngoma, Kirehe, Gatsibo)
- 340 Rooms (various types)
- 28 Staff Members
- 5 Sample Guests
- 10 Menu Items
- Sample Bookings
- Inventory Items

### Test Scenarios
1. **Walk-in Guest Registration**
   - Login as receptionist
   - Click "Register Guest"
   - Fill form and assign room

2. **Create Booking**
   - Login as branch manager
   - Go to Bookings
   - Click "New Booking"

3. **Process Payment**
   - Login as receptionist
   - Select booking
   - Click "Process Payment"

4. **Take Order**
   - Login as waiter
   - Go to "New Order"
   - Select items and table

---

## 🚨 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
# Windows: Services > PostgreSQL
# Mac: brew services list
# Linux: sudo systemctl status postgresql

# Test connection
psql -U postgres -h localhost
```

### Port Already in Use
```bash
# Kill process on port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Prisma Client Not Generated
```bash
npm run db:generate
```

### Migration Issues
```bash
# Reset database
npm run db:push -- --force-reset
npm run db:seed
```

---

## 📚 Documentation

- [Full Implementation Guide](./REAL_DATABASE_IMPLEMENTATION.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [README](./README.md)

---

## 🆘 Support

### Common Issues
1. **Can't login**: Check database is seeded
2. **No data showing**: Run `npm run db:seed`
3. **API errors**: Check `.env` configuration
4. **Build errors**: Run `npm install` again

### Get Help
- 📧 Email: tech@eastgate.rw
- 📱 Phone: +250 788 000 000
- 💬 GitHub Issues

---

## 🎯 Next Steps

1. ✅ Complete database setup
2. ✅ Login and explore dashboards
3. ✅ Test booking flow
4. ✅ Configure payment gateways
5. ✅ Customize branding
6. ✅ Deploy to production

---

## 📝 Notes

- All passwords are hashed with bcrypt
- Default password for test accounts: `password123`
- Super admin password: `2026`
- Database is automatically seeded with realistic data
- All features work offline (except payments)

---

**Ready to start? Run `npm run dev` and visit http://localhost:3000** 🚀
