# 🚀 Quick Start - Login Fix

## ⚡ 3-Step Setup

### Step 1: Seed Database
```bash
npm run db:seed:complete
```

### Step 2: Start Server
```bash
npm run dev
```

### Step 3: Login
Go to: `http://localhost:3000/login`

**Test Account:**
```
Email: admin@eastgate.rw
Password: admin123
```

---

## 📋 All Test Accounts

### Super Admin (Full Access)
```
eastgate@gmail.com / 2026
admin@eastgate.rw / admin123
```

### Super Manager (Full Access)
```
manager@eastgate.rw / manager123
```

### Kigali Main Branch
```
jp@eastgate.rw / jp123 (Manager)
grace@eastgate.rw / grace123 (Receptionist)
patrick@eastgate.rw / patrick123 (Waiter)
```

### Ngoma Branch
```
diane@eastgate.rw / diane123 (Manager)
eric.n@eastgate.rw / eric123 (Receptionist)
```

### Kirehe Branch
```
patrick.n@eastgate.rw / patrick.n123 (Manager)
esperance@eastgate.rw / esperance123 (Receptionist)
```

### Gatsibo Branch
```
emmanuel.m@eastgate.rw / emmanuel123 (Manager)
sylvie@eastgate.rw / sylvie123 (Receptionist)
```

---

## ✅ What's Fixed

- ✅ Database credentials now work
- ✅ Error messages show in UI
- ✅ Input validation (required fields)
- ✅ Email format validation
- ✅ Better error messages
- ✅ Console logging for debugging

---

## 🔧 Troubleshooting

### Login fails?
```bash
# Re-seed database
npm run db:seed:complete

# Test login
npm run db:test:login
```

### No error showing?
- Clear browser cache (Ctrl + Shift + R)
- Check browser console (F12)

### Database connection error?
- Check `.env` file has `DATABASE_URL`
- Run `npm run db:push`

---

## 📖 Full Documentation

- `LOGIN_FIX_README.md` - Complete guide
- `LOGIN_FIX_SUMMARY.md` - Technical details

---

**Ready to go! 🎉**
