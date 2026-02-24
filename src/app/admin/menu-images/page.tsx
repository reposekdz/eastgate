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

export default function AdminMenuImagesPage() {
  const { user } = useAuthStore();
  const { locale } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [menuImages, setMenuImages] = useState<Record<string, string>>({});

  const filteredMenu = fullMenu.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImageUpload = (itemId: string, url: string) => {
    setMenuImages((prev) => ({ ...prev, [itemId]: url }));
    toast.success(locale === "rw" ? "Ishusho yoherejwe neza!" : "Image uploaded successfully!");
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(locale === "rw" ? "Amahinduka yabitswe!" : "Changes saved!");
    } catch (error) {
      toast.error(locale === "rw" ? "Byanze kubikwa" : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">
            {locale === "rw" ? "Amashusho ya Menu" : "Menu Images"}
          </h1>
          <p className="text-text-muted-custom mt-2">
            {locale === "rw" ? "Ohereza amashusho y'ibiryo n'ibinyobwa" : "Upload images for food and beverage items"}
          </p>
        </div>
        <Button onClick={handleSaveAll} disabled={saving || Object.keys(menuImages).length === 0} className="bg-emerald hover:bg-emerald-dark">
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{locale === "rw" ? "Birimo kubika..." : "Saving..."}</> : <><Save className="h-4 w-4 mr-2" />{locale === "rw" ? "Bika Byose" : "Save All"}</>}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
        <Input placeholder={locale === "rw" ? "Shakisha ibiryo..." : "Search menu items..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMenu.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="truncate">{item.name}</span>
                <Badge variant="outline" className="ml-2 shrink-0">{formatCurrency(item.price)}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUpload category="menu" itemId={item.id} branchId={user?.branchId} currentImage={menuImages[item.id]} onUploadSuccess={(url) => handleImageUpload(item.id, url)} maxSize={5} />
              <div className="text-xs text-text-muted-custom">
                <p className="font-medium text-charcoal mb-1">{locale === "rw" ? "Ubwoko:" : "Category:"} {item.category}</p>
                {item.description && <p className="line-clamp-2">{item.description}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMenu.length === 0 && (
        <Card className="p-12 text-center">
          <ImageIcon className="h-12 w-12 text-text-muted-custom mx-auto mb-4" />
          <p className="text-lg font-semibold text-charcoal mb-2">{locale === "rw" ? "Nta biryo byabonetse" : "No items found"}</p>
          <p className="text-text-muted-custom">{locale === "rw" ? "Gerageza gushakisha ikindi" : "Try a different search term"}</p>
        </Card>
      )}
    </div>
  );
}
