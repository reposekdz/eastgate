/**
 * Advanced Role-Based Access Control (RBAC) System
 * Granular permissions with resource-level access control
 */

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  level: number; // Higher level = more privilege
}

// ============================================
// PERMISSION DEFINITIONS
// ============================================

export const CORE_PERMISSIONS: Record<string, Permission> = {
  // User & Staff Management
  USER_CREATE: {
    id: "user:create",
    name: "Create Users",
    description: "Create new user accounts",
    category: "user_management",
  },
  USER_READ: {
    id: "user:read",
    name: "View Users",
    description: "View user information",
    category: "user_management",
  },
  USER_UPDATE: {
    id: "user:update",
    name: "Update Users",
    description: "Update user information",
    category: "user_management",
  },
  USER_DELETE: {
    id: "user:delete",
    name: "Delete Users",
    description: "Delete user accounts",
    category: "user_management",
  },
  USER_RESET_PASSWORD: {
    id: "user:reset_password",
    name: "Reset User Password",
    description: "Reset user passwords",
    category: "user_management",
  },

  // Staff Management
  STAFF_CREATE: {
    id: "staff:create",
    name: "Create Staff",
    description: "Add new staff members",
    category: "staff_management",
  },
  STAFF_READ: {
    id: "staff:read",
    name: "View Staff",
    description: "View staff information",
    category: "staff_management",
  },
  STAFF_UPDATE: {
    id: "staff:update",
    name: "Update Staff",
    description: "Update staff information",
    category: "staff_management",
  },
  STAFF_DELETE: {
    id: "staff:delete",
    name: "Delete Staff",
    description: "Remove staff members",
    category: "staff_management",
  },
  STAFF_ASSIGN_ROLE: {
    id: "staff:assign_role",
    name: "Assign Staff Roles",
    description: "Assign roles to staff members",
    category: "staff_management",
  },

  // Room Management
  ROOM_CREATE: {
    id: "room:create",
    name: "Create Rooms",
    description: "Add new rooms",
    category: "room_management",
  },
  ROOM_READ: {
    id: "room:read",
    name: "View Rooms",
    description: "View room information",
    category: "room_management",
  },
  ROOM_UPDATE: {
    id: "room:update",
    name: "Update Rooms",
    description: "Update room information",
    category: "room_management",
  },
  ROOM_DELETE: {
    id: "room:delete",
    name: "Delete Rooms",
    description: "Delete rooms",
    category: "room_management",
  },
  ROOM_MANAGE_AVAILABILITY: {
    id: "room:manage_availability",
    name: "Manage Room Availability",
    description: "Mark rooms as available/unavailable",
    category: "room_management",
  },

  // Booking Management
  BOOKING_CREATE: {
    id: "booking:create",
    name: "Create Bookings",
    description: "Create new bookings",
    category: "booking_management",
  },
  BOOKING_READ: {
    id: "booking:read",
    name: "View Bookings",
    description: "View booking information",
    category: "booking_management",
  },
  BOOKING_UPDATE: {
    id: "booking:update",
    name: "Update Bookings",
    description: "Update booking information",
    category: "booking_management",
  },
  BOOKING_CANCEL: {
    id: "booking:cancel",
    name: "Cancel Bookings",
    description: "Cancel bookings",
    category: "booking_management",
  },
  BOOKING_CHECK_IN: {
    id: "booking:check_in",
    name: "Check-in Guests",
    description: "Check in guests",
    category: "booking_management",
  },
  BOOKING_CHECK_OUT: {
    id: "booking:check_out",
    name: "Check-out Guests",
    description: "Check out guests",
    category: "booking_management",
  },

  // Menu Management
  MENU_CREATE: {
    id: "menu:create",
    name: "Create Menu Items",
    description: "Add new menu items",
    category: "menu_management",
  },
  MENU_READ: {
    id: "menu:read",
    name: "View Menu",
    description: "View menu items",
    category: "menu_management",
  },
  MENU_UPDATE: {
    id: "menu:update",
    name: "Update Menu",
    description: "Update menu items",
    category: "menu_management",
  },
  MENU_DELETE: {
    id: "menu:delete",
    name: "Delete Menu Items",
    description: "Delete menu items",
    category: "menu_management",
  },

  // Order Management
  ORDER_CREATE: {
    id: "order:create",
    name: "Create Orders",
    description: "Create new orders",
    category: "order_management",
  },
  ORDER_READ: {
    id: "order:read",
    name: "View Orders",
    description: "View order information",
    category: "order_management",
  },
  ORDER_UPDATE: {
    id: "order:update",
    name: "Update Orders",
    description: "Update order information",
    category: "order_management",
  },
  ORDER_CANCEL: {
    id: "order:cancel",
    name: "Cancel Orders",
    description: "Cancel orders",
    category: "order_management",
  },

  // Payment Management
  PAYMENT_CREATE: {
    id: "payment:create",
    name: "Create Payments",
    description: "Process new payments",
    category: "payment_management",
  },
  PAYMENT_READ: {
    id: "payment:read",
    name: "View Payments",
    description: "View payment information",
    category: "payment_management",
  },
  PAYMENT_REFUND: {
    id: "payment:refund",
    name: "Process Refunds",
    description: "Process payment refunds",
    category: "payment_management",
  },

  // Inventory Management
  INVENTORY_READ: {
    id: "inventory:read",
    name: "View Inventory",
    description: "View inventory items",
    category: "inventory_management",
  },
  INVENTORY_UPDATE: {
    id: "inventory:update",
    name: "Update Inventory",
    description: "Update inventory items",
    category: "inventory_management",
  },

  // Analytics & Reporting
  ANALYTICS_READ: {
    id: "analytics:read",
    name: "View Analytics",
    description: "View analytics and reports",
    category: "analytics",
  },
  ANALYTICS_EXPORT: {
    id: "analytics:export",
    name: "Export Reports",
    description: "Export analytics and reports",
    category: "analytics",
  },

  // Settings & Configuration
  SETTINGS_READ: {
    id: "settings:read",
    name: "View Settings",
    description: "View system settings",
    category: "settings",
  },
  SETTINGS_UPDATE: {
    id: "settings:update",
    name: "Update Settings",
    description: "Update system settings",
    category: "settings",
  },

  // Branch Management
  BRANCH_READ: {
    id: "branch:read",
    name: "View Branches",
    description: "View branch information",
    category: "branch_management",
  },
  BRANCH_UPDATE: {
    id: "branch:update",
    name: "Update Branches",
    description: "Update branch information",
    category: "branch_management",
  },
  BRANCH_CREATE: {
    id: "branch:create",
    name: "Create Branches",
    description: "Create new branches",
    category: "branch_management",
  },
};

