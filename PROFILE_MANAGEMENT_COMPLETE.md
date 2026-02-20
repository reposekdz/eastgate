# ✅ Profile Management - Complete

## 🎯 Profile APIs for Admin & Managers

All users (Super Admin, Managers, Staff) can now manage their profiles with real database integration.

---

## 📡 API Endpoints

### 1. **GET Profile** - `/api/auth/change-password`
Get current user profile information

**Request:**
```http
GET /api/auth/change-password
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "user-id",
  "name": "Jean-Pierre Habimana",
  "email": "jp@eastgate.rw",
  "phone": "+250 788 200 001",
  "avatar": "https://i.pravatar.cc/150?u=jp",
  "role": "branch_manager",
  "branchId": "br-001",
  "status": "ACTIVE",
  "lastLogin": "2026-02-10T15:30:00Z",
  "createdAt": "2023-01-15T10:00:00Z",
  "branch": {
    "id": "br-001",
    "name": "Kigali Main",
    "location": "Kigali City"
  }
}
```

---

### 2. **UPDATE Profile** - `/api/auth/change-password`
Update user profile (name, email, phone, avatar)

**Request:**
```http
PUT /api/auth/change-password
Content-Type: application/json

{
  "name": "Jean-Pierre Updated",
  "email": "jp.new@eastgate.rw",
  "phone": "+250 788 999 999",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "name": "Jean-Pierre Updated",
    "email": "jp.new@eastgate.rw",
    "phone": "+250 788 999 999",
    "avatar": "https://example.com/new-avatar.jpg",
    "role": "branch_manager",
    "branch": {
      "id": "br-001",
      "name": "Kigali Main"
    }
  }
}
```

**Features:**
- ✅ Email uniqueness validation
- ✅ Activity logging
- ✅ Real-time database update
- ✅ Returns updated user data

---

### 3. **CHANGE Password** - `/api/auth/change-password`
Change user password securely

**Request:**
```http
POST /api/auth/change-password
Content-Type: application/json

{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

**Features:**
- ✅ Current password verification
- ✅ Secure password hashing (bcrypt)
- ✅ Activity logging
- ✅ Resets mustChangePassword flag

---

## 🔐 Security Features

### Password Security
- ✅ **Bcrypt hashing** with 12 rounds
- ✅ **Current password verification** required
- ✅ **Minimum 6 characters** for new password
- ✅ **Activity logging** for password changes

### Email Security
- ✅ **Uniqueness validation** - prevents duplicate emails
- ✅ **Email format validation**
- ✅ **Activity logging** for email changes

### Avatar Security
- ✅ **URL validation** for avatar links
- ✅ **Optional field** - can be null

---

## 💾 Database Integration

### User Table Fields Updated
```typescript
{
  name: string,           // Full name
  email: string,          // Unique email
  phone: string,          // Phone number
  avatar: string,         // Avatar URL
  password: string,       // Hashed password
  mustChangePassword: boolean, // Reset on password change
}
```

### Activity Log Created
```typescript
{
  userId: string,
  action: 'PROFILE_UPDATED' | 'PASSWORD_CHANGED',
  entity: 'USER',
  entityId: string,
  details: JSON,
  createdAt: Date
}
```

---

## 🎨 Frontend Integration

### Get Profile
```typescript
const getProfile = async () => {
  const response = await fetch('/api/auth/change-password', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
};
```

### Update Profile
```typescript
const updateProfile = async (data) => {
  const response = await fetch('/api/auth/change-password', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      phone: data.phone,
      avatar: data.avatar,
    }),
  });
  return response.json();
};
```

### Change Password
```typescript
const changePassword = async (currentPassword, newPassword) => {
  const response = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
  });
  return response.json();
};
```

---

## ✨ Features

### For All Users
- ✅ View complete profile
- ✅ Update name
- ✅ Update email (with validation)
- ✅ Update phone number
- ✅ Update avatar/profile picture
- ✅ Change password securely
- ✅ View branch information
- ✅ View role and status

### Activity Tracking
- ✅ All profile changes logged
- ✅ Password changes tracked
- ✅ Timestamp recorded
- ✅ User ID tracked

### Validation
- ✅ Email format validation
- ✅ Email uniqueness check
- ✅ Password strength (min 6 chars)
- ✅ Current password verification
- ✅ Required fields validation

---

## 🚀 Usage Examples

### Complete Profile Update Flow
```typescript
// 1. Get current profile
const profile = await getProfile();
console.log('Current:', profile);

// 2. Update profile
const updated = await updateProfile({
  name: 'New Name',
  email: 'new@email.com',
  phone: '+250788999999',
  avatar: 'https://example.com/avatar.jpg',
});
console.log('Updated:', updated);

// 3. Change password
const result = await changePassword('oldpass', 'newpass123');
console.log('Password changed:', result.success);
```

---

## 📊 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not logged in) |
| 404 | User not found |
| 500 | Server error |

---

## 🔒 Access Control

### Who Can Access
- ✅ **Super Admin** - Full access
- ✅ **Super Manager** - Full access
- ✅ **Branch Manager** - Full access
- ✅ **Receptionist** - Full access
- ✅ **Waiter** - Full access
- ✅ **All Staff** - Can manage their own profile

### Restrictions
- ❌ Cannot change role
- ❌ Cannot change branch (admin only)
- ❌ Cannot change status (admin only)
- ❌ Cannot use email already taken

---

## ✅ All Features Are:

- ✅ **Real** - Connected to PostgreSQL database
- ✅ **Secure** - Password hashing, validation
- ✅ **Tracked** - Complete activity logging
- ✅ **Validated** - Email uniqueness, format checks
- ✅ **Functional** - Production-ready
- ✅ **Complete** - All profile fields manageable

---

**Profile management is now fully functional with real database integration!** 🎉

Users can change their password, email, phone, and avatar with complete security and activity tracking.
