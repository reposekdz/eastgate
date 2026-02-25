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
  login: (email: string, password: string, branchId?: string) => Promise<boolean>;
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

      login: async (email: string, password: string, branchId?: string) => {
        try {
          console.log("[AUTH STORE] Initiating login...");
          
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), password }),
            credentials: "include",
          });

          const result = await response.json();
          console.log("[AUTH STORE] Login response:", { success: result.success, status: response.status });

          if (!response.ok) {
            console.error("[AUTH STORE] Login failed:", result.error);
            return false;
          }

          if (result.success && result.user) {
            const userData: User = {
              id: result.user.id,
              name: result.user.name,
              email: result.user.email,
              role: result.user.role,
              branchId: result.user.branchId,
              branchName: result.user.branchName,
              avatar: result.user.avatar,
              phone: result.user.phone,
            };

            console.log("[AUTH STORE] Setting user data:", { name: userData.name, role: userData.role });

            set({
              user: userData,
              isAuthenticated: true,
              requiresCredentialsChange: result.user.mustChangePassword || false,
            });

            // Set secure cookie with proper encoding
            const authData = { isAuthenticated: true, role: userData.role, user: userData };
            document.cookie = `eastgate-auth=${encodeURIComponent(JSON.stringify(authData))}; path=/; max-age=86400; SameSite=Lax`;
            
            console.log("[AUTH STORE] Login successful");
            return true;
          }
          
          console.error("[AUTH STORE] Invalid response format");
          return false;
        } catch (error: any) {
          console.error("[AUTH STORE] Login exception:", error);
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          requiresCredentialsChange: false,
        });
        // Clear cookie
        document.cookie = "eastgate-auth=; path=/; max-age=0";
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
