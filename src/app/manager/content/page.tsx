"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/store/auth-store";
import { useI18n } from "@/lib/i18n/context";
import { formatCurrency } from "@/lib/format";
import { menuCategories } from "@/lib/menu-data";
import {
  Plus,
  Upload,
  Pencil,
  Trash2,
  Bed,
  UtensilsCrossed,
  GlassWater,
  Star,
  ImageIcon,
  Settings,
  Save,
  Package,
  DollarSign,
  Eye,
  ToggleLeft,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────
interface ManagedRoom {
  id: string;
  name: string;
  type: string;
  price: number;
  capacity: number;
  description: string;
  imageUrl: string;
  available: boolean;
  features: string[];
}

interface ManagedMenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
  available: boolean;
  popular: boolean;
  vegetarian: boolean;
  spicy: boolean;
}

interface ManagedFeature {
  id: string;
  name: string;
  type: "service" | "amenity" | "package";
  price: number;
  description: string;
  active: boolean;
}

// ─── Mock Data ───────────────────────────────────────────────
const mockRooms: ManagedRoom[] = [
  {
    id: "r-001",
    name: "Deluxe Room",
    type: "deluxe",
    price: 250000,
    capacity: 2,
    description: "Spacious comfort with panoramic views of Kigali's rolling hills.",
    imageUrl: "https://images.pexels.com/photos/34672504/pexels-photo-34672504.jpeg",
    available: true,
    features: ["WiFi", "TV", "Minibar", "Balcony"],
  },
  {
    id: "r-002",
    name: "Executive Suite",
    type: "executive_suite",
    price: 450000,
    capacity: 3,
    description: "An elevated experience with separate living area.",
    imageUrl: "https://images.pexels.com/photos/5883728/pexels-photo-5883728.jpeg",
    available: true,
    features: ["WiFi", "TV", "Minibar", "Living Room", "Butler Service"],
  },
  {
    id: "r-003",
    name: "Presidential Suite",
    type: "presidential_suite",
    price: 850000,
    capacity: 4,
    description: "The pinnacle of luxury — expansive spaces, private dining.",
    imageUrl: "https://images.pexels.com/photos/18285947/pexels-photo-18285947.jpeg",
    available: true,
    features: ["WiFi", "TV", "Minibar", "Jacuzzi", "Private Chef", "Concierge"],
  },
];

const mockMenuItems: ManagedMenuItem[] = [
  { id: "m-001", name: "Beef Steak", category: "beef", price: 8000, description: "Tender beef fillet in pepper sauce", imageUrl: "", available: true, popular: true, vegetarian: false, spicy: false },
  { id: "m-002", name: "Mushroom Soup", category: "hot_starters", price: 3000, description: "Creamy mushroom soup", imageUrl: "", available: true, popular: false, vegetarian: true, spicy: false },
  { id: "m-003", name: "Grilled Chicken", category: "chicken", price: 6000, description: "Herb marinated grilled chicken", imageUrl: "", available: true, popular: true, vegetarian: false, spicy: false },
];

const mockFeatures: ManagedFeature[] = [
  { id: "f-001", name: "Airport Pickup", type: "service", price: 30000, description: "Private car from Kigali Airport", active: true },
  { id: "f-002", name: "Spa Package", type: "package", price: 50000, description: "90-min massage + facial", active: true },
  { id: "f-003", name: "City Tour", type: "package", price: 40000, description: "Half-day guided Kigali tour", active: true },
  { id: "f-004", name: "Pool Access", type: "amenity", price: 5000, description: "Daily pool access pass", active: true },
];

