"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { useI18n } from "@/lib/i18n/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ImageUpload from "@/components/shared/ImageUpload";
import { fullMenu } from "@/lib/menu-data";
import { Search, Save, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";

export default function ManagerMenuImagesPage() {
  const { user } = useAuthStore();
  const { locale } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [menuImages, setMenuImages] = useState<Record<string, string>>({});

  const filteredMenu = fullMenu.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImageUpload = (itemId: string, url: string) => {
    setMenuImages((prev) => ({ ...prev, [itemId]: url }));
    toast.success(locale === "rw" ? "Ishusho yoherejwe neza!" : "Image uploaded!");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(locale === "rw" ? "Byabitswe!" : "Saved!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{locale === "rw" ? "Amashusho ya Menu" : "Menu Images"}</h1>
          <p className="text-text-muted-custom mt-2">{locale === "rw" ? "Ohereza amashusho" : "Upload images"}</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-emerald">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        </Button>
      </div>
      <Input placeholder={locale === "rw" ? "Shakisha..." : "Search..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMenu.map((item) => (
          <Card key={item.id}>
            <CardHeader><CardTitle className="text-base">{item.name}</CardTitle></CardHeader>
            <CardContent><ImageUpload category="menu" itemId={item.id} branchId={user?.branchId} onUploadSuccess={(url) => handleImageUpload(item.id, url)} /></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
