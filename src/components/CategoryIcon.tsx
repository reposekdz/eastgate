"use client";

import { getCategoryIcon } from "@/lib/category-icons";
import { cn } from "@/lib/utils";

interface CategoryIconProps {
  categoryId: string;
  className?: string;
  size?: number;
}

/**
 * Renders a modern Lucide icon for a given menu category ID.
 * Replaces emoji-based category icons with interactive SVG icons.
 */
export function CategoryIcon({ categoryId, className, size = 16 }: CategoryIconProps) {
  const Icon = getCategoryIcon(categoryId);
  return <Icon className={cn("shrink-0", className)} width={size} height={size} />;
}
