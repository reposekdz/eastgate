import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRole } from "../types/enums";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId: string;
  branchName: string;
  avatar: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, branchId: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  hasAccess: (requiredRoles: UserRole[]) => boolean;
}

// Mock users for demonstration
const mockUsers: (User & { password: string })[] = [
  {
    id: "u-001",
    name: "Admin Superuser",
    email: "admin@eastgate.rw",
    password: "admin123",
    role: "super_admin",
    branchId: "all",
    branchName: "All Branches",
    avatar: "https://i.pravatar.cc/40?u=admin",
  },
  {
    id: "u-002",
    name: "Manager Chief",
    email: "manager@eastgate.rw",
    password: "manager123",
    role: "super_manager",
    branchId: "all",
    branchName: "All Branches",
    avatar: "https://i.pravatar.cc/40?u=manager",
  },
  {
    id: "u-003",
    name: "Jean-Pierre Habimana",
    email: "jp@eastgate.rw",
    password: "jp123",
    role: "branch_manager",
    branchId: "br-001",
    branchName: "Kigali Main",
    avatar: "https://i.pravatar.cc/40?u=jp-habimana",
  },
  {
    id: "u-004",
    name: "Grace Uwase",
    email: "grace@eastgate.rw",
    password: "grace123",
    role: "receptionist",
    branchId: "br-001",
    branchName: "Kigali Main",
    avatar: "https://i.pravatar.cc/40?u=grace-uwase",
  },
  {
    id: "u-005",
    name: "Patrick Bizimana",
    email: "patrick@eastgate.rw",
    password: "patrick123",
    role: "waiter",
    branchId: "br-001",
    branchName: "Kigali Main",
    avatar: "https://i.pravatar.cc/40?u=patrick-b",
  },
  {
    id: "u-006",
    name: "Diane Uwimana",
    email: "diane@eastgate.rw",
    password: "diane123",
    role: "branch_manager",
    branchId: "br-002",
    branchName: "Ngoma Branch",
    avatar: "https://i.pravatar.cc/40?u=diane-uwimana",
  },
  {
    id: "u-007",
    name: "Aimée Kamikazi",
    email: "aimee@eastgate.rw",
    password: "aimee123",
    role: "accountant",
    branchId: "br-001",
    branchName: "Kigali Main",
    avatar: "https://i.pravatar.cc/40?u=aimee-k",
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string, branchId: string) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        const user = mockUsers.find(
          (u) =>
            u.email === email &&
            u.password === password &&
            (u.branchId === "all" || u.branchId === branchId)
        );

        if (user) {
          const { password: _, ...userData } = user;
          set({ user: userData, isAuthenticated: true });
          return true;
        }

        return false;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      hasRole: (roles: UserRole[]) => {
        const { user } = get();
        if (!user) return false;
        return roles.includes(user.role);
      },

      hasAccess: (requiredRoles: UserRole[]) => {
        const { user } = get();
        if (!user) return false;

        // Super admin and super manager have access to everything
        if (user.role === "super_admin" || user.role === "super_manager") {
          return true;
        }

        return requiredRoles.includes(user.role);
      },
    }),
    {
      name: "eastgate-auth-storage",
    }
  )
);
