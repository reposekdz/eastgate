"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { rooms as allRooms } from "@/lib/mock-data";
import { getRoomTypeLabel, formatCurrency } from "@/lib/format";
import RoomStatusBadge from "@/components/admin/shared/RoomStatusBadge";
import type { RoomStatus } from "@/lib/types/enums";
import {
  BedDouble,
  Search,
  LayoutGrid,
  List,
  Plus,
  User,
  DoorOpen,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const statusColors: Record<RoomStatus, string> = {
  available: "border-status-available/30 bg-status-available/5",
  occupied: "border-status-occupied/30 bg-status-occupied/5",
  cleaning: "border-status-cleaning/30 bg-status-cleaning/5",
  maintenance: "border-status-maintenance/30 bg-status-maintenance/5",
  reserved: "border-status-reserved/30 bg-status-reserved/5",
};

const statusCounts = (status: RoomStatus) =>
  allRooms.filter((r) => r.status === status).length;

export default function RoomsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const filteredRooms = allRooms.filter((room) => {
    if (statusFilter !== "all" && room.status !== statusFilter) return false;
    if (typeFilter !== "all" && room.type !== typeFilter) return false;
    if (floorFilter !== "all" && room.floor.toString() !== floorFilter) return false;
    if (search && !room.number.includes(search) && !room.currentGuest?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectedRoomData = allRooms.find((r) => r.id === selectedRoom);
  const floors = [...new Set(allRooms.map((r) => r.floor))].sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-md text-charcoal">Rooms Management</h1>
          <p className="body-sm text-text-muted-custom mt-1">
            Manage {allRooms.length} rooms across all floors
          </p>
        </div>
        <Button className="bg-emerald hover:bg-emerald-dark text-white rounded-[6px] gap-2">
          <Plus className="h-4 w-4" /> Add Room
        </Button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(["available", "occupied", "cleaning", "maintenance", "reserved"] as RoomStatus[]).map(
          (status) => (
            <Card
              key={status}
              className={`py-3 shadow-xs cursor-pointer transition-all hover:shadow-sm ${
                statusFilter === status ? "ring-2 ring-emerald/30" : "border-transparent"
              }`}
              onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
            >
              <CardContent className="px-4 flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-charcoal">{statusCounts(status)}</p>
                  <RoomStatusBadge status={status} showDot={false} />
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* Filters */}
      <Card className="py-3 shadow-xs border-transparent">
        <CardContent className="px-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted-custom" />
            <Input
              placeholder="Search room number or guest..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px] h-8 text-sm">
              <SelectValue placeholder="Room Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="deluxe">Deluxe</SelectItem>
              <SelectItem value="family">Family</SelectItem>
              <SelectItem value="executive_suite">Executive Suite</SelectItem>
              <SelectItem value="presidential_suite">Presidential</SelectItem>
            </SelectContent>
          </Select>
          <Select value={floorFilter} onValueChange={setFloorFilter}>
            <SelectTrigger className="w-[120px] h-8 text-sm">
              <SelectValue placeholder="Floor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Floors</SelectItem>
              {floors.map((f) => (
                <SelectItem key={f} value={f.toString()}>Floor {f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center border rounded-[6px] p-0.5 ml-auto">
            <Button
              variant={view === "grid" ? "default" : "ghost"}
              size="icon-sm"
              className={view === "grid" ? "bg-emerald text-white h-7 w-7" : "h-7 w-7"}
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="icon-sm"
              className={view === "list" ? "bg-emerald text-white h-7 w-7" : "h-7 w-7"}
              onClick={() => setView("list")}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Room Grid */}
      <div className={view === "grid"
        ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
        : "space-y-2"
      }>
        {filteredRooms.map((room) => (
          <Card
            key={room.id}
            className={`py-0 shadow-xs cursor-pointer transition-all hover:shadow-md border ${statusColors[room.status]} ${
              view === "list" ? "flex-row" : ""
            }`}
            onClick={() => setSelectedRoom(room.id)}
          >
            <CardContent className={`p-4 ${view === "list" ? "flex items-center gap-4 w-full" : ""}`}>
              <div className={`flex items-center justify-between ${view === "list" ? "gap-4 w-full" : "mb-3"}`}>
                <div className="flex items-center gap-2">
                  <DoorOpen className="h-4 w-4 text-slate-custom" />
                  <span className="text-lg font-bold text-charcoal">{room.number}</span>
                </div>
                {view === "list" && (
                  <>
                    <span className="text-sm text-text-muted-custom hidden sm:inline">Floor {room.floor}</span>
                    <span className="text-sm text-slate-custom hidden md:inline">{getRoomTypeLabel(room.type)}</span>
                    <span className="text-sm font-semibold text-charcoal hidden lg:inline">{formatCurrency(room.price)}/night</span>
                    {room.currentGuest && (
                      <span className="text-sm text-slate-custom hidden xl:inline">{room.currentGuest}</span>
                    )}
                  </>
                )}
                <RoomStatusBadge status={room.status} showDot={view === "list"} />
              </div>
              {view === "grid" && (
                <>
                  <p className="text-xs text-text-muted-custom mb-1">
                    {getRoomTypeLabel(room.type)} · Floor {room.floor}
                  </p>
                  <p className="text-sm font-semibold text-charcoal mb-2">
                    {formatCurrency(room.price)}<span className="text-xs font-normal text-text-muted-custom">/night</span>
                  </p>
                  {room.currentGuest && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-custom">
                      <User className="h-3 w-3" />
                      <span className="truncate">{room.currentGuest}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <div className="text-center py-12">
          <BedDouble className="h-12 w-12 text-text-muted-custom/30 mx-auto mb-3" />
          <p className="text-sm text-text-muted-custom">No rooms match your filters</p>
        </div>
      )}

      {/* Room Detail Sheet */}
      <Sheet open={!!selectedRoom} onOpenChange={() => setSelectedRoom(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <span className="text-xl">Room {selectedRoomData?.number}</span>
              {selectedRoomData && <RoomStatusBadge status={selectedRoomData.status} />}
            </SheetTitle>
            <SheetDescription>
              {selectedRoomData && `${getRoomTypeLabel(selectedRoomData.type)} · Floor ${selectedRoomData.floor}`}
            </SheetDescription>
          </SheetHeader>
          {selectedRoomData && (
            <div className="space-y-6 mt-6 px-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-pearl/50 rounded-[8px] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted-custom mb-1">Price / Night</p>
                  <p className="text-lg font-bold text-charcoal">{formatCurrency(selectedRoomData.price)}</p>
                </div>
                <div className="bg-pearl/50 rounded-[8px] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted-custom mb-1">Floor</p>
                  <p className="text-lg font-bold text-charcoal">{selectedRoomData.floor}</p>
                </div>
              </div>
              {selectedRoomData.currentGuest && (
                <div className="bg-pearl/50 rounded-[8px] p-4">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted-custom mb-2">Current Guest</p>
                  <p className="text-sm font-medium text-charcoal">{selectedRoomData.currentGuest}</p>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold">Quick Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="text-xs rounded-[6px]">Change Status</Button>
                  <Button variant="outline" size="sm" className="text-xs rounded-[6px]">Housekeeping</Button>
                  <Button variant="outline" size="sm" className="text-xs rounded-[6px]">Maintenance</Button>
                  <Button variant="outline" size="sm" className="text-xs rounded-[6px]">View History</Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
