"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Globe,
  Bell,
  Shield,
  CreditCard,
} from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="heading-md text-charcoal">Settings</h1>
        <p className="body-sm text-text-muted-custom mt-1">
          Configure system-wide settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="bg-pearl/50">
          <TabsTrigger value="general" className="text-sm data-[state=active]:bg-white">General</TabsTrigger>
          <TabsTrigger value="notifications" className="text-sm data-[state=active]:bg-white">Notifications</TabsTrigger>
          <TabsTrigger value="security" className="text-sm data-[state=active]:bg-white">Security</TabsTrigger>
          <TabsTrigger value="billing" className="text-sm data-[state=active]:bg-white">Billing</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="mt-4 space-y-4">
          <Card className="py-4 shadow-xs border-transparent">
            <CardHeader className="px-5 pb-0">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald" />
                <CardTitle className="text-sm font-semibold text-charcoal">Hotel Information</CardTitle>
              </div>
              <CardDescription className="text-xs text-text-muted-custom">Basic hotel details and branding</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-charcoal mb-1.5 block">Hotel Name</label>
                  <Input defaultValue="EastGate Hotel Rwanda" className="text-sm h-9" />
                </div>
                <div>
                  <label className="text-xs font-medium text-charcoal mb-1.5 block">Email</label>
                  <Input defaultValue="info@eastgatehotel.rw" className="text-sm h-9" />
                </div>
                <div>
                  <label className="text-xs font-medium text-charcoal mb-1.5 block">Phone</label>
                  <Input defaultValue="+250 788 000 000" className="text-sm h-9" />
                </div>
                <div>
                  <label className="text-xs font-medium text-charcoal mb-1.5 block">Address</label>
                  <Input defaultValue="KG 7 Ave, Kigali, Rwanda" className="text-sm h-9" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button className="bg-emerald hover:bg-emerald-dark text-white rounded-[6px] text-sm">Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="py-4 shadow-xs border-transparent">
            <CardHeader className="px-5 pb-0">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald" />
                <CardTitle className="text-sm font-semibold text-charcoal">Localization</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-charcoal mb-1.5 block">Currency</label>
                  <Select defaultValue="usd">
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="rwf">RWF (FRw)</SelectItem>
                      <SelectItem value="eur">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-charcoal mb-1.5 block">Timezone</label>
                  <Select defaultValue="cat">
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cat">CAT (UTC+2)</SelectItem>
                      <SelectItem value="eat">EAT (UTC+3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-charcoal mb-1.5 block">Language</label>
                  <Select defaultValue="en">
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="rw">Kinyarwanda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button className="bg-emerald hover:bg-emerald-dark text-white rounded-[6px] text-sm">Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="py-4 shadow-xs border-transparent">
            <CardHeader className="px-5 pb-0">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-emerald" />
                <CardTitle className="text-sm font-semibold text-charcoal">Notification Preferences</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pt-4 space-y-5">
              {[
                { label: "New Booking Alerts", desc: "Get notified when a new booking is made", default: true },
                { label: "Check-in Reminders", desc: "Receive reminders for upcoming check-ins", default: true },
                { label: "Payment Notifications", desc: "Alerts for payment confirmations and issues", default: true },
                { label: "Low Occupancy Warnings", desc: "Notify when occupancy drops below 50%", default: false },
                { label: "Staff Schedule Changes", desc: "Alerts when staff schedules are modified", default: false },
                { label: "Maintenance Requests", desc: "Notifications for new maintenance tickets", default: true },
                { label: "SMS Booking Reminders", desc: "Send SMS reminders to guests before check-in", default: true },
                { label: "Marketing Emails", desc: "Promotional campaign notifications", default: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-charcoal">{item.label}</p>
                    <p className="text-xs text-text-muted-custom">{item.desc}</p>
                  </div>
                  <Switch defaultChecked={item.default} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="mt-4">
          <Card className="py-4 shadow-xs border-transparent">
            <CardHeader className="px-5 pb-0">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald" />
                <CardTitle className="text-sm font-semibold text-charcoal">Security Settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pt-4 space-y-5">
              {[
                { label: "Two-Factor Authentication", desc: "Require 2FA for all admin accounts", default: true },
                { label: "Login Attempt Monitoring", desc: "Lock accounts after 5 failed login attempts", default: true },
                { label: "Session Timeout", desc: "Auto-logout after 30 minutes of inactivity", default: false },
                { label: "IP Whitelisting", desc: "Restrict admin access to specific IP addresses", default: false },
                { label: "Audit Logging", desc: "Log all administrative actions for compliance", default: true },
                { label: "Encrypted Payments", desc: "End-to-end encryption for all payment data", default: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-charcoal">{item.label}</p>
                    <p className="text-xs text-text-muted-custom">{item.desc}</p>
                  </div>
                  <Switch defaultChecked={item.default} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing" className="mt-4">
          <Card className="py-4 shadow-xs border-transparent">
            <CardHeader className="px-5 pb-0">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald" />
                <CardTitle className="text-sm font-semibold text-charcoal">Payment Methods</CardTitle>
              </div>
              <CardDescription className="text-xs text-text-muted-custom">Configure accepted payment methods</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pt-4 space-y-5">
              {[
                { label: "Visa / Mastercard", desc: "Accept international credit and debit cards", default: true },
                { label: "Stripe", desc: "Online payment processing via Stripe", default: true },
                { label: "MTN Mobile Money", desc: "Accept MTN MoMo payments (Rwanda)", default: true },
                { label: "Airtel Money", desc: "Accept Airtel Money payments", default: true },
                { label: "Cash Payment", desc: "Allow pay-at-hotel cash payments", default: true },
                { label: "Split Payments", desc: "Allow guests to split bills across methods", default: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-charcoal">{item.label}</p>
                    <p className="text-xs text-text-muted-custom">{item.desc}</p>
                  </div>
                  <Switch defaultChecked={item.default} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
