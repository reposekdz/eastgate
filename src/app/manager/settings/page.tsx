"use client";

import ProfileSettings from "@/components/shared/ProfileSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Bell, Globe } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function ManagerSettingsPage() {
  const [notifications, setNotifications] = useState({
    orders: true,
    bookings: true,
    services: true,
    chat: true,
    alerts: true,
    email: false,
  });

  const [preferences, setPreferences] = useState({
    language: "en",
    timezone: "CAT",
    currency: "RWF",
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="heading-md text-charcoal">Settings</h1>
        <p className="body-sm text-text-muted-custom mt-1">
          Manage your profile and preferences
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-emerald" /> Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "orders", label: "Order Updates", desc: "Get notified about new and updated orders" },
                { key: "bookings", label: "Booking Alerts", desc: "Check-in, check-out, and new bookings" },
                { key: "services", label: "Service Requests", desc: "Guest service request notifications" },
                { key: "chat", label: "Chat Messages", desc: "New messages from staff and guests" },
                { key: "alerts", label: "System Alerts", desc: "Important system and security alerts" },
                { key: "email", label: "Email Notifications", desc: "Receive notifications via email" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-charcoal">{item.label}</p>
                    <p className="text-xs text-text-muted-custom">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key as keyof typeof notifications]}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, [item.key]: checked }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald" /> Regional Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Language</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(v) => setPreferences((p) => ({ ...p, language: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="rw">Kinyarwanda</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Timezone</Label>
                  <Select
                    value={preferences.timezone}
                    onValueChange={(v) => setPreferences((p) => ({ ...p, timezone: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CAT">Central Africa Time (CAT)</SelectItem>
                      <SelectItem value="EAT">East Africa Time (EAT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Currency</Label>
                  <Select
                    value={preferences.currency}
                    onValueChange={(v) => setPreferences((p) => ({ ...p, currency: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RWF">RWF (Rwandan Franc)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
