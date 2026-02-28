# 🚀 EastGate Hotel - Complete API Documentation

## ✅ All APIs Implemented (Real Database, No Mocks)

### 🎨 Hero Slides Management
**Endpoint:** `/api/hero/slides`

#### GET - Fetch Hero Slides
```typescript
GET /api/hero/slides?branchId={id}
Response: {
  success: true,
  slides: [{
    id: string,
    title: string,
    subtitle: string,
    description: string,
    imageUrl: string,
    ctaText: string,
    ctaLink: string,
    order: number,
    isActive: boolean,
    branchId: string,
    branch: { id, name }
  }]
}
```

#### POST - Create Hero Slide (Super Admin/Manager Only)
```typescript
POST /api/hero/slides
Headers: { Authorization: "Bearer {token}" }
Body: {
  title: string,
  subtitle: string,
  description: string,
  imageUrl: string,
  ctaText: string,
  ctaLink: string,
  branchId: string,
  order: number
}
```

#### PUT - Update Hero Slide
```typescript
PUT /api/hero/slides
Body: {
  id: string,
  title?: string,
  subtitle?: string,
  imageUrl?: string,
  order?: number,
  isActive?: boolean
}
```

#### DELETE - Delete Hero Slide (Super Admin Only)
```typescript
DELETE /api/hero/slides?id={slideId}
```

---

### 🏨 Room Management
**Endpoint:** `/api/manager/rooms`

#### GET - Fetch Rooms
```typescript
GET /api/manager/rooms?branchId={id}
Response: {
  success: true,
  rooms: [{
    id: string,
    number: string,
    floor: number,
    type: string,
    status: string,
    price: number,
    weekendPrice: number,
    description: string,
    imageUrl: string,
    images: [],
    maxOccupancy: number,
    bedType: string,
    bedCount: number,
    size: number,
    view: string,
    hasBalcony: boolean,
    hasKitchen: boolean,
    smokingAllowed: boolean,
    petFriendly: boolean,
    accessible: boolean,
    features: {},
    roomAmenities: [],
    _count: { bookings: number }
  }]
}
```

#### POST - Create Room (Branch Manager)
```typescript
POST /api/manager/rooms
Headers: { Authorization: "Bearer {token}" }
Body: {
  number: string,
  floor: number,
  type: string,
  price: number,
  weekendPrice?: number,
  description?: string,
  imageUrl?: string,
  images?: [],
  maxOccupancy?: number,
  bedType?: string,
  bedCount?: number,
  size?: number,
  view?: string,
  hasBalcony?: boolean,
  hasKitchen?: boolean,
  smokingAllowed?: boolean,
  petFriendly?: boolean,
  accessible?: boolean,
  features?: {},
  branchId?: string
}
```

#### PUT - Update Room
```typescript
PUT /api/manager/rooms
Body: {
  id: string,
  ...updateFields
}
```

#### DELETE - Delete Room
```typescript
DELETE /api/manager/rooms?id={roomId}
```

---

### 🍽️ Menu Management
**Endpoint:** `/api/manager/menu`

#### GET - Fetch Menu Items
```typescript
GET /api/manager/menu?branchId={id}
Response: {
  success: true,
  menuItems: [{
    id: string,
    name: string,
    slug: string,
    category: string,
    subcategory: string,
    price: number,
    costPrice: number,
    description: string,
    imageUrl: string,
    images: [],
    available: boolean,
    popular: boolean,
    featured: boolean,
    vegetarian: boolean,
    vegan: boolean,
    spicy: boolean,
    spicyLevel: number,
    glutenFree: boolean,
    halal: boolean,
    organic: boolean,
    calories: number,
    protein: number,
    carbs: number,
    fat: number,
    allergens: [],
    ingredients: [],
    prepTime: number,
    servingSize: string,
    tags: [],
    isApproved: boolean
  }]
}
```

