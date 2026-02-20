# Staff Management Implementation - Complete Guide

## Overview
The EastGate Hotel management system now has a fully functional hierarchical staff management system where:
- **Super Admin** and **Super Manager** can manage all branches and add Branch Managers
- **Branch Managers** can add and manage staff (waiters, receptionists, kitchen staff, housekeeping) for their assigned branch only
- All dynamically added staff must change their credentials on first login

---

## Staff Hierarchy

```
Super Admin / Super Manager (All Branches)
    ↓
Branch Manager (Assigned to specific branch)
    ↓
Branch Staff (Receptionist, Waiter, Kitchen Staff, Housekeeping, Restaurant Staff)
```

---

## Role Permissions

### Super Admin & Super Manager
- **Access**: All branches
- **Can Add**: Branch Managers, Accountants, Event Managers, and all branch staff
- **Can Remove**: Any dynamically added staff (except themselves)
- **Dashboard**: `/admin`
- **Staff Management**: `/admin/staff-management`

### Branch Manager
- **Access**: Assigned branch only
- **Can Add**: Receptionist, Waiter, Kitchen Staff, Housekeeping, Restaurant Staff
- **Cannot Add**: Super Admin, Super Manager, Branch Manager, Accountant, Event Manager
- **Can Remove**: Only staff they added to their branch
- **Dashboard**: `/manager`
- **Staff Management**: `/manager/staff-management`

### Branch Staff (Receptionist, Waiter, Kitchen Staff, etc.)
- **Access**: Assigned branch only
- **Cannot Add**: Any staff
- **Dashboards**: `/receptionist`, `/waiter`, `/kitchen`

---

## Implementation Details

### 1. Auth Store (`src/lib/store/auth-store.ts`)

#### Key Functions

**`addStaff()`**
- Validates that branch managers can only add staff to their assigned branch
- Prevents branch managers from adding privileged roles (super_admin, super_manager, branch_manager, accountant, event_manager)
- Checks for duplicate emails across all user types
- Sets `mustChangeCredentials: true` for all new staff
- Generates unique staff ID with timestamp

```typescript
addStaff: (data) => {
  const currentUser = state.user;
  
  // Branch managers can only add staff to their own branch
  if (currentUser?.role === "branch_manager" && currentUser.branchId !== data.branchId) {
    return { success: false, error: "You can only add staff to your assigned branch." };
  }
  
  // Branch managers cannot add privileged roles
  if (currentUser?.role === "branch_manager") {
    const restrictedRoles = ["super_admin", "super_manager", "branch_manager", "accountant", "event_manager"];
    if (restrictedRoles.includes(data.role)) {
      return { success: false, error: "You don't have permission to add this role." };
    }
  }
  
  // ... rest of implementation
}
```

**`removeStaff()`**
- Prevents users from removing themselves
- Branch managers can only remove staff from their assigned branch
- Only dynamic staff (added via the system) can be removed

```typescript
removeStaff: (userId) => {
  const currentUser = state.user;
  if (currentUser?.id === userId) {
    return { success: false, error: "Cannot remove your own account." };
  }
  
  const staffToRemove = state.dynamicStaff.find((u) => u.id === userId);
  if (!staffToRemove) {
    return { success: false, error: "User not found or cannot be removed." };
  }
  
  // Branch managers can only remove staff from their own branch
  if (currentUser?.role === "branch_manager" && staffToRemove.branchId !== currentUser.branchId) {
    return { success: false, error: "You can only remove staff from your assigned branch." };
  }
  
  // ... rest of implementation
}
```

**`getAllStaff()`**
- Returns staff filtered by branch
- Includes both static (predefined) and dynamic (added) staff
- Returns metadata including `isDynamic` and `mustChangeCredentials` flags

---

### 2. Manager Staff Management Page (`src/app/manager/staff-management/page.tsx`)

#### Features
- **Branch-Specific View**: Branch managers only see staff from their assigned branch
- **Add Staff Dialog**: Form to add new staff with role selection
- **Staff Cards**: Visual display of all branch staff with badges and actions
- **Search & Filter**: Search by name/email and filter by role
- **Statistics**: Real-time counts of staff by role

#### Available Roles for Branch Managers
- Receptionist
- Waiter
- Kitchen Staff
- Housekeeping
- Restaurant Staff

