import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    "active": "bg-green-100 text-green-800",
    "inactive": "bg-gray-100 text-gray-800",
    "completed": "bg-blue-100 text-blue-800",
    "pending": "bg-yellow-100 text-yellow-800",
    "cancelled": "bg-red-100 text-red-800",
    "archived": "bg-gray-100 text-gray-600",
    "occupied": "bg-orange-100 text-orange-800",
    "available": "bg-green-100 text-green-800",
    "maintenance": "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    "high": "bg-red-100 text-red-800",
    "medium": "bg-yellow-100 text-yellow-800",
    "low": "bg-green-100 text-green-800",
    "urgent": "bg-red-100 text-red-800",
  };
  return colors[priority] || "bg-gray-100 text-gray-800";
}

export function getAuthenticatedApiUrl(endpoint: string = ""): string {
  return endpoint ? `/api${endpoint.startsWith("/") ? endpoint : "/" + endpoint}` : "/api";
}
