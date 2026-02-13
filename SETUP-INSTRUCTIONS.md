# EastGate Hotel Management System - Setup Instructions

## Required Packages Installation

Due to PowerShell execution policy restrictions, please install the required packages manually:

```bash
# Open Command Prompt (cmd) or Git Bash and run:
npm install zustand @tanstack/react-query next-auth@beta bcryptjs prisma @prisma/client
npm install --save-dev @types/bcryptjs
```

## Authentication Credentials

The system includes mock authentication with the following test accounts:

### Super Admin
- **Email**: admin@eastgate.rw
- **Password**: admin123
- **Access**: All branches, full system control

### Super Manager
- **Email**: manager@eastgate.rw
- **Password**: manager123
- **Access**: All branches, management features

### Branch Manager (Kigali Main)
- **Email**: jp@eastgate.rw
- **Password**: jp123
- **Access**: Kigali Main branch only

### Receptionist (Kigali Main)
- **Email**: grace@eastgate.rw
- **Password**: grace123
- **Access**: Front desk operations

### Waiter (Kigali Main)
- **Email**: patrick@eastgate.rw
- **Password**: patrick123
- **Access**: Restaurant orders and menu

### Branch Manager (Ngoma)
- **Email**: diane@eastgate.rw
- **Password**: diane123
- **Access**: Ngoma Branch only

### Accountant (Kigali Main)
- **Email**: aimee@eastgate.rw
- **Password**: aimee123
- **Access**: Finance and accounting

## Features Implemented

1. **Multi-Branch Support**: Kigali Main, Ngoma, Kirehe, and Gatsibo branches
2. **RWF Currency**: All pricing converted to Rwandan Francs
3. **Role-Based Access Control**: 9 different user roles with specific permissions
4. **Customer Booking System**: Interactive booking flow with branch selection
5. **Admin Dashboards**: Customized for each role
6. **Receptionist Interface**: Guest check-in/check-out management
7. **Waiter Dashboard**: Menu and order management
8. **Interactive Features**: Animations, responsive design, modern UI

## How to Run

```bash
npm run dev
```

Navigate to:
- **Customer Site**: http://localhost:3000
- **Login Page**: http://localhost:3000/login
- **Admin Dashboard**: http://localhost:3000/admin (after login)

## Branch Selection

During login, select your branch:
- Kigali Main (br-001)
- Ngoma Branch (br-002)
- Kirehe Branch (br-003)
- Gatsibo Branch (br-004)

Note: Super Admin and Super Manager can access all branches.
