import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

// Role definitions with permissions
const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [
    "manage_users", "manage_staff", "manage_branches", "manage_rooms",
    "manage_bookings", "manage_orders", "manage_menu", "manage_events",
    "manage_inventory", "manage_finance", "view_analytics", "manage_settings",
    "manage_ai_insights", "assign_managers", "manage_all_branches",
  ],
  SUPER_MANAGER: [
    "manage_users", "manage_staff", "manage_branches", "manage_rooms",
    "manage_bookings", "manage_orders", "manage_menu", "manage_events",
    "manage_inventory", "view_analytics", "manage_settings",
    "assign_managers", "manage_all_branches",
  ],
  BRANCH_MANAGER: [
    "manage_staff", "manage_rooms", "manage_bookings", "manage_orders",
    "manage_menu", "manage_events", "manage_inventory", "view_analytics",
    "manage_settings", "manage_branch_only", "add_waiters",
    "add_receptionists", "add_kitchen_staff",
  ],
  MANAGER: [
    "manage_staff", "manage_rooms", "manage_bookings", "manage_orders",
    "manage_menu", "manage_events", "manage_inventory", "view_analytics",
    "manage_settings",
  ],
  RECEPTIONIST: [
    "manage_bookings", "manage_guests", "view_rooms", "manage_orders",
    "register_guests", "check_in_guests", "check_out_guests",
  ],
  WAITER: [
    "manage_orders", "view_menu", "manage_tables", "take_orders", "serve_orders",
  ],
  CHEF: [
    "manage_orders", "view_menu", "manage_prep", "kitchen_orders", "prepare_food",
  ],
  KITCHEN_STAFF: [
    "manage_orders", "view_menu", "manage_prep", "kitchen_orders",
  ],
  STAFF: ["view_own_tasks"],
};

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
          // Find staff by email using Prisma
          const user = await prisma.staff.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            throw new Error("Invalid credentials - user not found");
          }

          // Check if user is active
          if (user.status !== "active") {
            throw new Error("Account is not active. Please contact administrator.");
          }

          // Verify password
          let isValidPassword = false;
          
          if (user.password && typeof user.password === 'string' && user.password.startsWith('$2')) {
            // Use bcrypt to compare passwords
            isValidPassword = await bcrypt.compare(credentials.password, user.password);
          } else {
            // Fallback for demo accounts
            isValidPassword = 
              credentials.password === "demo123" || 
              credentials.password === "admin123" ||
              credentials.password === "manager123" ||
              credentials.password === user.email.split('@')[0];
          }

          if (!isValidPassword) {
            throw new Error("Invalid password");
          }

          // Update last login
          await prisma.staff.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          }).catch(() => {});

          console.log(`User logged in: ${user.email} with role: ${user.role}`);

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            branchId: user.branchId,
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
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.department = user.department;
        token.branchId = user.branchId;
        token.permissions = ROLE_PERMISSIONS[user.role] || [];
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
    maxAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET || "eastgate-secret-key-change-in-production",
});

export { handler as GET, handler as POST };
