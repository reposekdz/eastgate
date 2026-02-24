import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

// Role definitions with permissions
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [
    "manage_users",
    "manage_staff",
    "manage_branches",
    "manage_rooms",
    "manage_bookings",
    "manage_orders",
    "manage_menu",
    "manage_events",
    "manage_inventory",
    "manage_finance",
    "view_analytics",
    "manage_settings",
    "manage_ai_insights",
    "assign_managers",
    "manage_all_branches",
  ],
  SUPER_MANAGER: [
    "manage_users",
    "manage_staff",
    "manage_branches",
    "manage_rooms",
    "manage_bookings",
    "manage_orders",
    "manage_menu",
    "manage_events",
    "manage_inventory",
    "view_analytics",
    "manage_settings",
    "assign_managers",
    "manage_all_branches",
  ],
  BRANCH_MANAGER: [
    "manage_staff",
    "manage_rooms",
    "manage_bookings",
    "manage_orders",
    "manage_menu",
    "manage_events",
    "manage_inventory",
    "view_analytics",
    "manage_settings",
    "manage_branch_only",
    "add_waiters",
    "add_receptionists",
    "add_kitchen_staff",
  ],
  MANAGER: [
    "manage_staff",
    "manage_rooms",
    "manage_bookings",
    "manage_orders",
    "manage_menu",
    "manage_events",
    "manage_inventory",
    "view_analytics",
    "manage_settings",
  ],
  RECEPTIONIST: [
    "manage_bookings",
    "manage_guests",
    "view_rooms",
    "manage_orders",
    "register_guests",
    "check_in_guests",
    "check_out_guests",
  ],
  WAITER: [
    "manage_orders",
    "view_menu",
    "manage_tables",
    "take_orders",
    "serve_orders",
  ],
  CHEF: [
    "manage_orders",
    "view_menu",
    "manage_prep",
    "kitchen_orders",
    "prepare_food",
  ],
  KITCHEN_STAFF: [
    "manage_orders",
    "view_menu",
    "manage_prep",
    "kitchen_orders",
  ],
  STAFF: [
    "view_own_tasks",
  ],
};

export type Role = keyof typeof ROLE_PERMISSIONS;
export type Permission = string;

// Helper function to check if user has permission
export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

// Helper function to check if user is super admin
export function isSuperAdmin(role: string): boolean {
  return role === "SUPER_ADMIN";
}

// Helper function to check if user is super manager
export function isSuperManager(role: string): boolean {
  return role === "SUPER_MANAGER";
}

// Helper function to check if user is super admin or super manager
export function isSuperAdminOrManager(role: string): boolean {
  return role === "SUPER_ADMIN" || role === "SUPER_MANAGER";
}

// Helper function to check if user is branch manager
export function isBranchManager(role: string): boolean {
  return role === "BRANCH_MANAGER";
}

// Helper function to check if user is manager or above
export function isManager(role: string): boolean {
  return role === "SUPER_ADMIN" || role === "SUPER_MANAGER" || role === "BRANCH_MANAGER" || role === "MANAGER";
}

// Helper function to check if user can assign managers
export function canAssignManagers(role: string): boolean {
  return role === "SUPER_ADMIN" || role === "SUPER_MANAGER";
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@eastgate.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          // Find staff by email using raw query
          const staff = await prisma.$queryRaw`
            SELECT * FROM staff WHERE email = ${credentials.email} LIMIT 1
          ` as any[];

          if (!staff || staff.length === 0) {
            throw new Error("Invalid credentials");
          }

          const user = staff[0];

          // Check if user is active
          if (user.status !== "active") {
            throw new Error("Account is not active. Please contact administrator.");
          }

          // For demo/development: accept specific passwords if no hashed password exists
          let isValidPassword = false;
          
          if (user.password && typeof user.password === 'string' && user.password.startsWith('$2')) {
            // Use bcrypt to compare passwords (if it's a hashed password)
            isValidPassword = await bcrypt.compare(credentials.password, user.password);
          } else {
            // Fallback for demo accounts - accepts these passwords for development
            isValidPassword = 
              credentials.password === "2026" ||
              credentials.password === "demo123" || 
              credentials.password === "admin123" ||
              credentials.password === "manager123" ||
              credentials.password === user.email.split('@')[0];
          }

          if (!isValidPassword) {
            throw new Error("Invalid password");
          }

          // Update last login
          try {
            await prisma.$executeRaw`
              UPDATE staff SET updated_at = NOW() WHERE id = ${user.id}
            `;
          } catch (e) {
            // Ignore update errors
          }

          // Log the successful login
          console.log(`User logged in: ${user.email} with role: ${user.role}`);

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            branchId: user.branch_id || user.branchId,
            image: user.avatar,
          };
        } catch (error: any) {
          console.error("Auth error:", error.message);
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.department = user.department;
        token.branchId = user.branchId;
        token.permissions = ROLE_PERMISSIONS[user.role] || [];
      }
      
      // Handle session updates
      if (trigger === "update" && session) {
        token.name = session.name;
        token.image = session.image;
      }
      
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.department = token.department;
        session.user.branchId = token.branchId;
        session.user.permissions = token.permissions || [];
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || "eastgate-secret-key-change-in-production",
});

export { handler as GET, handler as POST };
