# 🎯 Staff Management - Quick Reference Card

## 🚀 Getting Started in 3 Steps

### Step 1: Login as Super Manager
```
URL: http://localhost:3000/login
Email: manager@eastgate.rw
Password: manager123
Branch: Kigali Main
```

### Step 2: Add a Branch Manager
```
Navigate to: /admin/staff-management
Click: "Add Staff & Assign Credentials"
Fill: Name, Email, Password, Role (Branch Manager), Branch
Result: New manager must change credentials on first login
```

### Step 3: Branch Manager Adds Staff
```
Login as: New branch manager (after changing credentials)
Navigate to: /manager/staff-management
Click: "Add Staff"
Fill: Name, Email, Password, Role (Receptionist/Waiter/etc.)
Result: New staff must change credentials on first login
```

---

## 🔑 Test Credentials

| Role | Email | Password | Branch |
|------|-------|----------|--------|
| Super Manager | manager@eastgate.rw | manager123 | Any |
| Branch Manager (Kigali) | jp@eastgate.rw | jp123 | Kigali Main |
| Branch Manager (Ngoma) | diane@eastgate.rw | diane123 | Ngoma Branch |

---

## ✅ What Branch Managers Can Do

✅ Add Receptionist
✅ Add Waiter
✅ Add Kitchen Staff
✅ Add Housekeeping
✅ Add Restaurant Staff
✅ View their branch staff only
✅ Remove staff they added
✅ Search and filter staff

---

## ❌ What Branch Managers Cannot Do

❌ Add Super Admin
❌ Add Super Manager
❌ Add Branch Manager
❌ Add Accountant
❌ Add Event Manager
❌ Add staff to other branches
❌ View staff from other branches
❌ Remove staff from other branches

---

## 🎨 UI Features

### Staff Cards
- Avatar and name
- Role badge (color-coded)
- Email and phone
- "Must change login" indicator
- Copy credentials button
- Remove button

### Statistics
- Total staff count
- Count by role
- Real-time updates

### Search & Filter
- Search by name/email
- Filter by role
- Instant results

---

## 🔒 Security

✅ Branch isolation enforced
✅ Role restrictions enforced
✅ Mandatory credential change
✅ Email uniqueness validated
✅ Self-protection enabled

---

## 📚 Documentation

- `STAFF_MANAGEMENT_IMPLEMENTATION.md` - Full documentation
- `STAFF_MANAGEMENT_TESTING.md` - Testing guide
- `STAFF_MANAGEMENT_VISUAL_GUIDE.md` - Visual diagrams
- `IMPLEMENTATION_COMPLETE.md` - Summary

---

## 🐛 Common Issues

**Issue**: "Select a branch first"
**Fix**: Ensure branch manager is assigned to specific branch

**Issue**: Cannot see staff
**Fix**: Login with correct branch credentials

**Issue**: Cannot add staff
**Fix**: Check required fields and email uniqueness

---

## 📞 Quick Help

1. Check error message carefully
2. Verify test credentials
3. Ensure branch assignment is correct
4. Review documentation files
5. Check browser console for errors

---

## 🎉 Success Checklist

- [ ] Super Manager can add Branch Manager
- [ ] Branch Manager can add Receptionist
- [ ] Branch Manager can add Waiter
- [ ] New staff must change credentials
- [ ] Branch isolation works
- [ ] Role restrictions work
- [ ] Search and filter work
- [ ] Statistics update correctly

---

**Print this card for quick reference while testing!**

**Version**: 1.0.0 | **Date**: 2026-02-12
