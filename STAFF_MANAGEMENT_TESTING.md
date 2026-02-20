# Staff Management - Quick Testing Guide

## 🚀 Quick Start

### Step 1: Login as Super Manager
```
Email: manager@eastgate.rw
Password: manager123
Branch: Any (select Kigali Main)
```

### Step 2: Add a Branch Manager
1. Navigate to `/admin/staff-management`
2. Click "Add Staff & Assign Credentials"
3. Fill in:
   - Name: `John Doe`
   - Email: `john.manager@eastgate.rw`
   - Password: `john123`
   - Role: `Branch Manager`
   - Branch: `Kigali Main`
4. Click "Create & Assign Credentials"

### Step 3: Login as New Branch Manager
1. Logout
2. Login with:
   - Email: `john.manager@eastgate.rw`
   - Password: `john123`
   - Branch: `Kigali Main`
3. You'll be redirected to `/change-credentials`
4. Set new email and password
5. You'll be redirected to `/manager` dashboard

### Step 4: Add Branch Staff
1. Navigate to `/manager/staff-management`
2. Click "Add Staff"
3. Fill in:
   - Name: `Jane Smith`
   - Email: `jane.receptionist@eastgate.rw`
   - Password: `jane123`
   - Role: `Receptionist`
4. Click "Add & Assign Credentials"

### Step 5: Login as New Receptionist
1. Logout
2. Login with:
   - Email: `jane.receptionist@eastgate.rw`
   - Password: `jane123`
   - Branch: `Kigali Main`
3. Change credentials
4. Access `/receptionist` dashboard

---

## 🔑 Test Credentials

### Super Users (Can manage all branches)
| Role | Email | Password | Access |
|------|-------|----------|--------|
| Super Admin | admin@eastgate.rw | admin123 | All branches |
| Super Manager | manager@eastgate.rw | manager123 | All branches |

### Branch Managers (Can manage their branch only)
| Branch | Email | Password |
|--------|-------|----------|
| Kigali Main | jp@eastgate.rw | jp123 |
| Ngoma Branch | diane@eastgate.rw | diane123 |
| Kirehe Branch | patrick.n@eastgate.rw | patrick.n123 |
| Gatsibo Branch | emmanuel.m@eastgate.rw | emmanuel123 |

---

## ✅ Test Scenarios

### ✓ Scenario 1: Super Manager adds Branch Manager
**Expected**: Success, new manager must change credentials on first login

### ✓ Scenario 2: Branch Manager adds Receptionist
**Expected**: Success, receptionist must change credentials on first login

### ✓ Scenario 3: Branch Manager adds Waiter
**Expected**: Success, waiter must change credentials on first login

### ✓ Scenario 4: Branch Manager tries to add staff to different branch
**Expected**: Error - "You can only add staff to your assigned branch."

### ✓ Scenario 5: Branch Manager tries to add another Branch Manager
**Expected**: Role not available in dropdown

### ✓ Scenario 6: Branch Manager removes staff from their branch
**Expected**: Success, staff removed

### ✓ Scenario 7: Branch Manager tries to remove staff from different branch
**Expected**: Error - "You can only remove staff from your assigned branch."

### ✓ Scenario 8: User tries to remove themselves
**Expected**: Error - "Cannot remove your own account."

---

## 🎯 Roles Branch Managers Can Add

✅ Receptionist
✅ Waiter
✅ Kitchen Staff
✅ Housekeeping
✅ Restaurant Staff

❌ Super Admin
❌ Super Manager
❌ Branch Manager
❌ Accountant
❌ Event Manager

---

## 📊 Features to Test

### Staff Management Page (`/manager/staff-management`)
- [ ] View all branch staff
- [ ] Search staff by name/email
- [ ] Filter staff by role
- [ ] Add new staff
- [ ] Remove dynamic staff
- [ ] Copy staff credentials
- [ ] View staff statistics

### Add Staff Dialog
- [ ] Name validation (required)
- [ ] Email validation (required, unique)
- [ ] Password validation (min 6 chars)
- [ ] Role selection
- [ ] Generate random password
- [ ] Show/hide password toggle

### Staff Cards
- [ ] Display avatar
- [ ] Show role badge
- [ ] Display email and phone
- [ ] Show "Must change login" badge
- [ ] Copy credentials button
- [ ] Remove button (for dynamic staff)

---

## 🐛 Common Issues & Solutions

### Issue: "Select a branch first"
**Cause**: Branch manager's branchId is "all"
**Solution**: Ensure branch manager is assigned to specific branch

### Issue: Cannot see staff
**Cause**: Wrong branch selected or not logged in
**Solution**: Login with correct branch credentials

### Issue: Cannot add staff
**Cause**: Missing required fields or duplicate email
**Solution**: Fill all required fields with unique email

### Issue: Cannot remove staff
**Cause**: Trying to remove static staff or staff from different branch
**Solution**: Only remove dynamic staff from your branch

---

## 📝 Quick Commands

### Generate Random Password
Click "Generate" button in Add Staff dialog

### Copy Staff Credentials
Click "Copy" button on staff card

### Toggle Password Visibility
Click eye icon in password field

### Search Staff
Type in search box (searches name and email)

### Filter by Role
Select role from dropdown

---

## 🔒 Security Checks

✅ Branch managers can only see their branch staff
✅ Branch managers cannot add privileged roles
✅ Branch managers cannot remove staff from other branches
✅ All new staff must change credentials on first login
✅ Email uniqueness enforced
✅ Users cannot remove themselves
✅ Passwords must be at least 6 characters

---

## 📱 Mobile Testing

Test on mobile devices:
- [ ] Staff cards responsive layout
- [ ] Add staff dialog mobile-friendly
- [ ] Search and filter work on mobile
- [ ] Statistics cards stack properly
- [ ] Buttons accessible on mobile

---

## 🎨 UI Elements to Verify

### Colors
- Receptionist: Blue
- Waiter: Emerald
- Kitchen Staff: Orange
- Housekeeping: Purple
- Restaurant Staff: Teal
- Branch Manager: Indigo

### Badges
- Role badges with appropriate colors
- "Must change login" badge in amber
- Status indicators

### Icons
- UserPlus for add staff
- Users for staff count
- Mail for email
- Phone for phone number
- Copy for copy credentials
- Trash2 for remove
- Eye/EyeOff for password visibility
- Lock for security notices

---

## 📈 Success Metrics

After implementation, verify:
- ✅ Branch managers can independently manage their staff
- ✅ Super users maintain oversight of all branches
- ✅ All new staff change credentials on first login
- ✅ No unauthorized access to other branches
- ✅ Email uniqueness maintained
- ✅ Proper role restrictions enforced
- ✅ UI is intuitive and responsive

---

## 🚨 Emergency Procedures

### If locked out:
1. Login as Super Admin (admin@eastgate.rw / admin123)
2. Navigate to `/admin/staff-management`
3. Reset or remove problematic account

### If credentials not working:
1. Clear browser cache
2. Logout completely
3. Login again with correct credentials

### If branch manager cannot add staff:
1. Verify branch assignment
2. Check role permissions
3. Ensure not trying to add restricted roles

---

## 📞 Support

For issues or questions:
1. Check STAFF_MANAGEMENT_IMPLEMENTATION.md for detailed documentation
2. Review error messages carefully
3. Verify test credentials are correct
4. Check browser console for errors

---

**Last Updated**: 2026-02-12
**Version**: 1.0.0
