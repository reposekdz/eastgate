# EastGate Hotel Rwanda - Management System

A comprehensive, modern hotel management system for Rwanda's premier 5-star hotel chain with four locations.

## 🌟 Features

- **Multi-Branch Management**: Kigali Main, Ngoma, Kirehe, and Gatsibo branches
- **RWF Currency**: All pricing in Rwandan Francs
- **Role-Based Access**: 9 different user roles with specific permissions
- **Customer Booking**: Interactive 4-step booking flow
- **Digital Check-in/Check-out**: Paperless guest management
- **Restaurant Management**: Digital ordering and menu system
- **Real-time Analytics**: Revenue, occupancy, and performance tracking
- **Fully Responsive**: Optimized for all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd eastgate

# Install dependencies (use cmd or Git Bash on Windows)
npm install zustand @tanstack/react-query next-auth@beta bcryptjs prisma @prisma/client
npm install --save-dev @types/bcryptjs

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔐 Test Credentials

### Super Admin (Full Access)
- Email: `admin@eastgate.rw`
- Password: `admin123`

### Branch Manager (Kigali Main)
- Email: `jp@eastgate.rw`
- Password: `jp123`

### Receptionist
- Email: `grace@eastgate.rw`
- Password: `grace123`

### Waiter
- Email: `patrick@eastgate.rw`
- Password: `patrick123`

See [SETUP-INSTRUCTIONS.md](./SETUP-INSTRUCTIONS.md) for all test accounts.

## 📱 Application Routes

- `/` - Landing page
- `/book` - Customer booking flow
- `/login` - Staff authentication
- `/admin` - Admin dashboard
- `/receptionist` - Reception desk interface
- `/waiter` - Restaurant service dashboard

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui
- **State**: Zustand
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React

## 📖 Documentation

- [IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md) - Comprehensive feature list
- [SETUP-INSTRUCTIONS.md](./SETUP-INSTRUCTIONS.md) - Setup and credentials guide

## 🎯 Key Features by Role

### Customer
- Browse available rooms
- Select branch and dates
- Complete booking in 4 steps
- Receive instant confirmation

### Receptionist
- View daily check-ins/check-outs
- Digital guest registration
- Walk-in guest management
- Room assignment

### Waiter
- View active orders
- Create new orders from menu
- Update order status
- Track table assignments

### Admin
- Monitor all branches
- View revenue analytics
- Manage staff and rooms
- Financial reporting

## 💰 Room Pricing (RWF)

- Standard Room: 234,000/night
- Deluxe Room: 325,000/night
- Family Suite: 416,000/night
- Executive Suite: 585,000/night
- Presidential Suite: 1,105,000/night

## 🏢 Branch Locations

1. **Kigali Main** - KG 7 Ave, Kigali City (120 rooms)
2. **Ngoma Branch** - Ngoma District, Eastern Province (80 rooms)
3. **Kirehe Branch** - Kirehe District, Eastern Province (65 rooms)
4. **Gatsibo Branch** - Gatsibo District, Eastern Province (75 rooms)

## 📊 System Benefits

- ✅ Replaces paper-based operations
- ✅ Real-time data access
- ✅ Improved efficiency
- ✅ Better guest experience
- ✅ Data-driven decisions
- ✅ Scalable architecture

## 🛠️ Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📝 License

Copyright © 2026 EastGate Hotel Rwanda. All rights reserved.

## 🤝 Support

For support, contact: support@eastgate.rw
