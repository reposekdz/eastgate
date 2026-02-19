# Eastgate Hotel - Branch Manager System Setup

## 🎯 Overview

This document provides complete setup instructions for the Eastgate Hotel Branch Manager System with MySQL database and Node.js backend. The system enables branch managers to fully manage hotel operations with credentials provided by super managers.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher ([Download](https://nodejs.org/))
- **MySQL** 8.0 or higher ([Download](https://dev.mysql.com/downloads/))
- **npm** or **yarn** package manager
- **Git** (optional, for version control)

## 🚀 Quick Start (Automated Setup)

### For Windows Users:

1. Open PowerShell as Administrator
2. Navigate to the project directory:
   ```powershell
   cd eastgate
   ```
3. Run the setup script:
   ```powershell
   .\scripts\setup-manager.ps1
   ```
4. Follow the prompts

### For Linux/Mac Users:

1. Open Terminal
2. Navigate to the project directory:
   ```bash
   cd eastgate
   ```
3. Make the script executable:
   ```bash
   chmod +x scripts/setup-manager.sh
   ```
4. Run the setup script:
   ```bash
   ./scripts/setup-manager.sh
   ```
5. Follow the prompts

## 📝 Manual Setup (Step-by-Step)

### Step 1: Clone/Download the Project

```bash
# If using Git
git clone <repository-url>
cd eastgate

# Or extract the ZIP file and navigate to the directory
```

### Step 2: Install Node.js Dependencies

```bash
npm install
```

### Step 3: Set Up MySQL Database

#### Option A: Using MySQL Command Line

1. **Login to MySQL as root:**
   ```bash
   mysql -u root -p
   ```

2. **Run the setup script:**
   ```sql
   source scripts/setup-mysql.sql
   ```

3. **Exit MySQL:**
   ```sql
   exit;
   ```

#### Option B: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your MySQL server
3. Open the file `scripts/setup-mysql.sql`
4. Execute the script

#### Option C: Manual Database Creation

```sql
-- Create database
CREATE DATABASE eastgate_hotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'eastgate_admin'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON eastgate_hotel.* TO 'eastgate_admin'@'localhost';
FLUSH PRIVILEGES;
```

### Step 4: Configure Environment Variables

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file and update the following:**
   ```env
   # Database Configuration
   DATABASE_URL="mysql://eastgate_admin:your_secure_password@localhost:3306/eastgate_hotel"

   # NextAuth Configuration
   NEXTAUTH_SECRET="generate-a-random-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"

   # Optional: Stripe, Resend, Pusher configurations
   ```

3. **Generate a secure NEXTAUTH_SECRET:**
   ```bash
   # Using Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   
   # Or using OpenSSL
   openssl rand -base64 32
   ```

### Step 5: Initialize Prisma

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Push the schema to database:**
   ```bash
   npx prisma db push
   ```

3. **Seed the database (optional but recommended):**
   ```bash
   npm run db:seed
   ```

### Step 6: Start the Application

1. **Development mode:**
   ```bash
   npm run dev
   ```

2. **Production mode:**
   ```bash
   npm run build
   npm start
   ```

3. **Access the application:**
   Open your browser and go to: `http://localhost:3000`

## 👤 Default Login Credentials

After seeding the database, you can login with:

### Super Admin
- **Email:** admin@eastgate.com
- **Password:** admin123

### Super Manager
- **Email:** supermanager@eastgate.com
- **Password:** manager123

### Branch Manager (Kigali Branch)
- **Email:** manager@eastgate.com
- **Password:** manager123

**⚠️ IMPORTANT:** Change these credentials immediately after first login!

## 🔐 Manager Credential Management

### Creating Staff Accounts (As a Manager)

1. **Login to your manager account**
2. **Navigate to Staff Management**
3. **Click "Add New Staff"**
4. **Fill in the details:**
   - Full Name
   - Email (company email)
   - Phone Number
   - Role (RECEPTIONIST, WAITER, CHEF, etc.)
   - Initial Password (strong password)

5. **Submit the form**
6. **Save the credentials** - They are shown only once!
7. **Securely share credentials with the staff member**

### Staff First Login

When a staff member logs in for the first time:
1. They use the credentials provided by the manager
2. The system forces them to change their password
3. New password must meet security requirements:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one number
   - At least one special character

## 📊 Manager Features

### Dashboard
- Real-time revenue metrics
- Occupancy rates and room status
- Active orders and pending requests
- Staff performance metrics
- Recent activities timeline
- Smart alerts and notifications

**Access:** `http://localhost:3000/manager`
**API:** `GET /api/manager/dashboard?period=month`

### Staff Management
- Create and manage staff accounts
- Assign roles and permissions
- View staff performance
- Track attendance and shifts

**Access:** `http://localhost:3000/manager/staff`
**API:** `GET /api/manager/staff`, `POST /api/manager/staff`

### Advanced Analytics
- Revenue forecasting
- Predictive occupancy trends
- Guest demographics
- Popular menu items
- Performance insights

**Access:** `http://localhost:3000/manager/analytics`
**API:** `GET /api/manager/analytics?period=30`

### Comprehensive Reports
- Financial reports (revenue, profit, costs)
- Staff performance reports
- Operations reports (rooms, orders, maintenance)
- Guest analytics reports

**Access:** `http://localhost:3000/manager/reports`
**API:** `GET /api/manager/reports?type=financial&period=month`

### Branch Operations
- Booking management (create, update, check-in/out)
- Room inventory management
- Restaurant order processing
- Service request handling
- Guest management

## 🛠️ Database Management

### View Database with Prisma Studio

```bash
npm run db:studio
```

This opens a web interface at `http://localhost:5555` where you can:
- View all tables and data
- Edit records
- Run queries
- Manage relationships

### Run Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

### Backup Database

```bash
# Using mysqldump
mysqldump -u eastgate_admin -p eastgate_hotel > backup.sql

# Restore from backup
mysql -u eastgate_admin -p eastgate_hotel < backup.sql
```

## 🔧 Troubleshooting

### Issue: "Can't reach database server"

**Solution:**
1. Check if MySQL service is running:
   ```bash
   # Windows
   net start MySQL80
   
   # Linux
   sudo systemctl start mysql
   
   # Mac
   brew services start mysql
   ```

2. Verify DATABASE_URL in `.env`
3. Test MySQL connection:
   ```bash
   mysql -u eastgate_admin -p
   ```

### Issue: "Authentication failed"

**Solution:**
1. Verify credentials are correct
2. Check if user account is active (not suspended)
3. Ensure database user has proper permissions

### Issue: "Prisma Client not generated"

**Solution:**
```bash
npx prisma generate
```

### Issue: "Migration errors"

**Solution:**
```bash
# Reset and regenerate
npx prisma migrate reset
npx prisma db push
npm run db:seed
```

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Change port in package.json or use:
PORT=3001 npm run dev
```

## 📚 Additional Resources

- **Manager Guide:** See [`MANAGER_GUIDE.md`](./MANAGER_GUIDE.md) for detailed feature documentation
- **API Documentation:** See [`API_DOCS.md`](./API_DOCS.md) for complete API reference
- **Prisma Documentation:** [https://www.prisma.io/docs](https://www.prisma.io/docs)
- **Next.js Documentation:** [https://nextjs.org/docs](https://nextjs.org/docs)
- **MySQL Documentation:** [https://dev.mysql.com/doc/](https://dev.mysql.com/doc/)

## 🔒 Security Best Practices

1. **Change default passwords immediately**
2. **Use strong passwords** (min 12 characters, mixed case, numbers, symbols)
3. **Enable HTTPS in production**
4. **Keep dependencies updated:** `npm audit` and `npm update`
5. **Use environment variables** for sensitive data (never commit `.env`)
6. **Regular database backups**
7. **Implement rate limiting** for API endpoints
8. **Monitor failed login attempts**
9. **Use secure password distribution** methods for new staff

## 📧 Support

For technical support or questions:

- **Email:** support@eastgate.com
- **Documentation:** See [`MANAGER_GUIDE.md`](./MANAGER_GUIDE.md)
- **Issue Tracker:** Create an issue in the repository

## 📄 License

Copyright © 2026 Eastgate Hotel. All rights reserved.

---

## ✅ Quick Checklist

Before going live, ensure you have:

- [ ] Changed all default passwords
- [ ] Updated DATABASE_URL with secure credentials
- [ ] Generated a secure NEXTAUTH_SECRET
- [ ] Configured Stripe keys (if using payments)
- [ ] Set up email service (Resend API key)
- [ ] Configured Pusher (if using real-time features)
- [ ] Tested all manager features
- [ ] Backed up the database
- [ ] Enabled HTTPS/SSL
- [ ] Set up monitoring and logging
- [ ] Trained staff on system usage
- [ ] Documented custom procedures

---

**Version:** 2.0  
**Last Updated:** February 2026  
**Author:** Eastgate Hotel IT Department