export default function ManagerContentPage() {
  const { user } = useAuthStore();
  const { isRw } = useI18n();
  const [activeTab, setActiveTab] = useState("rooms");
  const [searchQuery, setSearchQuery] = useState("");

  // Room management
  const [rooms, setRooms] = useState(mockRooms);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState<ManagedRoom | null>(null);

  // Menu management
  const [menuItems, setMenuItems] = useState(mockMenuItems);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Features management
  const [features, setFeatures] = useState(mockFeatures);

  // New room form state
  const [newRoom, setNewRoom] = useState({
    name: "",
    type: "deluxe",
    price: 0,
    capacity: 2,
    description: "",
    imageUrl: "",
  });

  // New menu item form state
  const [newMenuItem, setNewMenuItem] = useState({
    name: "",
    category: "beef",
    price: 0,
    description: "",
    vegetarian: false,
    spicy: false,
  });

  const handleAddRoom = () => {
    if (!newRoom.name || !newRoom.price) {
      toast.error("Please fill in room name and price");
      return;
    }
    const room: ManagedRoom = {
      id: `r-${Date.now()}`,
      ...newRoom,
      available: true,
      features: ["WiFi", "TV"],
    };
    setRooms([...rooms, room]);
    setShowAddRoom(false);
    setNewRoom({ name: "", type: "deluxe", price: 0, capacity: 2, description: "", imageUrl: "" });
    toast.success("Room added successfully!");
  };

  const handleAddMenuItem = () => {
    if (!newMenuItem.name || !newMenuItem.price) {
      toast.error("Please fill in item name and price");
      return;
    }
    const item: ManagedMenuItem = {
      id: `m-${Date.now()}`,
      ...newMenuItem,
      imageUrl: "",
      available: true,
      popular: false,
    };
    setMenuItems([...menuItems, item]);
    setShowAddMenu(false);
    setNewMenuItem({ name: "", category: "beef", price: 0, description: "", vegetarian: false, spicy: false });
    toast.success("Menu item added successfully!");
  };

  const handleToggleRoom = (id: string) => {
    setRooms(rooms.map((r) => (r.id === id ? { ...r, available: !r.available } : r)));
    toast.success("Room availability updated");
  };

  const handleToggleMenuItem = (id: string) => {
    setMenuItems(menuItems.map((m) => (m.id === id ? { ...m, available: !m.available } : m)));
    toast.success("Menu item availability updated");
  };

  const handleDeleteRoom = (id: string) => {
    setRooms(rooms.filter((r) => r.id !== id));
    toast.success("Room removed");
  };

  const handleDeleteMenuItem = (id: string) => {
    setMenuItems(menuItems.filter((m) => m.id !== id));
    toast.success("Menu item removed");
  };

  const handleUpdatePrice = (type: "room" | "menu" | "feature", id: string, newPrice: number) => {
    if (type === "room") {
      setRooms(rooms.map((r) => (r.id === id ? { ...r, price: newPrice } : r)));
    } else if (type === "menu") {
      setMenuItems(menuItems.map((m) => (m.id === id ? { ...m, price: newPrice } : m)));
    } else {
      setFeatures(features.map((f) => (f.id === id ? { ...f, price: newPrice } : f)));
    }
    toast.success("Price updated!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald rounded-xl flex items-center justify-center shadow-lg">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="heading-md text-charcoal">
              {isRw ? "Gucunga Ibikubiyemo" : "Content Management"}
            </h1>
            <p className="text-xs text-text-muted-custom">
              {isRw
                ? "Ongeraho no guhindura ibyumba, menu, ibiciro n'ibindi"
                : "Upload and manage rooms, menu items, prices & more"}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          {user?.branchName || "Branch"}
        </Badge>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-xl">
          <TabsTrigger value="rooms" className="gap-1.5 text-xs">
            <Bed className="h-3.5 w-3.5" />
            Rooms
          </TabsTrigger>
          <TabsTrigger value="menu" className="gap-1.5 text-xs">
            <UtensilsCrossed className="h-3.5 w-3.5" />
            Menu
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-1.5 text-xs">
            <Star className="h-3.5 w-3.5" />
            Services
          </TabsTrigger>
        </TabsList>

        {/* ─── ROOMS TAB ─── */}
        <TabsContent value="rooms" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{rooms.length} rooms configured</p>
            <Dialog open={showAddRoom} onOpenChange={setShowAddRoom}>
              <DialogTrigger asChild>
                <Button className="bg-emerald hover:bg-emerald-dark text-white gap-1.5" size="sm">
                  <Plus className="h-4 w-4" /> Add Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Room</DialogTitle>
                  <DialogDescription>Configure a new room type for your branch</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Room Name</Label>
                      <Input
                        placeholder="e.g., Deluxe Room"
                        value={newRoom.name}
                        onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Room Type</Label>
                      <Select value={newRoom.type} onValueChange={(v) => setNewRoom({ ...newRoom, type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="deluxe">Deluxe</SelectItem>
                          <SelectItem value="family">Family Suite</SelectItem>
                          <SelectItem value="executive_suite">Executive Suite</SelectItem>
                          <SelectItem value="presidential_suite">Presidential Suite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price per Night (RWF)</Label>
                      <Input
                        type="number"
                        placeholder="250000"
                        value={newRoom.price || ""}
                        onChange={(e) => setNewRoom({ ...newRoom, price: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Capacity</Label>
                      <Input
                        type="number"
                        placeholder="2"
                        value={newRoom.capacity}
                        onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) || 2 })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe the room..."
                      value={newRoom.description}
                      onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input
                      placeholder="https://..."
                      value={newRoom.imageUrl}
                      onChange={(e) => setNewRoom({ ...newRoom, imageUrl: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddRoom(false)}>Cancel</Button>
                  <Button className="bg-emerald hover:bg-emerald-dark" onClick={handleAddRoom}>
                    <Save className="h-4 w-4 mr-1.5" /> Add Room
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {rooms.map((room) => (
              <Card key={room.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-48 h-32 sm:h-auto overflow-hidden">
                      <img
                        src={room.imageUrl || "https://picsum.photos/300/200"}
                        alt={room.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-heading font-semibold text-charcoal">{room.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{room.description}</p>
                        </div>
                        <Badge className={room.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {room.available ? "Available" : "Unavailable"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-emerald" />
                          <Input
                            type="number"
                            value={room.price}
                            onChange={(e) => handleUpdatePrice("room", room.id, parseInt(e.target.value) || 0)}
                            className="h-7 w-28 text-xs font-semibold"
                          />
                          <span className="text-[10px] text-muted-foreground">/night</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Cap: {room.capacity}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {room.features.map((f) => (
                          <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>
                        ))}
                      </div>
                      <Separator className="my-3" />
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={room.available}
                          onCheckedChange={() => handleToggleRoom(room.id)}
                        />
                        <span className="text-xs text-muted-foreground">
                          {room.available ? "Accepting bookings" : "Closed"}
                        </span>
                        <div className="flex-1" />
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteRoom(room.id)}
                        >
                          <Trash2 className="h-3 w-3" /> Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ─── MENU TAB ─── */}
        <TabsContent value="menu" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{menuItems.length} menu items</p>
            <Dialog open={showAddMenu} onOpenChange={setShowAddMenu}>
              <DialogTrigger asChild>
                <Button className="bg-emerald hover:bg-emerald-dark text-white gap-1.5" size="sm">
                  <Plus className="h-4 w-4" /> Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Menu Item</DialogTitle>
                  <DialogDescription>Add a new food or beverage item</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Item Name</Label>
                      <Input
                        placeholder="e.g., Grilled Salmon"
                        value={newMenuItem.name}
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={newMenuItem.category} onValueChange={(v) => setNewMenuItem({ ...newMenuItem, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {menuCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Price (RWF)</Label>
                    <Input
                      type="number"
                      placeholder="5000"
                      value={newMenuItem.price || ""}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, price: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe the dish..."
                      value={newMenuItem.description}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newMenuItem.vegetarian}
                        onCheckedChange={(c) => setNewMenuItem({ ...newMenuItem, vegetarian: c })}
                      />
                      <Label className="text-xs">Vegetarian</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newMenuItem.spicy}
                        onCheckedChange={(c) => setNewMenuItem({ ...newMenuItem, spicy: c })}
                      />
                      <Label className="text-xs">Spicy</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddMenu(false)}>Cancel</Button>
                  <Button className="bg-emerald hover:bg-emerald-dark" onClick={handleAddMenuItem}>
                    <Save className="h-4 w-4 mr-1.5" /> Add Item
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price (RWF)</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menuItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {menuCategories.find((c) => c.id === item.category)?.label || item.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleUpdatePrice("menu", item.id, parseInt(e.target.value) || 0)}
                        className="h-7 w-24 text-xs font-semibold"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {item.vegetarian && <Badge className="bg-green-100 text-green-700 text-[9px]">Veg</Badge>}
                        {item.spicy && <Badge className="bg-red-100 text-red-700 text-[9px]">Spicy</Badge>}
                        {item.popular && <Badge className="bg-gold/20 text-gold-dark text-[9px]">Popular</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={item.available}
                        onCheckedChange={() => handleToggleMenuItem(item.id)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-600"
                          onClick={() => handleDeleteMenuItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ─── FEATURES TAB ─── */}
        <TabsContent value="features" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{features.length} services & packages</p>
            <Button className="bg-emerald hover:bg-emerald-dark text-white gap-1.5" size="sm">
              <Plus className="h-4 w-4" /> Add Service
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{feature.name}</h3>
                        <Badge variant="outline" className="text-[10px]">{feature.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                    </div>
                    <Switch checked={feature.active} onCheckedChange={() => {
                      setFeatures(features.map((f) =>
                        f.id === feature.id ? { ...f, active: !f.active } : f
                      ));
                      toast.success("Service status updated");
                    }} />
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <DollarSign className="h-3.5 w-3.5 text-emerald" />
                    <Input
                      type="number"
                      value={feature.price}
                      onChange={(e) => handleUpdatePrice("feature", feature.id, parseInt(e.target.value) || 0)}
                      className="h-7 w-28 text-xs font-semibold"
                    />
                    <span className="text-[10px] text-muted-foreground">RWF</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
