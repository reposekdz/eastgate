/**
 * Advanced Management System
 * Staff management, inventory, financials, and reporting
 */

import bcryptjs from "bcryptjs";
import prisma from "@/lib/prisma";

// ============================================
// STAFF MANAGEMENT
// ============================================

export enum EmploymentStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  ON_LEAVE = "on_leave",
  SUSPENDED = "suspended",
  TERMINATED = "terminated",
}

export enum ShiftType {
  MORNING = "morning",
  AFTERNOON = "afternoon",
  EVENING = "evening",
  NIGHT = "night",
  FLEXIBLE = "flexible",
}

export interface StaffRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  shift: ShiftType;
  status: EmploymentStatus;
  salary: number;
  hireDate: Date;
  avatar?: string;
  permissions: string[];
}

export interface AttendanceRecord {
  staffId: string;
  date: Date;
  clockIn: Date;
  clockOut?: Date;
  status: "present" | "late" | "absent" | "half_day";
  notes?: string;
}

/**
 * Create staff member
 */
export async function createStaffMember(
  data: Partial<StaffRecord> & { password: string; branchId: string }
): Promise<StaffRecord> {
  try {
    // Hash password
    const hashedPassword = await bcryptjs.hash(data.password, 10);

    // Validate email uniqueness
    const existingStaff = await prisma.staff.findUnique({
      where: { email: data.email! },
    });

    if (existingStaff) {
      throw new Error("Email already exists");
    }

    const staff = await prisma.staff.create({
      data: {
        name: data.name!,
        email: data.email!,
        password: hashedPassword,
        phone: data.phone,
        role: data.role!,
        department: data.department!,
        shift: data.shift,
        status: data.status || EmploymentStatus.ACTIVE,
        salary: data.salary,
        hireDate: data.hireDate || new Date(),
        avatar: data.avatar,
        permissions: data.permissions || [],
        branchId: data.branchId,
      },
    });

    // Send welcome email
    await sendWelcomeEmail(staff);

    return staff as StaffRecord;
  } catch (error) {
    console.error("Staff creation error:", error);
    throw error;
  }
}

/**
 * Update staff information
 */
export async function updateStaffMember(
  staffId: string,
  updates: Partial<StaffRecord>
): Promise<StaffRecord> {
  try {
    const staff = await prisma.staff.update({
      where: { id: staffId },
      data: updates,
    });

    return staff as StaffRecord;
  } catch (error) {
    console.error("Staff update error:", error);
    throw error;
  }
}

/**
 * Get staff by role
 */
export async function getStaffByRole(
  branchId: string,
  role: string
): Promise<StaffRecord[]> {
  try {
    const staff = await prisma.staff.findMany({
      where: {
        branchId,
        role,
        status: EmploymentStatus.ACTIVE,
      },
    });

    return staff as StaffRecord[];
  } catch (error) {
    console.error("Staff fetch error:", error);
    throw error;
  }
}

/**
 * Record attendance
 */
export async function recordAttendance(
  staffId: string,
  date: Date,
  clockIn: Date,
  clockOut?: Date
): Promise<AttendanceRecord> {
  try {
    // Determine status based on clock-in time
    const expectedClockIn = new Date(clockIn);
    expectedClockIn.setHours(8, 0, 0, 0); // Assuming 8 AM is expected time

    const status =
      clockIn > expectedClockIn ? "late" : "present";

    return {
      staffId,
      date,
      clockIn,
      clockOut,
      status,
    };
  } catch (error) {
    console.error("Attendance recording error:", error);
    throw error;
  }
}

/**
 * Get staff performance metrics
 */
export async function getStaffPerformance(
  staffId: string,
  period: "month" | "quarter" | "year" = "month"
): Promise<any> {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      throw new Error("Staff not found");
    }

    // TODO: Calculate performance metrics
    return {
      staffId,
      name: staff.name,
      role: staff.role,
      ordersCreated: 0,
      customerRating: 0,
      attendanceRate: 0,
      performanceScore: 0,
    };
  } catch (error) {
    console.error("Performance metrics error:", error);
    throw error;
  }
}

// ============================================
// INVENTORY MANAGEMENT
// ============================================

export enum InventoryStatus {
  IN_STOCK = "in_stock",
  LOW_STOCK = "low_stock",
  OUT_OF_STOCK = "out_of_stock",
  DISCONTINUED = "discontinued",
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  reorderLevel: number;
  supplier: string;
  expiryDate?: Date;
  status: InventoryStatus;
}

/**
 * Create inventory item
 */
export async function createInventoryItem(
  data: Partial<InventoryItem> & { branchId: string }
): Promise<InventoryItem> {
  try {
    const item = await prisma.inventory.create({
      data: {
        name: data.name!,
        sku: data.sku!,
        category: data.category!,
        quantity: data.quantity || 0,
        unit: data.unit!,
        unitPrice: data.unitPrice!,
        reorderLevel: data.reorderLevel!,
        supplier: data.supplier,
        expiryDate: data.expiryDate,
        branchId: data.branchId,
      },
    });

    return item as InventoryItem;
  } catch (error) {
    console.error("Inventory item creation error:", error);
    throw error;
  }
}

