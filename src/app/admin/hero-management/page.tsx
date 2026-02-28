"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/lib/store/auth-store";
import { Image, Plus, Edit, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Save, X } from "lucide-react";
import { toast } from "sonner";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  order: number;
  isActive: boolean;
  branchId: string;
  branch: { id: string; name: string };
}

export default function HeroManagementPage() {
  const { user } = useAuthStore();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    imageUrl: "",
    ctaText: "",
    ctaLink: "",
    branchId: user?.branchId || "",
    order: 0,
  });

  useEffect(() => {
    fetchSlides();
    fetchBranches();
  }, []);

  const fetchSlides = async () => {
    try {
      const token = localStorage.getItem("eastgate-token");
      const res = await fetch("/api/hero/slides", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setSlides(data.slides);
    } catch (error) {
      toast.error("Failed to fetch slides");
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem("eastgate-token");
      const res = await fetch("/api/branches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setBranches(data.branches);
    } catch (error) {
      console.error("Failed to fetch branches");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("eastgate-token");

    try {
      const url = editingSlide ? "/api/hero/slides" : "/api/hero/slides";
      const method = editingSlide ? "PUT" : "POST";
      const body = editingSlide ? { id: editingSlide.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingSlide ? "Slide updated" : "Slide created");
        fetchSlides();
        setIsDialogOpen(false);
        resetForm();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this slide?")) return;

    const token = localStorage.getItem("eastgate-token");
    try {
      const res = await fetch(`/api/hero/slides?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Slide deleted");
        fetchSlides();
      }
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const toggleActive = async (slide: HeroSlide) => {
    const token = localStorage.getItem("eastgate-token");
    try {
      const res = await fetch("/api/hero/slides", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: slide.id, isActive: !slide.isActive }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(slide.isActive ? "Slide hidden" : "Slide activated");
        fetchSlides();
      }
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const updateOrder = async (slide: HeroSlide, direction: "up" | "down") => {
    const newOrder = direction === "up" ? slide.order - 1 : slide.order + 1;
    const token = localStorage.getItem("eastgate-token");

    try {
      const res = await fetch("/api/hero/slides", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: slide.id, order: newOrder }),
      });

      if (res.ok) {
        toast.success("Order updated");
        fetchSlides();
      }
    } catch (error) {
      toast.error("Failed to update order");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      imageUrl: "",
      ctaText: "",
      ctaLink: "",
      branchId: user?.branchId || "",
      order: 0,
    });
    setEditingSlide(null);
  };

  const openEditDialog = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle,
      description: slide.description,
      imageUrl: slide.imageUrl,
      ctaText: slide.ctaText,
      ctaLink: slide.ctaLink,
      branchId: slide.branchId,
      order: slide.order,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-md text-charcoal">Hero Slides Management</h1>
          <p className="text-sm text-text-muted-custom">Manage homepage hero carousel slides</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald hover:bg-emerald-dark" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" /> Add Slide
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSlide ? "Edit Slide" : "Create New Slide"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Subtitle</label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Image URL</label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">CTA Text</label>
                  <Input
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    placeholder="Book Now"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">CTA Link</label>
                  <Input
                    value={formData.ctaLink}
                    onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                    placeholder="/book"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Branch</label>
                  <Select value={formData.branchId} onValueChange={(v) => setFormData({ ...formData, branchId: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Order</label>
                  <Input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
                <Button type="submit" className="bg-emerald hover:bg-emerald-dark">
                  <Save className="h-4 w-4 mr-2" /> {editingSlide ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slides.map((slide) => (
            <Card key={slide.id} className={!slide.isActive ? "opacity-60" : ""}>
              <CardHeader className="p-0">
                <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                  <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                  <Badge className="absolute top-2 right-2">{slide.branch.name}</Badge>
                  <Badge className="absolute top-2 left-2" variant={slide.isActive ? "default" : "secondary"}>
                    {slide.isActive ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                    {slide.isActive ? "Active" : "Hidden"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-charcoal">{slide.title}</h3>
                  <p className="text-sm text-text-muted-custom">{slide.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Order: {slide.order}</Badge>
                  {slide.ctaText && <Badge variant="outline">{slide.ctaText}</Badge>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => updateOrder(slide, "up")}>
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateOrder(slide, "down")}>
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleActive(slide)}>
                    {slide.isActive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(slide)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(slide.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
