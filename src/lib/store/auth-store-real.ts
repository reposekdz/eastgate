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
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  hasAccess: (requiredRoles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) return false;

          const data = await response.json();
          if (data.success && data.user) {
            set({
              user: data.user,
              isAuthenticated: true,
            });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Login error:', error);
          return false;
        }
      },

      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
          console.error('Logout error:', error);
        }
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
        if (user.role === "super_admin" || user.role === "super_manager") return true;
        return requiredRoles.includes(user.role);
      },
    }),
    {
      name: "eastgate-auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