// ============================================
// ROLE DEFINITIONS
// ============================================

export const ROLE_DEFINITIONS: Record<string, Role> = {
  SUPER_ADMIN: {
    id: "super_admin",
    name: "Super Administrator",
    level: 100,
    permissions: Object.values(CORE_PERMISSIONS),
  },
  SUPER_MANAGER: {
    id: "super_manager",
    name: "Super Manager",
    level: 90,
    permissions: Object.values(CORE_PERMISSIONS).filter(
      (p) => p.id !== "user:delete" && p.id !== "user:reset_password"
    ),
  },
  BRANCH_MANAGER: {
    id: "branch_manager",
    name: "Branch Manager",
    level: 80,
    permissions: Object.values(CORE_PERMISSIONS).filter((p) => {
      const restrictedIds = [
        "user:create",
        "user:delete",
        "staff:delete",
        "branch:create",
      ];
      return !restrictedIds.includes(p.id);
    }),
  },
  MANAGER: {
    id: "manager",
    name: "Manager",
    level: 70,
    permissions: Object.values(CORE_PERMISSIONS).filter((p) => {
      const allowedCategories = [
        "staff_management",
        "room_management",
        "booking_management",
        "menu_management",
        "order_management",
        "analytics",
      ];
      return allowedCategories.includes(p.category);
    }),
  },
  RECEPTIONIST: {
    id: "receptionist",
    name: "Receptionist",
    level: 50,
    permissions: [
      CORE_PERMISSIONS.BOOKING_CREATE,
      CORE_PERMISSIONS.BOOKING_READ,
      CORE_PERMISSIONS.BOOKING_UPDATE,
      CORE_PERMISSIONS.BOOKING_CHECK_IN,
      CORE_PERMISSIONS.BOOKING_CHECK_OUT,
      CORE_PERMISSIONS.ROOM_READ,
      CORE_PERMISSIONS.ORDER_CREATE,
      CORE_PERMISSIONS.ORDER_READ,
      CORE_PERMISSIONS.PAYMENT_CREATE,
      CORE_PERMISSIONS.PAYMENT_READ,
    ],
  },
  WAITER: {
    id: "waiter",
    name: "Waiter",
    level: 30,
    permissions: [
      CORE_PERMISSIONS.ORDER_CREATE,
      CORE_PERMISSIONS.ORDER_READ,
      CORE_PERMISSIONS.ORDER_UPDATE,
      CORE_PERMISSIONS.MENU_READ,
      CORE_PERMISSIONS.PAYMENT_CREATE,
      CORE_PERMISSIONS.PAYMENT_READ,
    ],
  },
  CHEF: {
    id: "chef",
    name: "Chef",
    level: 30,
    permissions: [
      CORE_PERMISSIONS.ORDER_READ,
      CORE_PERMISSIONS.ORDER_UPDATE,
      CORE_PERMISSIONS.MENU_READ,
      CORE_PERMISSIONS.INVENTORY_READ,
      CORE_PERMISSIONS.INVENTORY_UPDATE,
    ],
  },
  KITCHEN_STAFF: {
    id: "kitchen_staff",
    name: "Kitchen Staff",
    level: 20,
    permissions: [
      CORE_PERMISSIONS.ORDER_READ,
      CORE_PERMISSIONS.ORDER_UPDATE,
      CORE_PERMISSIONS.MENU_READ,
      CORE_PERMISSIONS.INVENTORY_READ,
    ],
  },
  STAFF: {
    id: "staff",
    name: "Staff",
    level: 10,
    permissions: [CORE_PERMISSIONS.ANALYTICS_READ],
  },
};

