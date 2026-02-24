"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRole } from "../types/enums";
import { useAppDataStore } from "./app-data-store";

// Import NextAuth signIn
declare global {
  interface Window {
    signIn: (provider: string, options?: any) => Promise<any>;
  }
}

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
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  registerGuest: (data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    nationality?: string;
  }) => Promise<boolean>;
  addStaff: (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    branchId: string;
    branchName: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  removeStaff: (email: string) => void;
  setRequiresCredentialsChange: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      requiresCredentialsChange: false,
      registeredGuests: [],
      dynamicStaff: [],

      login: async (email: string, password: string, branchId: string) => {
        try {
          // Use NextAuth credentials provider
          const response = await fetch("/api/auth/callback/credentials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          if (response.ok) {
            // Get session after successful login
            const sessionRes = await fetch("/api/auth/session");
            const session = await sessionRes.json();

            if (session?.user) {
              const userData: User = {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                role: session.user.role,
                branchId: session.user.branchId || branchId,
                branchName: session.user.branchId 
                  ? useAppDataStore.getState().branches.find(b => b.id === session.user.branchId)?.name || "Branch"
                  : "All Branches",
                avatar: session.user.image || `https://i.pravatar.cc/40?u=${session.user.email}`,
              };

              set({
                user: userData,
                isAuthenticated: true,
                requiresCredentialsChange: false,
              });
              return true;
            }
          }
          return false;
        } catch (error) {
          console.error("Login error:", error);
          return false;
        }
      },

      logout: () => {
        fetch("/api/auth/signout", { method: "POST" }).finally(() => {
          set({
            user: null,
            isAuthenticated: false,
            requiresCredentialsChange: false,
          });
        });
      },

      updateUser: (data) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...data } });
        }
      },

      registerGuest: async (data) => {
        try {
          const res = await fetch("/api/guests/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const result = await res.json();
          if (result.success && result.guest) {
            const userData: User = {
              id: result.guest.id,
              name: result.guest.name,
              email: result.guest.email,
              role: "guest",
              branchId: "all",
              branchName: "Guest",
              avatar: `https://i.pravatar.cc/40?u=${result.guest.email}`,
              phone: result.guest.phone,
              nationality: result.guest.nationality,
            };
            set((state) => ({
              registeredGuests: [...state.registeredGuests, { ...userData, password: data.password }],
            }));
            return true;
          }
          return false;
        } catch (error) {
          console.error("Register error:", error);
          return false;
        }
      },

      addStaff: async (data) => {
        try {
          const res = await fetch("/api/staff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const result = await res.json();
          if (result.success) {
            set((state) => ({
              dynamicStaff: [
                ...state.dynamicStaff,
                {
                  ...data,
                  id: result.staff.id,
                  mustChangeCredentials: true,
                } as DynamicStaffMember,
              ],
            }));
            return { success: true };
          }
          return { success: false, error: result.error };
        } catch (error) {
          console.error("Add staff error:", error);
          return { success: false, error: "Failed to add staff" };
        }
      },

      removeStaff: (email) => {
        set((state) => ({
          dynamicStaff: state.dynamicStaff.filter((s) => s.email !== email),
        }));
      },

      setRequiresCredentialsChange: (value) => {
        set({ requiresCredentialsChange: value });
      },
    }),
    {
      name: "eastgate-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        requiresCredentialsChange: state.requiresCredentialsChange,
        dynamicStaff: state.dynamicStaff,
      }),
    }
  )
);
