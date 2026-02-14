"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store/auth-store";
import { Plus, Bed, Edit, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function RoomManagementPage() {
  const { user } = useAuthStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    number: "",
    floor: "1",
    type: "standard" as "standard" | "deluxe" | "executive_suite" | "presidential_suite" | "family",
    price: "",
  });

  const [rooms, setRooms] = useState([
    { id: "1", number: "101", floor: 1, type: "deluxe", price: 325000, status: "available", amenities: ["WiFi", "TV", "Mini Bar"] },
    { id: "2", number: "102", floor: 1, type: "standard", price: 234000, status: "occupied", amenities: ["WiFi", "TV"] },
    { id: "3", number: "201", floor: 2, type: "executive_suite", price: 585000, status: "available", amenities: ["WiFi", "TV", "Mini Bar", "Balcony"] },
    { id: "4", number: "301", floor: 3, type: "presidential_suite", price: 1105000, status: "cleaning", amenities: ["WiFi", "TV", "Mini Bar", "Balcony", "Jacuzzi"] },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.number.includes(searchQuery) || room.type.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || room.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editMode && selectedRoom) {
      setRooms(rooms.map(r => r.id === selectedRoom.id ? { ...r, ...formData, price: Number(formData.price), floor: Number(formData.floor) } : r));
      toast.success("Room updated successfully!");
    } else {
      const newRoom = { id: Date.now().toString(), ...formData, price: Number(formData.price), floor: Number(formData.floor), status: "available", amenities: ["WiFi", "TV"] };
      setRooms([...rooms, newRoom]);
      toast.success(`Room ${formData.number} added successfully!`);
    }
    
    setFormData({ number: "", floor: "1", type: "standard", price: "" });
    setDialogOpen(false);
    setEditMode(false);
  };

  const updateRoomStatus = (roomId: string, newStatus: string) => {
    setRooms(rooms.map(r => r.id === roomId ? { ...r, status: newStatus } : r));
    toast.success("Room status updated");
  };

  const deleteRoom = (roomId: string) => {
    setRooms(rooms.filter(r => r.id !== roomId));
    toast.success("Room deleted");
  };

  const openEdit = (room: any) => {
    setSelectedRoom(room);
    setFormData({ number: room.number, floor: room.floor.toString(), type: room.type, price: room.price.toString() });
    setEditMode(true);
    setDialogOpen(true);
  };

  const typeLabels: Record<string, string> = {
    standard: "Standard",
    deluxe: "Deluxe",
    executive_suite: "Executive Suite",
    presidential_suite: "Presidential Suite",
    family: "Family",
  };

  const statusColors: Record<string, string> = {
    available: "bg-green-500",
    occupied: "bg-blue-500",
    cleaning: "bg-yellow-500",
    maintenance: "bg-red-500",
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <section className="bg-gradient-to-br from-charcoal to-surface-dark text-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
                <Bed className="h-8 w-8" />
                Room Management
              </h1>
              <p className="text-white/70">Manage rooms for {user?.branchName}</p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditMode(false); setFormData({ number: "", floor: "1", type: "standard", price: "" }); } }}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald hover:bg-emerald-dark text-white gap-2">
                    <Plus className="h-5 w-5" />
                    Add Room
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-heading">{editMode ? "Edit" : "Add"} Room</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Room Number *</Label>
                      <Input value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} placeholder="101" required />
                    </div>
                    <div>
                      <Label>Floor *</Label>
                      <Select value={formData.floor} onValueChange={(v) => setFormData({ ...formData, floor: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5].map(f => <SelectItem key={f} value={f.toString()}>Floor {f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Room Type *</Label>
                      <Select value={formData.type} onValueChange={(v: typeof formData.type) => setFormData({ ...formData, type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="deluxe">Deluxe</SelectItem>
                          <SelectItem value="executive_suite">Executive Suite</SelectItem>
                          <SelectItem value="presidential_suite">Presidential Suite</SelectItem>
                          <SelectItem value="family">Family</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Price per Night (RWF) *</Label>
                      <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="325000" required />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Cancel</Button>
                    <Button type="submit" className="flex-1 bg-emerald hover:bg-emerald-dark text-white">{editMode ? "Update" : "Add"} Room</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-charcoal">{rooms.filter(r => r.status === "available").length}</p>
              <p className="text-xs text-text-muted-custom">Available</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-charcoal">{rooms.filter(r => r.status === "occupied").length}</p>
              <p className="text-xs text-text-muted-custom">Occupied</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/30">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-charcoal">{rooms.filter(r => r.status === "cleaning").length}</p>
              <p className="text-xs text-text-muted-custom">Cleaning</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-charcoal">{rooms.filter(r => r.status === "maintenance").length}</p>
              <p className="text-xs text-text-muted-custom">Maintenance</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room, idx) => (
            <motion.div key={room.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-2xl font-bold text-charcoal">#{room.number}</h3>
                      <p className="text-sm text-text-muted-custom">Floor {room.floor}</p>
                    </div>
                    <div className={cn("h-3 w-3 rounded-full", statusColors[room.status])} />
                  </div>
                  <Badge className="mb-3">{typeLabels[room.type]}</Badge>
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-4 w-4 text-emerald" />
                    <span className="text-lg font-bold text-emerald">{formatCurrency(room.price)}</span>
                    <span className="text-xs text-text-muted-custom">/night</span>
                  </div>
                  <div className="space-y-2">
                    <Select value={room.status} onValueChange={(v) => updateRoomStatus(room.id, v)}>
                      <SelectTrigger className="w-full h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(room)} className="flex-1 gap-1">
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteRoom(room.id)} className="px-2">
                        ×
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