#### Staff Card Display
Each staff member card shows:
- Avatar and name
- Role badge (color-coded)
- Email and phone
- "Must change login" badge (if credentials not changed)
- Copy credentials button
- Remove button (for dynamic staff only)

#### Validation
- Name, email, and password are required
- Password must be at least 6 characters
- Email must be unique across all users
- Branch managers cannot add staff if branchId is "all"

---

### 3. Admin Staff Management Page (`src/app/admin/staff-management/page.tsx`)

#### Features
- **All Branches View**: Super users see staff from all branches
- **Add Staff Dialog**: Can add any role including Branch Managers
- **Staff Table**: Comprehensive table with all staff details
- **Password Visibility Toggle**: Show/hide passwords for static staff
- **Branch Assignment**: Assign staff to specific branches
- **Hierarchy Notice**: Clear explanation of staff hierarchy

#### Available Roles for Super Users
- Branch Manager
- Branch Admin
- Receptionist
- Waiter
- Kitchen Staff
- Accountant
- Event Manager
- Restaurant Staff

---

## Credential Change Flow

### First Login Process
1. Staff logs in with assigned credentials
2. System detects `mustChangeCredentials: true`
3. Redirects to `/change-credentials` page
4. Staff must set new email and password
5. After successful change, `mustChangeCredentials` is set to `false`
6. Staff can now access their dashboard

### Change Credentials Page
Located at: `src/app/(auth)/change-credentials/page.tsx`

Features:
- Current email display
- New email input with validation
- New password input (min 6 characters)
- Password confirmation
- Cannot skip or bypass this step

---

## Testing Guide

### Test Accounts

#### Super Admin
- Email: `admin@eastgate.rw`
- Password: `admin123`
- Branch: Any

#### Super Manager
- Email: `manager@eastgate.rw`
- Password: `manager123`
- Branch: Any

#### Branch Manager (Kigali)
- Email: `jp@eastgate.rw`
- Password: `jp123`
- Branch: Kigali Main

#### Branch Manager (Ngoma)
- Email: `diane@eastgate.rw`
- Password: `diane123`
- Branch: Ngoma Branch

### Testing Scenarios

#### Scenario 1: Super Manager Adds Branch Manager
1. Login as Super Manager
2. Go to `/admin/staff-management`
3. Click "Add Staff & Assign Credentials"
4. Fill form:
   - Name: "Test Manager"
   - Email: "testmanager@eastgate.rw"
   - Password: "test123"
   - Role: "Branch Manager"
   - Branch: "Kigali Main"
5. Click "Create & Assign Credentials"
6. Logout and login with new credentials
7. Should be redirected to `/change-credentials`
8. Change email and password
9. Should be redirected to `/manager` dashboard

#### Scenario 2: Branch Manager Adds Receptionist
1. Login as Branch Manager (jp@eastgate.rw)
2. Go to `/manager/staff-management`
3. Click "Add Staff"
4. Fill form:
   - Name: "Test Receptionist"
   - Email: "testreceptionist@eastgate.rw"
   - Password: "test123"
   - Role: "Receptionist"
5. Click "Add & Assign Credentials"
6. Logout and login with new credentials
7. Should be redirected to `/change-credentials`
8. Change email and password
9. Should be redirected to `/receptionist` dashboard

#### Scenario 3: Branch Manager Cannot Add to Different Branch
1. Login as Branch Manager (jp@eastgate.rw - Kigali)
2. Try to add staff to Ngoma branch
3. Should fail with error message

#### Scenario 4: Branch Manager Cannot Add Privileged Roles
1. Login as Branch Manager
2. Go to `/manager/staff-management`
3. Try to add staff with role "Branch Manager"
4. Role should not be available in dropdown

---

## Security Features

### 1. Branch Isolation
- Branch managers can only see and manage staff from their assigned branch
- Cannot access or modify staff from other branches
- Enforced at both UI and store level

### 2. Role Restrictions
- Branch managers cannot add privileged roles
- Restricted roles: super_admin, super_manager, branch_manager, accountant, event_manager
- Enforced in `addStaff()` function

### 3. Credential Security
- All new staff must change credentials on first login
- Cannot bypass credential change requirement
- Enforced via middleware and auth guard

### 4. Self-Protection
- Users cannot remove their own account
- Prevents accidental lockout

