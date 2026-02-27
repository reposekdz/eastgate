"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Sparkles,
  ClipboardList,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { useRouter } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/housekeeping", icon: LayoutDashboard },
  { name: "My Tasks", href: "/housekeeping/tasks", icon: ClipboardList },
  { name: "Completed", href: "/housekeeping/completed", icon: Sparkles },
  { name: "Settings", href: "/housekeeping/settings", icon: Settings },
];

export default function HousekeepingSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="w-64 bg-white border-r border-pearl flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-pearl">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald/10 rounded-lg">
            <Sparkles className="h-6 w-6 text-emerald" />
          </div>
          <div>
            <h2 className="font-bold text-charcoal">Housekeeping</h2>
            <p className="text-xs text-text-muted-custom">EastGate Hotel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald text-white"
                  : "text-slate-custom hover:bg-pearl"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-pearl">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
