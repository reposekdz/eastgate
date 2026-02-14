"use client";

import { useState, useEffect } from "react";
import { Search, Globe, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/context";

export default function EnhancedHeader() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const { language, setLanguage } = useI18n();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="bg-charcoal/95 backdrop-blur-sm border-b border-white/10 py-2">
      <div className="mx-auto max-w-7xl px-4 flex items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input
            placeholder="Search rooms, dining, spa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9 bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
        </form>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-white/70 text-sm">
            <Clock className="h-4 w-4" />
            <span>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-32 h-9 bg-white/10 border-white/20 text-white">
              <Globe className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="rw">Kinyarwanda</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