#### POST - Create Menu Item (Branch Manager)
```typescript
POST /api/manager/menu
Headers: { Authorization: "Bearer {token}" }
Body: {
  name: string,
  category: string,
  subcategory?: string,
  price: number,
  costPrice?: number,
  description?: string,
  imageUrl?: string,
  images?: [],
  available?: boolean,
  popular?: boolean,
  featured?: boolean,
  vegetarian?: boolean,
  vegan?: boolean,
  spicy?: boolean,
  spicyLevel?: number,
  glutenFree?: boolean,
  halal?: boolean,
  organic?: boolean,
  calories?: number,
  protein?: number,
  carbs?: number,
  fat?: number,
  allergens?: [],
  ingredients?: [],
  prepTime?: number,
  servingSize?: string,
  tags?: [],
  branchId?: string
}
```

#### PUT - Update Menu Item
```typescript
PUT /api/manager/menu
Body: {
  id: string,
  ...updateFields
}
```

#### DELETE - Delete Menu Item
```typescript
DELETE /api/manager/menu?id={menuItemId}
```

---

### 🎉 Events Management
**Endpoint:** `/api/manager/events`

#### GET - Fetch Events
```typescript
GET /api/manager/events?branchId={id}
Response: {
  success: true,
  events: [{
    id: string,
    name: string,
    type: string,
    date: Date,
    startTime: string,
    endTime: string,
    hall: string,
    capacity: number,
    attendees: number,
    status: string,
    totalAmount: number,
    paidAmount: number,
    remainingAmount: number,
    paymentStatus: string,
    organizer: string,
    organizerContact: string,
    organizerEmail: string,
    description: string,
    notes: string
  }]
}
```

#### POST - Create Event (Branch Manager)
```typescript
POST /api/manager/events
Headers: { Authorization: "Bearer {token}" }
Body: {
  name: string,
  type: string,
  date: string,
  startTime: string,
  endTime: string,
  hall: string,
  capacity: number,
  attendees?: number,
  totalAmount?: number,
  organizer: string,
  organizerContact?: string,
  organizerEmail?: string,
  description?: string,
  notes?: string,
  branchId?: string
}
```

#### PUT - Update Event
```typescript
PUT /api/manager/events
Body: {
  id: string,
  ...updateFields
}
```

#### DELETE - Delete Event
```typescript
DELETE /api/manager/events?id={eventId}
```

---

### 👥 User Management
**Endpoint:** `/api/users`

#### GET - Fetch All Users (Super Admin/Manager Only)
```typescript
GET /api/users
Headers: { Authorization: "Bearer {token}" }
Response: {
  success: true,
  managers: [{
    id: string,
    name: string,
    email: string,
    phone: string,
    avatar: string,
    level: string,
    isActive: boolean,
    totalBranches: number,
    lastLogin: Date,
    twoFactorEnabled: boolean,
    assignments: [{
      branch: { id, name }
    }]
  }],
  staff: [{
    id: string,
    name: string,
    email: string,
    phone: string,
    avatar: string,
    role: string,
    department: string,
    status: string,
    branchId: string,
    branch: { id, name }
  }]
}
```

#### PUT - Update User (Name, Email, Password)
```typescript
PUT /api/users
Headers: { Authorization: "Bearer {token}" }
Body: {
  id: string,
  userType: "manager" | "staff",
  name?: string,
  email?: string,
  phone?: string,
  password?: string,
  avatar?: string,
  level?: string,
  role?: string,
  department?: string
}
```

#### DELETE - Deactivate User (Super Admin Only)
```typescript
DELETE /api/users?id={userId}&userType={manager|staff}
```

---

### 🏢 Branch Management
**Endpoint:** `/api/branches`