/**
 * Update inventory quantity
 */
export async function updateInventoryQuantity(
  itemId: string,
  quantity: number,
  type: "add" | "subtract" | "set",
  reason?: string
): Promise<InventoryItem> {
  try {
    const item = await prisma.inventory.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new Error("Inventory item not found");
    }

    let newQuantity: number;
    switch (type) {
      case "add":
        newQuantity = item.quantity + quantity;
        break;
      case "subtract":
        newQuantity = Math.max(0, item.quantity - quantity);
        break;
      case "set":
        newQuantity = quantity;
        break;
    }

    // Determine status
    let status: InventoryStatus;
    if (newQuantity === 0) {
      status = InventoryStatus.OUT_OF_STOCK;
    } else if (newQuantity <= item.reorderLevel) {
      status = InventoryStatus.LOW_STOCK;
    } else {
      status = InventoryStatus.IN_STOCK;
    }

    const updatedItem = await prisma.inventory.update({
      where: { id: itemId },
      data: {
        quantity: newQuantity,
        status,
      },
    });

    // Log the transaction
    // TODO: Create inventory log

    return updatedItem as InventoryItem;
  } catch (error) {
    console.error("Inventory update error:", error);
    throw error;
  }
}

/**
 * Get low stock items
 */
export async function getLowStockItems(branchId: string): Promise<InventoryItem[]> {
  try {
    const items = await prisma.inventory.findMany({
      where: {
        branchId,
        quantity: {
          lte: prisma.inventory.fields.reorderLevel,
        },
      },
    });

    return items as InventoryItem[];
  } catch (error) {
    console.error("Low stock check error:", error);
    throw error;
  }
}

/**
 * Get inventory value
 */
export async function getInventoryValue(branchId: string): Promise<number> {
  try {
    const items = await prisma.inventory.findMany({
      where: { branchId },
    });

    return items.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0
    );
  } catch (error) {
    console.error("Inventory value calculation error:", error);
    throw error;
  }
}

// ============================================
// FINANCIAL MANAGEMENT
// ============================================

export interface ExpenseRecord {
  id: string;
  category: string;
  amount: number;
  description: string;
  vendor: string;
  date: Date;
  receipt: string;
  approvedBy?: string;
  status: "pending" | "approved" | "rejected";
}

/**
 * Record expense
 */
export async function recordExpense(
  data: Partial<ExpenseRecord> & { branchId: string }
): Promise<ExpenseRecord> {
  try {
    const expense = await prisma.expense.create({
      data: {
        category: data.category!,
        amount: data.amount!,
        description: data.description,
        vendor: data.vendor,
        receipt: data.receipt,
        date: data.date || new Date(),
        branchId: data.branchId,
      },
    });

    return expense as ExpenseRecord;
  } catch (error) {
    console.error("Expense recording error:", error);
    throw error;
  }
}

/**
 * Get branch expenses
 */
export async function getBranchExpenses(
  branchId: string,
  startDate: Date,
  endDate: Date
): Promise<ExpenseRecord[]> {
  try {
    const expenses = await prisma.expense.findMany({
      where: {
        branchId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "desc" },
    });

    return expenses as ExpenseRecord[];
  } catch (error) {
    console.error("Expense fetch error:", error);
    throw error;
  }
}

/**
 * Get expense summary
 */
export async function getExpenseSummary(
  branchId: string,
  startDate: Date,
  endDate: Date
): Promise<any> {
  try {
    const expenses = await getBranchExpenses(branchId, startDate, endDate);

    const summary: Record<string, number> = {};
    let total = 0;

    expenses.forEach((expense) => {
      summary[expense.category] = (summary[expense.category] || 0) + expense.amount;
      total += expense.amount;
    });

    return {
      total,
      byCategory: summary,
      count: expenses.length,
    };
  } catch (error) {
    console.error("Expense summary error:", error);
    throw error;
  }
}

// ============================================
// NOTIFICATIONS & COMMUNICATIONS
// ============================================

/**
 * Send welcome email to new staff
 */
async function sendWelcomeEmail(staff: StaffRecord): Promise<void> {
  // TODO: Implement with nodemailer
  console.log(`Sending welcome email to ${staff.email}`);
}

/**
 * Send low stock alert
 */
export async function sendLowStockAlert(item: InventoryItem): Promise<void> {
  // TODO: Implement alert mechanism
  console.log(`Low stock alert for: ${item.name}`);
}

/**
 * Send expense approval request
 */
export async function sendExpenseApprovalRequest(expense: ExpenseRecord): Promise<void> {
  // TODO: Implement approval workflow
  console.log(`Expense approval needed for: ${expense.description}`);
}
