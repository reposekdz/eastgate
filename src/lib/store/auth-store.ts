import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRole } from "../types/enums";
import { useAppDataStore } from "./app-data-store";

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

/** Staff added by Super Admin / Super Manager; must change password & email on first login */
export interface DynamicStaffMember extends User {
  password: string;
  mustChangeCredentials: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /** True when logged-in user (dynamic staff) must change email & password before using app */
  requiresCredentialsChange: boolean;
  registeredGuests: (User & { password: string })[];
  /** Staff created by super_admin/super_manager; persisted */
  dynamicStaff: DynamicStaffMember[];
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
  /** Super Admin / Super Manager: add staff to a branch with initial credentials (they must change on first login) */
  addStaff: (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    branchId: string;
    branchName: string;
    phone?: string;
  }) => { success: boolean; error?: string };
  /** Update staff credentials (used by change-credentials page and by super to reset) */
  updateStaffCredentials: (userId: string, newEmail: string, newPassword: string) => { success: boolean; error?: string };
  /** Mark that current user has completed credential change */
  setCredentialsChanged: (userId: string) => void;
  /** Get all staff (static + dynamic) for a branch or all branches (for super) */
  getAllStaff: (branchId: string | "all", includeStatic: boolean) => Array<{ user: User; isDynamic: boolean; mustChangeCredentials?: boolean }>;
  /** Remove a dynamic staff member (only dynamic; used by branch manager or super) */
  removeStaff: (userId: string) => { success: boolean; error?: string };
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
  {
    id: "u-007k",
    name: "Kitchen Kigali",
    email: "kitchen@eastgate.rw",
    password: "kitchen123",
    role: "kitchen_staff",
    branchId: "br-001",
    branchName: "Kigali Main",
    avatar: "https://i.pravatar.cc/40?u=kitchen-k",
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
  {
    id: "u-010k",
    name: "Kitchen Ngoma",
    email: "kitchen.ngoma@eastgate.rw",
    password: "kitchen123",
    role: "kitchen_staff",
    branchId: "br-002",
    branchName: "Ngoma Branch",
    avatar: "https://i.pravatar.cc/40?u=kitchen-n",
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
  {
    id: "u-013k",
    name: "Kitchen Kirehe",
    email: "kitchen.kirehe@eastgate.rw",
    password: "kitchen123",
    role: "kitchen_staff",
    branchId: "br-003",
    branchName: "Kirehe Branch",
    avatar: "https://i.pravatar.cc/40?u=kitchen-kr",
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
  {
    id: "u-016k",
    name: "Kitchen Gatsibo",
    email: "kitchen.gatsibo@eastgate.rw",
    password: "kitchen123",
    role: "kitchen_staff",
    branchId: "br-004",
    branchName: "Gatsibo Branch",
    avatar: "https://i.pravatar.cc/40?u=kitchen-g",
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      requiresCredentialsChange: false,
      registeredGuests: [],
      dynamicStaff: [],

      login: async (email: string, password: string, branchId: string) => {
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 1. Check dynamic staff (added by super; may require credential change)
        const dynamic = get().dynamicStaff.find(
          (u) =>
            u.email.toLowerCase() === email.toLowerCase() &&
            u.password === password &&
            (u.branchId === "all" || u.branchId === branchId)
        );
        if (dynamic) {
          const { password: _, mustChangeCredentials, ...userData } = dynamic;
          set({
            user: userData,
            isAuthenticated: true,
            requiresCredentialsChange: mustChangeCredentials === true,
          });
          document.cookie = `eastgate-auth=${JSON.stringify({
            isAuthenticated: true,
            role: userData.role,
            branchId: userData.branchId,
            userId: userData.id,
          })}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
          return true;
        }

        // 2. Check static staff users
        const staffUser = staffUsers.find(
          (u) =>
            u.email.toLowerCase() === email.toLowerCase() &&
            u.password === password &&
            (u.branchId === "all" || u.branchId === branchId)
        );
        if (staffUser) {
          const { password: _, ...userData } = staffUser;
          set({ user: userData, isAuthenticated: true, requiresCredentialsChange: false });
          document.cookie = `eastgate-auth=${JSON.stringify({
            isAuthenticated: true,
            role: userData.role,
            branchId: userData.branchId,
          })}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
          return true;
        }

        // 3. Check registered guest accounts
        const guestUser = get().registeredGuests.find(
          (u) =>
            u.email.toLowerCase() === email.toLowerCase() &&
            u.password === password
        );
        if (guestUser) {
          const { password: _, ...userData } = guestUser;
          set({ user: userData, isAuthenticated: true, requiresCredentialsChange: false });
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
        set({ user: null, isAuthenticated: false, requiresCredentialsChange: false });
        document.cookie = "eastgate-auth=; path=/; max-age=0; SameSite=Lax";
      },

      addStaff: (data) => {
        const state = get();
        const exists =
          staffUsers.some((u) => u.email.toLowerCase() === data.email.toLowerCase()) ||
          state.dynamicStaff.some((u) => u.email.toLowerCase() === data.email.toLowerCase()) ||
          state.registeredGuests.some((u) => u.email.toLowerCase() === data.email.toLowerCase());
        if (exists) return { success: false, error: "An account with this email already exists." };
        const id = `dyn-${Date.now().toString(36)}`;
        const branchName = useAppDataStore.getState().branches.find((b) => b.id === data.branchId)?.name ?? data.branchName;
        const newStaff: DynamicStaffMember = {
          id,
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
          branchId: data.branchId,
          branchName,
          avatar: `https://i.pravatar.cc/40?u=${id}`,
          phone: data.phone,
          mustChangeCredentials: true,
        };
        set((s) => ({ dynamicStaff: [...s.dynamicStaff, newStaff] }));
        return { success: true };
      },

      updateStaffCredentials: (userId, newEmail, newPassword) => {
        const state = get();
        const idx = state.dynamicStaff.findIndex((u) => u.id === userId);
        if (idx === -1) return { success: false, error: "User not found." };
        const others = state.dynamicStaff.filter((u) => u.id !== userId);
        const exists = others.some((u) => u.email.toLowerCase() === newEmail.toLowerCase()) ||
          staffUsers.some((u) => u.email.toLowerCase() === newEmail.toLowerCase());
        if (exists) return { success: false, error: "This email is already in use." };
        const next = state.dynamicStaff.map((u) =>
          u.id === userId ? { ...u, email: newEmail, password: newPassword, mustChangeCredentials: false } : u
        );
        set({ dynamicStaff: next });
        const { user } = state;
        if (user?.id === userId) {
          set({ user: { ...user, email: newEmail }, requiresCredentialsChange: false });
        }
        return { success: true };
      },

      setCredentialsChanged: (userId) => {
        set((s) => ({
          dynamicStaff: s.dynamicStaff.map((u) =>
            u.id === userId ? { ...u, mustChangeCredentials: false } : u
          ),
          requiresCredentialsChange: s.user?.id === userId ? false : s.requiresCredentialsChange,
        }));
      },

      getAllStaff: (branchId, includeStatic) => {
        const state = get();
        const result: Array<{ user: User; isDynamic: boolean; mustChangeCredentials?: boolean }> = [];
        if (includeStatic) {
          const staticList = branchId === "all" ? staffUsers : staffUsers.filter((u) => u.branchId === branchId || u.branchId === "all");
          staticList.forEach((u) => {
            const { password: _p, ...user } = u;
            result.push({ user, isDynamic: false });
          });
        }
        const dyn = branchId === "all" ? state.dynamicStaff : state.dynamicStaff.filter((u) => u.branchId === branchId);
        dyn.forEach((u) => {
          const { password: _p, mustChangeCredentials, ...user } = u;
          result.push({ user, isDynamic: true, mustChangeCredentials });
        });
        return result;
      },

      removeStaff: (userId) => {
        const state = get();
        if (state.user?.id === userId) return { success: false, error: "Cannot remove your own account." };
        const idx = state.dynamicStaff.findIndex((u) => u.id === userId);
        if (idx === -1) return { success: false, error: "User not found or cannot be removed." };
        set((s) => ({ dynamicStaff: s.dynamicStaff.filter((u) => u.id !== userId) }));
        return { success: true };
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
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        registeredGuests: state.registeredGuests,
        dynamicStaff: state.dynamicStaff,
      }),
    }
  )
);

// Export staff credentials list for display in login page hints (all static users)
export const getStaffCredentials = () =>
  staffUsers.map(({ name, email, password, role, branchName }) => ({
    name,
    email,
    password,
    role,
    branchName,
  }));

/** Demo login: only Super Admin and Super Manager. All other roles are added by Super Manager for branches. */
export const getDemoStaffCredentials = () =>
  staffUsers
    .filter((u) => u.role === "super_admin" || u.role === "super_manager")
    .map(({ name, email, password, role, branchName }) => ({
      name,
      email,
      password,
      role,
      branchName,
    }));
