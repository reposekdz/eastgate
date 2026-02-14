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
  phone?: string;
  nationality?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  registeredGuests: (User & { password: string })[];
  login: (email: string, password: string, branchId: string) => Promise<boolean>;
  registerGuestAccount: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    nationality?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  hasAccess: (requiredRoles: UserRole[]) => boolean;
}

// Static staff credentials — given by the manager
// Staff CANNOT register; they use these predefined credentials.
const staffUsers: (User & { password: string })[] = [
  // ═══ Super Admin / Manager ═══
  {
    id: "u-000",
    name: "EastGate Admin",
    email: "admin@eastgates.com",
    password: "2026",
    role: "super_admin",
    branchId: "all",
    branchName: "All Branches",
    avatar: "https://i.pravatar.cc/40?u=eastgate-admin",
  },
  {
    id: "u-001",
    name: "Manager Chief",
    email: "manager@eastgates.com",
    password: "2026",
    role: "super_manager",
    branchId: "all",
    branchName: "All Branches",
    avatar: "https://i.pravatar.cc/40?u=manager",
  },
  {
    id: "u-002",
    name: "Admin Superuser",
    email: "admin@eastgate.rw",
    password: "admin123",
    role: "super_admin",
    branchId: "all",
    branchName: "All Branches",
    avatar: "https://i.pravatar.cc/40?u=admin",
  },
  {
    id: "u-003",
    name: "Manager Superuser",
    email: "manager@eastgate.rw",
    password: "manager123",
    role: "super_manager",
    branchId: "all",
    branchName: "All Branches",
    avatar: "https://i.pravatar.cc/40?u=manager-rw",
  },

  // ═══ Kigali Main Branch (br-001) ═══
  {
    id: "u-004",
    name: "Jean-Pierre Habimana",
    email: "jp@eastgate.rw",
    password: "jp123",
    role: "branch_manager",
    branchId: "br-001",
    branchName: "Kigali Main",
    avatar: "https://i.pravatar.cc/40?u=jp-habimana",
  },
  {
    id: "u-005",
    name: "Grace Uwase",
    email: "grace@eastgate.rw",
    password: "grace123",
    role: "receptionist",
    branchId: "br-001",
    branchName: "Kigali Main",
    avatar: "https://i.pravatar.cc/40?u=grace-uwase",
  },
  {
    id: "u-006",
    name: "Patrick Bizimana",
    email: "patrick@eastgate.rw",
    password: "patrick123",
    role: "waiter",
    branchId: "br-001",
    branchName: "Kigali Main",
    avatar: "https://i.pravatar.cc/40?u=patrick-b",
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

  // ═══ Ngoma Branch (br-002) ═══
  {
    id: "u-008",
    name: "Diane Uwimana",
    email: "diane@eastgate.rw",
    password: "diane123",
    role: "branch_manager",
    branchId: "br-002",
    branchName: "Ngoma Branch",
    avatar: "https://i.pravatar.cc/40?u=diane-uwimana",
  },
  {
    id: "u-009",
    name: "Eric Ndikumana",
    email: "eric.n@eastgate.rw",
    password: "eric123",
    role: "receptionist",
    branchId: "br-002",
    branchName: "Ngoma Branch",
    avatar: "https://i.pravatar.cc/40?u=eric-n",
  },
  {
    id: "u-010",
    name: "Joseph Habiyaremye",
    email: "joseph@eastgate.rw",
    password: "joseph123",
    role: "waiter",
    branchId: "br-002",
    branchName: "Ngoma Branch",
    avatar: "https://i.pravatar.cc/40?u=joseph-h",
  },

  // ═══ Kirehe Branch (br-003) ═══
  {
    id: "u-011",
    name: "Patrick Niyonsaba",
    email: "patrick.n@eastgate.rw",
    password: "patrick.n123",
    role: "branch_manager",
    branchId: "br-003",
    branchName: "Kirehe Branch",
    avatar: "https://i.pravatar.cc/40?u=patrick-n",
  },
  {
    id: "u-012",
    name: "Esperance Mukamana",
    email: "esperance@eastgate.rw",
    password: "esperance123",
    role: "receptionist",
    branchId: "br-003",
    branchName: "Kirehe Branch",
    avatar: "https://i.pravatar.cc/40?u=esperance-m",
  },
  {
    id: "u-013",
    name: "Angelique Uwera",
    email: "angelique@eastgate.rw",
    password: "angelique123",
    role: "waiter",
    branchId: "br-003",
    branchName: "Kirehe Branch",
    avatar: "https://i.pravatar.cc/40?u=angelique-u",
  },

  // ═══ Gatsibo Branch (br-004) ═══
  {
    id: "u-014",
    name: "Emmanuel Mugisha",
    email: "emmanuel.m@eastgate.rw",
    password: "emmanuel123",
    role: "branch_manager",
    branchId: "br-004",
    branchName: "Gatsibo Branch",
    avatar: "https://i.pravatar.cc/40?u=emmanuel-m",
  },
  {
    id: "u-015",
    name: "Sylvie Uwamahoro",
    email: "sylvie@eastgate.rw",
    password: "sylvie123",
    role: "receptionist",
    branchId: "br-004",
    branchName: "Gatsibo Branch",
    avatar: "https://i.pravatar.cc/40?u=sylvie-u",
  },
  {
    id: "u-016",
    name: "Chantal Uwase",
    email: "chantal@eastgate.rw",
    password: "chantal123",
    role: "waiter",
    branchId: "br-004",
    branchName: "Gatsibo Branch",
    avatar: "https://i.pravatar.cc/40?u=chantal-u",
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      registeredGuests: [],

      login: async (email: string, password: string, branchId: string) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 1. Check staff users (static credentials)
        const staffUser = staffUsers.find(
          (u) =>
            u.email.toLowerCase() === email.toLowerCase() &&
            u.password === password &&
            (u.branchId === "all" || u.branchId === branchId)
        );

        if (staffUser) {
          const { password: _, ...userData } = staffUser;
          set({ user: userData, isAuthenticated: true });
          document.cookie = `eastgate-auth=${JSON.stringify({
            isAuthenticated: true,
            role: userData.role,
            branchId: userData.branchId,
          })}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
          return true;
        }

        // 2. Check registered guest accounts
        const guestUser = get().registeredGuests.find(
          (u) =>
            u.email.toLowerCase() === email.toLowerCase() &&
            u.password === password
        );

        if (guestUser) {
          const { password: _, ...userData } = guestUser;
          set({ user: userData, isAuthenticated: true });
          document.cookie = `eastgate-auth=${JSON.stringify({
            isAuthenticated: true,
            role: "guest",
            branchId: "all",
          })}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
          return true;
        }

        return false;
      },

      registerGuestAccount: async (data) => {
        await new Promise((resolve) => setTimeout(resolve, 600));

        // Check if email already exists in staff
        const existsInStaff = staffUsers.some(
          (u) => u.email.toLowerCase() === data.email.toLowerCase()
        );
        if (existsInStaff) {
          return { success: false, error: "This email is reserved for staff accounts." };
        }

        // Check if email already exists in registered guests
        const existsInGuests = get().registeredGuests.some(
          (u) => u.email.toLowerCase() === data.email.toLowerCase()
        );
        if (existsInGuests) {
          return { success: false, error: "An account with this email already exists." };
        }

        const newGuest: User & { password: string } = {
          id: `guest-${Date.now().toString(36)}`,
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          role: "guest",
          branchId: "all",
          branchName: "Guest",
          nationality: data.nationality || "",
          avatar: `https://i.pravatar.cc/40?u=${data.email}`,
        };

        set((state) => ({
          registeredGuests: [...state.registeredGuests, newGuest],
        }));

        // Auto-login after registration
        const { password: _, ...userData } = newGuest;
        set({ user: userData, isAuthenticated: true });
        document.cookie = `eastgate-auth=${JSON.stringify({
          isAuthenticated: true,
          role: "guest",
          branchId: "all",
        })}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

        return { success: true };
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
        document.cookie = "eastgate-auth=; path=/; max-age=0; SameSite=Lax";
      },

      hasRole: (roles: UserRole[]) => {
        const { user } = get();
        if (!user) return false;
        return roles.includes(user.role);
      },

      hasAccess: (requiredRoles: UserRole[]) => {
        const { user } = get();
        if (!user) return false;
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

// Export staff credentials list for display in login page hints
export const getStaffCredentials = () =>
  staffUsers.map(({ name, email, password, role, branchName }) => ({
    name,
    email,
    password,
    role,
    branchName,
  }));