### 5. Email Uniqueness
- Email validation across all user types (staff, guests, dynamic staff)
- Prevents duplicate accounts

---

## Database Schema (Future Implementation)

When moving to a database, the staff table should include:

```sql
CREATE TABLE staff (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'super_manager', 'branch_manager', 'receptionist', 'waiter', 'kitchen_staff', 'housekeeping', 'restaurant_staff', 'accountant', 'event_manager') NOT NULL,
  branch_id VARCHAR(50) NOT NULL,
  branch_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  avatar VARCHAR(500),
  must_change_credentials BOOLEAN DEFAULT TRUE,
  is_dynamic BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (created_by) REFERENCES staff(id)
);
```

---

## API Endpoints (Future Implementation)

### POST /api/staff
Add new staff member
- Auth: Super Admin, Super Manager, Branch Manager
- Body: { name, email, password, role, branchId, phone }
- Returns: { success, staff, error }

### GET /api/staff
Get all staff (filtered by branch for branch managers)
- Auth: Super Admin, Super Manager, Branch Manager
- Query: ?branchId=br-001&role=receptionist
- Returns: { staff[] }

### DELETE /api/staff/:id
Remove staff member
- Auth: Super Admin, Super Manager, Branch Manager (own branch only)
- Returns: { success, error }

### PUT /api/staff/:id/credentials
Update staff credentials
- Auth: Authenticated user (own credentials only)
- Body: { newEmail, newPassword }
- Returns: { success, error }

---

## UI Components

### Staff Card Component
Location: `src/app/manager/staff-management/page.tsx`

Features:
- Avatar display
- Role badge with color coding
- Email and phone display
- "Must change login" indicator
- Copy credentials button
- Remove button (conditional)

### Add Staff Dialog
Location: Both admin and manager staff management pages

Fields:
- Full Name (required)
- Email (required, unique)
- Phone (optional)
- Role (required, dropdown)
- Initial Password (required, min 6 chars)
- Branch (required for admin, auto-filled for managers)

### Staff Statistics Cards
- Total staff count
- Count by role (Receptionists, Waiters, Kitchen Staff, Housekeeping)
- Color-coded gradient backgrounds

---

## Error Handling

### Common Errors
1. **"You can only add staff to your assigned branch."**
   - Cause: Branch manager trying to add staff to different branch
   - Solution: Ensure branchId matches manager's assigned branch

2. **"You don't have permission to add this role."**
   - Cause: Branch manager trying to add privileged role
   - Solution: Select from allowed roles only

3. **"An account with this email already exists."**
   - Cause: Email already in use
   - Solution: Use different email address

4. **"Password must be at least 6 characters."**
   - Cause: Password too short
   - Solution: Use longer password

5. **"Cannot remove your own account."**
   - Cause: User trying to remove themselves
   - Solution: Have another admin remove the account

---

## Future Enhancements

### 1. Staff Permissions
- Granular permissions per role
- Custom permission sets
- Permission inheritance

### 2. Staff Scheduling
- Shift management
- Availability tracking
- Automatic scheduling

### 3. Performance Tracking
- KPI monitoring per staff
- Performance reviews
- Reward system

### 4. Staff Communication
- Internal messaging
- Announcements
- Task assignments

### 5. Audit Logging
- Track all staff additions/removals
- Log credential changes
- Monitor access patterns

---

## Troubleshooting

### Issue: Branch manager cannot see staff
**Solution**: Ensure manager is logged in with correct branch credentials

### Issue: Cannot add staff - "Select a branch first"
**Solution**: Branch manager must be assigned to a specific branch (not "all")

### Issue: Staff not redirected to change credentials
**Solution**: Check `requiresCredentialsChange` flag in auth store

### Issue: Removed staff can still login
**Solution**: Staff must logout and clear browser cache

---

## Summary

The staff management system is now fully functional with:
✅ Hierarchical role-based access control
✅ Branch-specific staff management for branch managers
✅ Mandatory credential change on first login
✅ Secure role restrictions
✅ Branch isolation
✅ Comprehensive UI for both admin and manager roles
✅ Real-time statistics and filtering
✅ Email uniqueness validation
✅ Self-protection mechanisms

Branch managers can now independently manage their branch staff while super users maintain oversight of the entire organization.
