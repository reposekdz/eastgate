# 🎯 MANAGER QUICK REFERENCE CARD

## 🔐 LOGIN
**URL:** http://localhost:3000/login
**Branch Manager Credentials:** Created by Super Admin/Manager

---

## 👥 STAFF MANAGEMENT

### Access Staff Management
**Route:** `/manager/staff-management`
**API:** `GET /api/manager/staff?branchId={id}`

### Create Staff Roles
✅ **WAITER** - Restaurant service
✅ **RECEPTIONIST** - Front desk
✅ **KITCHEN_STAFF** - Kitchen operations
✅ **STOCK_MANAGER** - Inventory management
✅ **HOUSEKEEPING** - Cleaning services

### Staff Creation Steps
1. Click "Add Staff" button
2. Fill form:
   - Name (required)
   - Email (required) - login credential
   - Phone (optional)
   - Role (dropdown)
   - Department (dropdown)
   - Shift (morning/afternoon/night)
   - Salary (RWF)
   - Password (min 8 chars) - use generator
3. Submit
4. Copy credentials to share with staff
5. Staff can now login

### Staff Management Actions
- **Search:** By name or email
- **Filter:** By role
- **View:** Staff statistics by role
- **Copy:** Staff credentials
- **Remove:** Deactivate staff

---

## 📊 DASHBOARD FEATURES

### Your Dashboard
**Route:** `/manager`
**API:** `GET /api/manager/dashboard?branchId={id}`

**Includes:**
- Branch statistics
- Revenue analytics
- Staff overview
- Order monitoring
- Room status
- Real-time metrics

---

## 🍽️ MENU MANAGEMENT

### Manage Menu
**Route:** `/manager/menu-images`
**API:** `GET/POST/PATCH/DELETE /api/manager/menu`

**Features:**
- Add menu items
- Upload images
- Set prices
- Manage categories
- Enable/disable items

---

## 💰 REVENUE TRACKING

### View Revenue
**Route:** `/manager/performance`
**API:** `GET /api/manager/revenue/advanced?branchId={id}`

**Metrics:**
- Daily/weekly/monthly revenue
- Revenue by source
- Payment methods
- Trend analysis

---

## 📋 ORDERS MONITORING

### View Orders
**Route:** `/manager/orders`
**API:** `GET /api/orders?branchId={id}`

**Track:**
- Pending orders
- Preparing orders
- Ready orders
- Completed orders

---

## 🛏️ ROOM MANAGEMENT

### Manage Rooms
**Route:** `/manager/rooms`
**API:** `GET /api/manager/rooms?branchId={id}`

**Monitor:**
- Available rooms
- Occupied rooms
- Cleaning status
- Maintenance

---

## 📱 QUICK ACTIONS

### Daily Tasks
1. ✅ Check staff attendance
2. ✅ Review today's orders
3. ✅ Monitor room status
4. ✅ Track revenue
5. ✅ Respond to messages
6. ✅ Review notifications

### Weekly Tasks
1. ✅ Review staff performance
2. ✅ Analyze revenue trends
3. ✅ Update menu items
4. ✅ Check inventory levels
5. ✅ Generate reports

---

## 🔑 STAFF CREDENTIALS

### When Creating Staff
- **Email:** Staff login credential
- **Password:** Min 8 characters
- **Auto-Generate:** Use password generator
- **Share Once:** Copy and share with staff
- **Security:** Staff should change password

### Staff Roles & Departments
| Role | Department | Typical Shift |
|------|-----------|---------------|
| WAITER | restaurant | morning/afternoon |
| RECEPTIONIST | reception | morning/afternoon |
| KITCHEN_STAFF | kitchen | morning/afternoon |
| STOCK_MANAGER | stock | morning |
| HOUSEKEEPING | housekeeping | morning |

---

## 📞 SUPPORT

### Need Help?
- Check documentation in project root
- Review API documentation
- Contact system administrator

---

## ⚡ KEYBOARD SHORTCUTS

- **Search Staff:** Focus search box
- **Add Staff:** Click "Add Staff" button
- **Copy Credentials:** Click copy icon on staff card
- **Remove Staff:** Click trash icon (confirmation required)

---

## 🎯 BEST PRACTICES

### Staff Management
✅ Create staff with strong passwords
✅ Assign correct role and department
✅ Set appropriate salary
✅ Share credentials securely
✅ Monitor staff activity
✅ Deactivate when staff leaves

### Security
✅ Never share your credentials
✅ Use strong passwords
✅ Log out when done
✅ Monitor staff access
✅ Report suspicious activity

### Operations
✅ Check dashboard daily
✅ Respond to notifications
✅ Monitor revenue trends
✅ Keep menu updated
✅ Track inventory levels
✅ Generate regular reports

---

*Quick Reference v1.0 - ${new Date().toISOString()}*
