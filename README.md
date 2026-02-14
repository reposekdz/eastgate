# 🏨 EastGate Hotel Rwanda — Enterprise Hospitality Management Platform

> A modern, full-featured hotel management system built with **Next.js 15**, **Tailwind CSS v4**, **shadcn/ui**, and **Zustand**. Designed for multi-branch hotel operations across Rwanda.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Authentication & Security](#authentication--security)
- [Role-Based Access Control](#role-based-access-control)
  - [Super Admin](#-super-admin)
  - [Manager](#-branch-manager)
  - [Receptionist](#-receptionist)
  - [Waiter / Restaurant Staff](#-waiter--restaurant-staff)
- [Branch Structure](#branch-structure)
- [Features by Module](#features-by-module)
- [Project Structure](#project-structure)

---

## Overview

EastGate Hotel Rwanda is an enterprise-grade hospitality management platform that supports **4 hotel branches** across Eastern Province. The platform provides role-based dashboards for administrators, branch managers, receptionists, and restaurant staff — each with purpose-built tools for their daily operations.

---

## Tech Stack

| Category          | Technology                    |
| ----------------- | ----------------------------- |
| Framework         | Next.js 15 (App Router)       |
| Language          | TypeScript                    |
| UI Components     | shadcn/ui + Radix Primitives  |
| Styling           | Tailwind CSS v4               |
| State Management  | Zustand (with persist)        |
| Charts            | Recharts                      |
| Animations        | Framer Motion                 |
| Icons             | Lucide React                  |
| Notifications     | Sonner (toast)                |
| Build Tool        | Turbopack                     |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app will be available at `http://localhost:3000`.

---

## Authentication & Security

The platform uses a **dual-layer authentication system**:

1. **Server-Side Middleware** (`src/middleware.ts`) — Intercepts requests to protected routes (`/admin`, `/manager`, `/receptionist`, `/waiter`) and redirects unauthenticated users to `/login`. Role-based access is enforced at the server level via a secure cookie.

2. **Client-Side Auth Guards** — Each dashboard layout wraps its content in an `AuthGuard` component that verifies the Zustand auth state and role permissions before rendering.

### Login Page

Navigate to `/login` to access the management dashboards.

---

## Role-Based Access Control

### Test Accounts

| Role             | Email                     | Password       | Branch       |
| ---------------- | ------------------------- | -------------- | ------------ |
| **Super Admin**  | `eastgate@gmail.com`      | `2026`         | All Branches |
| **Super Admin**  | `admin@eastgate.rw`       | `admin123`     | All Branches |
| **Super Manager**| `manager@eastgate.rw`     | `manager123`   | All Branches |
| **Branch Manager** (Kigali)  | `jp@eastgate.rw`    | `jp123`    | Kigali Main  |
| **Receptionist** (Kigali) | `grace@eastgate.rw`  | `grace123`   | Kigali Main  |
| **Waiter** (Kigali) | `patrick@eastgate.rw`    | `patrick123` | Kigali Main  |
| **Branch Manager** (Ngoma) | `diane@eastgate.rw`  | `diane123`   | Ngoma Branch |
| **Receptionist** (Ngoma) | `eric.n@eastgate.rw`  | `eric123`    | Ngoma Branch |
| **Branch Manager** (Kirehe) | `patrick.n@eastgate.rw` | `patrick.n123` | Kirehe Branch |
| **Receptionist** (Kirehe) | `esperance@eastgate.rw` | `esperance123` | Kirehe Branch |
| **Branch Manager** (Gatsibo) | `emmanuel.m@eastgate.rw` | `emmanuel123` | Gatsibo Branch |
| **Receptionist** (Gatsibo) | `sylvie@eastgate.rw`  | `sylvie123`  | Gatsibo Branch |

> **Important:** Select the correct **Branch** on the login form before signing in. Super Admin and Super Manager accounts work with any branch.

---

### 🔴 Super Admin

**Route:** `/admin`
**Access:** `super_admin`, `super_manager`, `accountant`, `event_manager`

The admin dashboard is the enterprise control center with full visibility across all branches.

#### Features

| Module           | Description                                                      |
| ---------------- | ---------------------------------------------------------------- |
| **Dashboard**    | KPI cards (revenue, occupancy, ADR, RevPAR), revenue charts, occupancy donut chart, recent bookings, quick actions |
| **Bookings**     | All bookings across branches with search, filter, and status management |
| **Rooms**        | Room inventory management — status tracking, pricing, floor assignment |
| **Guests**       | Full guest database with loyalty tiers, spending history, visit tracking |
| **Restaurant**   | Menu management, active orders, table assignments                |
| **Events**       | Conference/wedding/gala event scheduling, hall management, billing |
| **Staff**        | Employee directory, role management, shift scheduling, performance |
| **Finance**      | Revenue breakdowns, expense tracking, branch comparison reports  |
| **Spa**          | Spa service management, appointments, therapist scheduling       |
| **Settings**     | System configuration, branch settings, notification preferences  |

---

### 🟢 Branch Manager

**Route:** `/manager`
**Access:** `super_admin`, `super_manager`, `branch_manager`

Branch managers oversee day-to-day operations of their assigned branch.

#### Features

| Module           | Description                                                      |
| ---------------- | ---------------------------------------------------------------- |
| **Dashboard**    | Branch-specific KPIs, occupancy trends, revenue summaries, today's activity |
| **Bookings**     | Branch bookings with check-in/check-out management               |
| **Guests**       | Branch guest records, loyalty tracking, guest history             |
| **Staff**        | Branch employee management, shift oversight, performance reviews  |
| **Orders**       | Restaurant order monitoring, kitchen queue, table service status  |
| **Services**     | Housekeeping, maintenance, and spa service coordination           |
| **Performance**  | Revenue analytics, occupancy rates, staff performance metrics     |
| **Reports**      | Daily/weekly/monthly operational reports with export capabilities |
| **Messages**     | Internal messaging between staff and departments                 |
| **Notifications**| Real-time alerts for bookings, check-ins, service requests       |
| **Settings**     | Branch-level configuration and preferences                       |

---

### 🟡 Receptionist

**Route:** `/receptionist`
**Access:** `super_admin`, `super_manager`, `branch_manager`, `receptionist`

The receptionist dashboard is the front-desk command center, designed for fast guest processing and room management.

#### Features

| Module                  | Description                                                     |
| ----------------------- | --------------------------------------------------------------- |
| **Overview Tab**        | Live activity feed, quick action buttons, on-duty staff display |
| **Room Status Board**   | Visual grid of all rooms color-coded by status (available, occupied, cleaning, maintenance, reserved). Click available rooms to start guest registration |
| **Guest Registry**      | Full guest database with search (by name, email, phone, ID, room), status filtering, view details, and check-out actions |
| **Guest Registration**  | Walk-in guest registration dialog with personal info, ID verification, room selection, stay dates, and special requests |
| **Bookings**            | Today's booking management — confirm arrivals, process check-ins and check-outs |
| **Service Requests**    | Guest service request tracking with priority levels (urgent/high/medium/low) and status management (pending/in-progress/completed) |
| **Quick Stats**         | Real-time counters for active guests, expected check-ins, check-outs, available rooms, cleaning, and maintenance |
| **Occupancy Progress**  | Visual occupancy rate bar with room breakdown                   |

#### Receptionist Quick Actions

- **Walk-in Registration** — Register guests without prior booking
- **Check-in from Booking** — Process confirmed reservation arrivals
- **Room Map** — Visual room status at a glance
- **Housekeeping Dispatch** — Request room cleaning
- **Print Reports** — Generate daily operational reports
- **Service Management** — Handle guest service requests

---

### 🔵 Waiter / Restaurant Staff

**Route:** `/waiter`
**Access:** `super_admin`, `super_manager`, `branch_manager`, `waiter`, `restaurant_staff`

The waiter dashboard is optimized for fast-paced restaurant service operations.

#### Features

| Module              | Description                                                        |
| ------------------- | ------------------------------------------------------------------ |
| **Dashboard**       | Active orders overview, table status, pending items count          |
| **Orders**          | Order queue with status tracking (pending → preparing → ready → served), kitchen coordination |
| **New Order**       | Quick order creation with menu item search, quantity selection, table assignment, room charge option |
| **Tables**          | Restaurant table map with availability, assigned waiter, current orders |
| **Bookings**        | Restaurant reservation management                                  |
| **Services**        | Room service requests routed from reception                        |
| **Messages**        | Communication with kitchen staff and management                    |
| **Notifications**   | Real-time alerts for ready orders, new table assignments           |

---

## Branch Structure

EastGate operates across 4 branches in Rwanda:

| Branch         | Location                    | Manager              | Rooms |
| -------------- | --------------------------- | -------------------- | ----- |
| **Kigali Main** (Flagship) | KG 7 Ave, Kigali City | Jean-Pierre Habimana | 120   |
| **Ngoma Branch**    | Ngoma District, Eastern Province | Diane Uwimana    | 80    |
| **Kirehe Branch**   | Kirehe District, Eastern Province | Patrick Niyonsaba | 65   |
| **Gatsibo Branch**  | Gatsibo District, Eastern Province | Emmanuel Mugisha | 75   |

Each branch operates independently with its own staff, rooms, and operations, while the admin dashboard provides centralized oversight.

---

## Features by Module

### Public-Facing Website (`/`)

| Page       | Route       | Description                                    |
| ---------- | ----------- | ---------------------------------------------- |
| Home       | `/`         | Hero section, room previews, dining, testimonials |
| Rooms      | `/rooms`    | Room catalog with types, pricing, amenities    |
| Dining     | `/dining`   | Restaurant menu, cuisine showcase              |
| Menu       | `/menu`     | Full interactive food & beverage menu          |
| Spa        | `/spa`      | Spa services, treatments, packages             |
| Events     | `/events`   | Event venues, corporate facilities             |
| Gallery    | `/gallery`  | Photo gallery with lightbox                    |
| About      | `/about`    | Hotel history, team, mission                   |
| Contact    | `/contact`  | Contact form, map, branch locations            |
| Book       | `/book`     | Online room booking system                     |
| Orders     | `/orders`   | Guest food ordering (room service)             |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/            # Login & Register pages
│   │   ├── login/
│   │   └── register/
│   ├── (public)/          # Public-facing pages
│   │   ├── about/
│   │   ├── book/
│   │   ├── contact/
│   │   ├── dining/
│   │   ├── events/
│   │   ├── gallery/
│   │   ├── menu/
│   │   ├── orders/
│   │   ├── rooms/
│   │   └── spa/
│   ├── admin/             # Admin dashboard (protected)
│   │   ├── bookings/
│   │   ├── events/
│   │   ├── finance/
│   │   ├── guests/
│   │   ├── restaurant/
│   │   ├── rooms/
│   │   ├── settings/
│   │   ├── spa/
│   │   └── staff/
│   ├── manager/           # Branch manager dashboard (protected)
│   │   ├── bookings/
│   │   ├── guests/
│   │   ├── messages/
│   │   ├── notifications/
│   │   ├── orders/
│   │   ├── performance/
│   │   ├── reports/
│   │   ├── services/
│   │   ├── settings/
│   │   └── staff/
│   ├── receptionist/      # Receptionist dashboard (protected)
│   └── waiter/            # Waiter dashboard (protected)
│       ├── bookings/
│       ├── messages/
│       ├── new-order/
│       ├── notifications/
│       ├── orders/
│       ├── services/
│       └── tables/
├── components/
│   ├── admin/             # Admin-specific components
│   ├── manager/           # Manager-specific components
│   ├── receptionist/      # Receptionist-specific components
│   ├── waiter/            # Waiter-specific components
│   ├── shared/            # Shared components (AuthGuard, etc.)
│   ├── layout/            # Navbar, Footer, BottomNav
│   ├── chat/              # Live chat widget
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── store/             # Zustand auth store
│   ├── types/             # TypeScript enums & schemas
│   ├── i18n/              # Internationalization (EN/RW)
│   ├── mock-data.ts       # Demo data
│   └── format.ts          # Formatting utilities
├── stores/                # Feature-specific Zustand stores
│   ├── guest-store.ts     # Guest registration store
│   ├── order-store.ts     # Restaurant order store
│   └── cart-store.ts      # Food cart store
└── middleware.ts          # Server-side route protection
```

---

## Deployment

### Netlify

The project includes `netlify.toml` for seamless Netlify deployment:

```bash
git push origin main  # Auto-deploys via Netlify
```

### Environment

- **Node.js:** 18+ recommended
- **Package Manager:** npm

---

## License

© 2026 EastGate Hotel Rwanda. All rights reserved.