#### GET - Fetch All Branches (Super Users Only)
```typescript
GET /api/branches
Headers: { Authorization: "Bearer {token}" }
Response: {
  success: true,
  branches: [{
    id: string,
    name: string,
    location: string,
    city: string,
    totalRooms: number,
    activeStaff: number,
    activeBookings: number,
    occupiedRooms: number,
    occupancyRate: number,
    todayRevenue: number,
    rating: number,
    manager: {
      id: string,
      name: string,
      email: string,
      level: string
    }
  }]
}
```

#### POST - Create Branch (Super Admin Only)
```typescript
POST /api/branches
Body: {
  name: string,
  location: string,
  city: string,
  phone: string,
  email: string,
  totalRooms: number
}
```

---

### 📊 Branch Info
**Endpoint:** `/api/manager/branch-info`

#### GET - Fetch Branch Details
```typescript
GET /api/manager/branch-info?branchId={id}
Headers: { Authorization: "Bearer {token}" }
Response: {
  success: true,
  branch: {
    id: string,
    name: string,
    location: string,
    city: string,
    phone: string,
    email: string,
    totalRooms: number,
    activeStaff: number,
    activeBookings: number,
    activeOrders: number,
    occupiedRooms: number,
    occupancyRate: number,
    todayRevenue: number,
    rating: number,
    isActive: boolean,
    manager: {
      id: string,
      name: string,
      email: string,
      phone: string,
      level: string
    }
  }
}
```

---

## 🔐 Authentication

All protected endpoints require JWT token:
```typescript
Headers: {
  Authorization: "Bearer {token}"
}
```

Token contains:
- userId
- role (super_admin, super_manager, branch_manager, staff)
- branchId
- email

---

## 🎯 Role Permissions

### Super Admin
- ✅ All operations
- ✅ Create/delete branches
- ✅ Manage all users
- ✅ Access all branches
- ✅ Delete hero slides

### Super Manager
- ✅ View all branches
- ✅ Manage hero slides
- ✅ Update users
- ✅ Access all data
- ❌ Cannot delete branches
- ❌ Cannot delete users

### Branch Manager
- ✅ Manage own branch
- ✅ Create rooms
- ✅ Create menu items
- ✅ Create events
- ✅ Update branch data
- ❌ Cannot access other branches
- ❌ Cannot manage users

### Staff
- ✅ View assigned branch
- ✅ Create orders
- ❌ Cannot manage content
- ❌ Cannot access other branches

---

## 📝 Activity Logging

All operations are logged:
```typescript
{
  userId: string,
  branchId: string,
  action: string,
  entity: string,
  entityId: string,
  details: {},
  createdAt: Date
}
```

---

## 🚀 Features Summary

✅ **Hero Slides**: Full CRUD with order control
✅ **Rooms**: Complete management with amenities
✅ **Menu**: Advanced with nutrition, allergens
✅ **Events**: Full event lifecycle management
✅ **Users**: Edit all users including super admins
✅ **Branches**: Multi-branch with statistics
✅ **Real-time Stats**: Live occupancy, revenue
✅ **Activity Logs**: Complete audit trail
✅ **Role-Based Access**: Granular permissions
✅ **Database Integration**: Prisma + MySQL

---

## 🎨 Frontend Integration

```typescript
// Example: Create Room
const createRoom = async (roomData) => {
  const token = localStorage.getItem("eastgate-token");
  const res = await fetch("/api/manager/rooms", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(roomData)
  });
  return res.json();
};

// Example: Update Hero Slide
const updateSlide = async (slideData) => {
  const token = localStorage.getItem("eastgate-token");
  const res = await fetch("/api/hero/slides", {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(slideData)
  });
  return res.json();
};

// Example: Edit User
const updateUser = async (userData) => {
  const token = localStorage.getItem("eastgate-token");
  const res = await fetch("/api/users", {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(userData)
  });
  return res.json();
};
```

---

**Status**: ✅ Production-Ready
**Database**: Real Prisma + MySQL
**Mocks**: None
**Placeholders**: None
**All Features**: Fully Implemented
