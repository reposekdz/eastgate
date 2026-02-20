"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/store/auth-store";
import { useI18n } from "@/lib/i18n/context";
import RoomStatusBadge from "@/components/admin/shared/RoomStatusBadge";
import type { RoomStatus } from "@/lib/types/enums";
import {
  BedDouble,
  Search,
  LayoutGrid,
  List,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
} from "lucide-react";

interface Room {
  id: string;
  number: string;
  floor: number;
  room_type: string;
  status: string;
  price: number;
  description: string | null;
  image_url: string | null;
  branch_id: string;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  available: "border-status-available/30 bg-status-available/5",
  occupied: "border-status-occupied/30 bg-status-occupied/5",
  cleaning: "border-status-cleaning/30 bg-status-cleaning/5",
  maintenance: "border-status-maintenance/30 bg-status-maintenance/5",
  reserved: "border-status-reserved/30 bg-status-reserved/5",
};

const roomTypes = ["standard", "deluxe", "suite", "executive", "presidential"];

export default function RoomsPage() {
  const { t, isRw } = useI18n();
  const { user } = useAuthStore();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    number: "",
    floor: "1",
    type: "standard",
    price: "",
    description: "",
    status: "available",
  });

  const isSuperAdmin = user?.role === "SUPER_ADMIN" || user?.role === "super_admin";

  useEffect(() => {
    fetchRooms();
  }, [statusFilter, typeFilter, floorFilter]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (floorFilter !== "all") params.set("floor", floorFilter);

      const res = await fetch(`/api/admin/rooms?${params}`);
      const data = await res.json();

      if (data.success) {
        setRooms(data.rooms || []);
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/admin/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: formData.number,
          floor: parseInt(formData.floor),
          type: formData.type,
          price: parseFloat(formData.price),
          description: formData.description,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddDialog(false);
        resetForm();
        fetchRooms();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    setSaving(true);

    try {
      const res = await fetch("/api/admin/rooms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRoom.id,
          number: formData.number,
          floor: parseInt(formData.floor),
          type: formData.type,
          price: parseFloat(formData.price),
          description: formData.description,
          status: formData.status,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowEditDialog(false);
        setSelectedRoom(null);
        fetchRooms();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Failed to update room:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRoom) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/rooms?id=${selectedRoom.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        setShowDeleteDialog(false);
        setSelectedRoom(null);
        fetchRooms();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Failed to delete room:", error);
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (room: Room) => {
    setSelectedRoom(room);
    setFormData({
      number: room.number,
      floor: room.floor.toString(),
      type: room.room_type,
      price: room.price.toString(),
      description: room.description || "",
      status: room.status,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (room: Room) => {
    setSelectedRoom(room);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      number: "",
      floor: "1",
      type: "standard",
      price: "",
      description: "",
      status: "available",
    });
  };

  const filteredRooms = rooms.filter((room) => {
    if (search && !room.number.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusCounts = (status: string) => rooms.filter((r) => r.status === status).length;
  const floors = [...new Set(rooms.map((r) => r.floor))].sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-md text-charcoal">{isRw ? "Ibibanza" : "Rooms Management"}</h1>
          <p className="body-sm text-text-muted-custom mt-1">
            {isRw ? "Mugen Brooks" : `Manage ${rooms.length} rooms`}
          </p>
        </div>
        <Button
          className="bg-emerald hover:bg-emerald-dark text-white rounded-[6px] gap-2"
          onClick={() => { resetForm(); setShowAddDialog(true); }}
        >
          <Plus className="h-4 w-4" />
          {isRw ? "Fungura Rumwe" : "Add Room"}
        </Button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(["available", "occupied", "cleaning", "maintenance", "reserved"] as string[]).map(
          (status) => (
            <Card
              key={status}
              className={`py-3 shadow-xs cursor-pointer transition-all hover:shadow-sm ${statusFilter === status ? "ring-2 ring-emerald/30" : "border-transparent"
                }`}
              onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
            >
              <CardContent className="px-4 flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-charcoal">{statusCounts(status)}</p>
                  <RoomStatusBadge status={status as RoomStatus} showDot={false} />
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={isRw ? "Shakisha..." : "Search rooms..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={isRw ? "Ubwoko" : "Type"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRw ? "Byose" : "All Types"}</SelectItem>
            {roomTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={floorFilter} onValueChange={setFloorFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={isRw ? "Umurenge" : "Floor"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRw ? "Byose" : "All Floors"}</SelectItem>
            {floors.map((floor) => (
              <SelectItem key={floor} value={floor.toString()}>
                {isRw ? `Umurenge wa ${floor}` : `Floor ${floor}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-1 border rounded-md p-1">
          <Button
            variant={view === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Room List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald" />
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {isRw ? "Nta bibanza bihari" : "No rooms found"}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room) => (
            <Card key={room.id} className={`overflow-hidden ${statusColors[room.status] || ""}`}>
              <div className="aspect-video bg-gray-100 relative">
                {room.image_url ? (
                  <img src={room.image_url} alt={room.number} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BedDouble className="h-12 w-12 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <RoomStatusBadge status={room.status as RoomStatus} />
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{room.number}</h3>
                    <p className="text-sm text-gray-500 capitalize">{room.room_type}</p>
                    <p className="text-lg font-bold text-emerald mt-1">
                      ${room.price.toLocaleString()}
                      <span className="text-xs font-normal text-gray-500">/night</span>
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(room)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {isSuperAdmin && (
                      <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(room)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium">{isRw ? "Nomero" : "Room #"}</th>
                    <th className="text-left p-4 font-medium">{isRw ? "Ubwoko" : "Type"}</th>
                    <th className="text-left p-4 font-medium">{isRw ? "Umurenge" : "Floor"}</th>
                    <th className="text-left p-4 font-medium">{isRw ? "Ibitekerezo" : "Status"}</th>
                    <th className="text-left p-4 font-medium">{isRw ? "Igiciro" : "Price"}</th>
                    <th className="text-right p-4 font-medium">{isRw ? "Ibikorwa" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRooms.map((room) => (
                    <tr key={room.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{room.number}</td>
                      <td className="p-4 capitalize">{room.room_type}</td>
                      <td className="p-4">{room.floor}</td>
                      <td className="p-4">
                        <RoomStatusBadge status={room.status as RoomStatus} />
                      </td>
                      <td className="p-4 font-bold text-emerald">${room.price.toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(room)}>
                            <Pencil className="h-4 w-4 mr-1" />
                            {isRw ? "Hindura" : "Edit"}
                          </Button>
                          {isSuperAdmin && (
                            <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(room)}>
                              <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                              {isRw ? "Siba" : "Delete"}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Room Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isRw ? "Fungura Rumwe" : "Add New Room"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number">{isRw ? "Nomero y'igenam" : "Room Number"}</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    placeholder="e.g. 101, A1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="floor">{isRw ? "Umurenge" : "Floor"}</Label>
                  <Input
                    id="floor"
                    type="number"
                    min="1"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">{isRw ? "Ubwoko" : "Room Type"}</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val) => setFormData({ ...formData, type: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">{isRw ? "Igiciro" : "Price per night"}</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{isRw ? "Ibisobanuro" : "Description"}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={isRw ? "Ibisobanuro by'igenam..." : "Room description..."}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                {isRw ? "Funga" : "Cancel"}
              </Button>
              <Button type="submit" className="bg-emerald hover:bg-emerald-dark" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isRw ? "Fungura" : "Create Room"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isRw ? "Hindura Igenam" : "Edit Room"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-number">{isRw ? "Nomero" : "Room Number"}</Label>
                  <Input
                    id="edit-number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-floor">{isRw ? "Umurenge" : "Floor"}</Label>
                  <Input
                    id="edit-floor"
                    type="number"
                    min="1"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-type">{isRw ? "Ubwoko" : "Room Type"}</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val) => setFormData({ ...formData, type: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">{isRw ? "Ibitekerezo" : "Status"}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">{isRw ? "Iribone" : "Available"}</SelectItem>
                      <SelectItem value="occupied">{isRw ? "Irikinzwe" : "Occupied"}</SelectItem>
                      <SelectItem value="cleaning">{isRw ? "Ikirengerwa" : "Cleaning"}</SelectItem>
                      <SelectItem value="maintenance">{isRw ? "Ikoranwa" : "Maintenance"}</SelectItem>
                      <SelectItem value="reserved">{isRw ? "Ibibutse" : "Reserved"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">{isRw ? "Igiciro" : "Price per night"}</Label>
                <Input
                  id="edit-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">{isRw ? "Ibisobanuro" : "Description"}</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                {isRw ? "Funga" : "Cancel"}
              </Button>
              <Button type="submit" className="bg-emerald hover:bg-emerald-dark" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isRw ? "Bika" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRw ? "Siba Igenam" : "Delete Room"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              {isRw
                ? `Ubu buryo uzaba wanze igiheba ${selectedRoom?.number}.`
                : `Are you sure you want to delete room ${selectedRoom?.number}? This action cannot be undone.`
              }
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {isRw ? "Funga" : "Cancel"}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRw ? "Siba" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
