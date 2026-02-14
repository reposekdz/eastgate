"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Moon, Sun } from "lucide-react";
import { branches } from "@/lib/mock-data";
import { useState } from "react";

export default function AdminTopbar() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b bg-white px-4">
      <SidebarTrigger className="-ml-1 text-slate-custom hover:text-charcoal" />
      <Separator orientation="vertical" className="h-5" />

      {/* Branch Selector */}
      <Select defaultValue="br-001">
        <SelectTrigger className="w-[180px] h-8 text-sm border-dashed">
          <SelectValue placeholder="Select Branch" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Branches</SelectItem>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Search */}
      <div className="flex-1 max-w-md ml-auto lg:ml-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted-custom" />
          <Input
            placeholder="Search rooms, bookings, guests..."
            className="h-8 pl-8 text-sm bg-pearl/50 border-transparent focus:bg-white focus:border-input"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-slate-custom hover:text-charcoal"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Separator orientation="vertical" className="h-5 mx-1" />

        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src="https://i.pravatar.cc/40?u=admin-jp" alt="Admin" />
            <AvatarFallback className="bg-emerald text-white text-[10px]">JP</AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col">
            <span className="text-xs font-medium text-charcoal leading-tight">Jean-Pierre H.</span>
            <span className="text-[10px] text-text-muted-custom leading-tight">Kigali Main</span>
          </div>
        </div>
      </div>
    </header>
  );
}