// ============================================
// PERMISSION CHECKING
// ============================================

/**
 * Check if user has permission
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user has any of the permissions
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some((p) => userPermissions.includes(p));
}

/**
 * Check if user has all permissions
 */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.every((p) => userPermissions.includes(p));
}

/**
 * Get permissions for role
 */
export function getPermissionsForRole(roleId: string): string[] {
  const role = ROLE_DEFINITIONS[roleId];
  if (!role) return [];
  return role.permissions.map((p) => p.id);
}

/**
 * Check if role can perform action
 */
export function canRolePerformAction(roleId: string, permissionId: string): boolean {
  const permissions = getPermissionsForRole(roleId);
  return permissions.includes(permissionId);
}

/**
 * Get role hierarchy level
 */
export function getRoleLevel(roleId: string): number {
  const role = ROLE_DEFINITIONS[roleId];
  return role?.level || 0;
}

/**
 * Check if user role is higher or equal to required role
 */
export function hasHigherOrEqualRole(userRoleId: string, requiredRoleId: string): boolean {
  const userLevel = getRoleLevel(userRoleId);
  const requiredLevel = getRoleLevel(requiredRoleId);
  return userLevel >= requiredLevel;
}

// ============================================
// RESOURCE-LEVEL ACCESS CONTROL
// ============================================

export interface ResourceAccessRule {
  resource: string;
  action: string;
  condition: (context: any) => boolean;
}

export const RESOURCE_ACCESS_RULES: ResourceAccessRule[] = [
  {
    resource: "booking",
    action: "view",
    condition: (context) => {
      // Guests can only view their own bookings
      if (context.role === "guest") {
        return context.guestId === context.bookingGuestId;
      }
      // Staff can view bookings for their branch
      return context.role !== "guest";
    },
  },
  {
    resource: "order",
    action: "view",
    condition: (context) => {
      // Waiters can only view orders they took
      if (context.role === "waiter") {
        return context.staffId === context.orderCreatedBy;
      }
      // Kitchen staff can view all orders
      return context.role !== "waiter";
    },
  },
  {
    resource: "payment",
    action: "process",
    condition: (context) => {
      // Only RECEPTIONIST and above can process payments
      const allowedRoles = ["receptionist", "manager", "branch_manager", "super_manager", "super_admin"];
      return allowedRoles.includes(context.role);
    },
  },
  {
    resource: "staff",
    action: "delete",
    condition: (context) => {
      // Only BRANCH_MANAGER and above can delete staff
      const allowedRoles = ["branch_manager", "super_manager", "super_admin"];
      return allowedRoles.includes(context.role);
    },
  },
];

/**
 * Check resource-level access
 */
export function checkResourceAccess(
  resource: string,
  action: string,
  context: any
): boolean {
  const rule = RESOURCE_ACCESS_RULES.find(
    (r) => r.resource === resource && r.action === action
  );
  return rule ? rule.condition(context) : true;
}
