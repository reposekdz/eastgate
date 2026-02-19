"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store/auth-store";
import { Plus, Bed, Edit, Trash2, DollarSign, Search, Wifi, Tv, Coffee, Eye } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

// Types
interface Room {
  id: string;
  number: string;
  floor: number;
  type: string;
  price: number;
  status: string;
  description?: string;
  amenities?: string[];
  view?: string;
  size?: number;
}

export default function RoomManagementPage() {
  const { user } = useAuthStore();
  const branchId = user?.branchId || "";
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  
  // Fetch rooms from database
  useEffect(() => {
    async function fetchRooms() {
      if (!branchId) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`/api/rooms?branchId=${branchId}`);
        const data = await res.json();
        
        if (data.rooms) {
          setRooms(data.rooms);
        }
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRooms();
  }, [branchId]);

  const [formData, setFormData] = useState({
    number: "",
    floor: "1",
    type: "STANDARD",
    price: "",
    description: "",
    view: "City View",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.number.toLowerCase().includes(searchQuery.toLowerCase()) || 
      room.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || room.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const roomData = {
      number: formData.number,
      floor: parseInt(formData.floor),
      type: formData.type,
      price: parseInt(formData.price),
      description: formData.description,
      branchId: branchId,
    };

    try {
      let res;
      
      if (editMode && selectedRoom) {
        // Update existing room
        res = await fetch(`/api/rooms/${selectedRoom.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(roomData),
        });
        
        if (res.ok) {
          setRooms(rooms.map(r => r.id === selectedRoom.id ? { ...r, ...roomData } : r));
          toast.success(`Room ${formData.number} updated successfully!`);
        }
      } else {
        // Create new room
        res = await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(roomData),
        });
        
        if (res.ok) {
          const newRoom = await res.json();
          setRooms([...rooms, newRoom]);
          toast.success(`Room ${formData.number} added successfully!`);
        }
      }
      
      setFormData({ number: "", floor: "1", type: "STANDARD", price: "", description: "", view: "City View" });
      setDialogOpen(false);
      setEditMode(false);
      setSelectedRoom(null);
    } catch (error) {
      toast.error("Failed to save room");
    }
  };

  const handleEdit = (room: Room) => {
    setEditMode(true);
    setSelectedRoom(room);
    setFormData({
      number: room.number,
      floor: room.floor.toString(),
      type: room.type,
      price: room.price.toString(),
      description: room.description || "",
      view: room.view || "City View",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (roomId: string, roomNumber: string) => {
    if (!confirm(`Delete room ${roomNumber}? This action cannot be undone.`)) return;
    
    try {
      const res = await fetch(`/api/rooms/${roomId}`, { method: "DELETE" });
      
      if (res.ok) {
        setRooms(rooms.filter(r => r.id !== roomId));
        toast.success(`Room ${roomNumber} deleted`);
      }
    } catch (error) {
      toast.error("Failed to delete room");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE": return "bg-emerald-500";
      case "OCCUPIED": return "bg-blue-500";
      case "RESERVED": return "bg-amber-500";
      case "CLEANING": return "bg-purple-500";
      case "MAINTENANCE": return "bg-red-500";
      default: return "bg-slate-500";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "STANDARD": return "bg-slate-100 text-slate-800";
      case "DELUXE": return "bg-amber-100 text-amber-800";
      case "FAMILY": return "bg-green-100 text-green-800";
      case "EXECUTIVE_SUITE": return "bg-purple-100 text-purple-800";
      case "PRESIDENTIAL_SUITE": return "bg-rose-100 text-rose-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <section className="bg-gradient-to-br from-charcoal to-surface-dark text-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
                <Bed className="h-8 w-8" />
                Room Management
              </h1>
              <p className="text-white/70">Add, edit, and manage rooms for your branch</p>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={() => {
                  setEditMode(false);
                  setSelectedRoom(null);
                  setFormData({ number: "", floor: "1", type: "STANDARD", price: "", description: "", view: "City View" });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editMode ? "Edit Room" : "Add New Room"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="number">Room Number</Label>
                      <Input
                        id="number"
                        value={formData.number}
                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                        placeholder="e.g., 101"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="floor">Floor</Label>
                      <Select value={formData.floor} onValueChange={(v) => setFormData({ ...formData, floor: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6,7,8,9,10].map(f => (
                            <SelectItem key={f} value={f.toString()}>Floor {f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="type">Room Type</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STANDARD">Standard</SelectItem>
                        <SelectItem value="DELUXE">Deluxe</SelectItem>
                        <SelectItem value="FAMILY">Family</SelectItem>
                        <SelectItem value="EXECUTIVE_SUITE">Executive Suite</SelectItem>
                        <SelectItem value="PRESIDENTIAL_SUITE">Presidential Suite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="price">Price (RWF)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="e.g., 250000"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Room description"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="view">View</Label>
                    <Select value={formData.view} onValueChange={(v) => setFormData({ ...formData, view: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="City View">City View</SelectItem>
                        <SelectItem value="Garden View">Garden View</SelectItem>
                        <SelectItem value="Pool View">Pool View</SelectItem>
                        <SelectItem value="Mountain View">Mountain View</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600">
                    {editMode ? "Update Room" : "Add Room"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Search and Filters */}
          <div className="flex items-center gap-4 mt-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="OCCUPIED">Occupied</SelectItem>
                <SelectItem value="RESERVED">Reserved</SelectItem>
                <SelectItem value="CLEANING">Cleaning</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="mt-4 text-slate-500">Loading rooms...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bed className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No rooms found</h3>
              <p className="text-slate-500 mb-4">Add your first room to get started</p>
              <Button onClick={() => setDialogOpen(true)} className="bg-emerald-500 hover:bg-emerald-600">
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className={cn("h-2", getStatusColor(room.status))} />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold">Room {room.number}</h3>
                        <Badge className={cn("mt-1", getTypeColor(room.type))}>
                          {room.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <Badge className={cn(getStatusColor(room.status), "text-white")}>
                        {room.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium">Floor:</span> {room.floor}
                      </div>
                      {room.view && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <span className="font-medium">View:</span> {room.view}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Wifi className="w-4 h-4" />
                        <Tv className="w-4 h-4" />
                        <Coffee className="w-4 h-4" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div>
                        <span className="text-2xl font-bold text-emerald-600">
                          {formatCurrency(room.price)}
                        </span>
                        <span className="text-slate-500 text-sm">/night</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(room)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(room.id, room.number)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
