"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, User, Mail, Lock, Building2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

const testAccounts = [
  { role: "Super Admin", email: "eastgate@gmail.com", password: "2026", dashboard: "/admin", permissions: "Full system access", color: "bg-purple-500" },
  { role: "Super Admin", email: "admin@eastgate.rw", password: "admin123", dashboard: "/admin", permissions: "Full system access", color: "bg-purple-500" },
  { role: "Super Manager", email: "manager@eastgate.rw", password: "manager123", dashboard: "/admin", permissions: "All branches", color: "bg-indigo-500" },
  { role: "Branch Manager", email: "jp@eastgate.rw", password: "jp123", dashboard: "/manager", permissions: "Kigali branch", color: "bg-blue-500" },
  { role: "Receptionist", email: "grace@eastgate.rw", password: "grace123", dashboard: "/receptionist", permissions: "Front desk", color: "bg-green-500" },
  { role: "Waiter", email: "patrick@eastgate.rw", password: "patrick123", dashboard: "/waiter", permissions: "Restaurant", color: "bg-orange-500" },
];

export default function TestCredentialsPage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCredentials = (email: string, password: string, index: number) => {
    navigator.clipboard.writeText(`Email: ${email}\nPassword: ${password}`);
    setCopiedIndex(index);
    toast.success("Credentials copied!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500 rounded-3xl shadow-lg mb-6">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Test Credentials</h1>
          <p className="text-slate-300 text-lg">Use these credentials to test different dashboards</p>
          <Link href="/login">
            <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700">Go to Login</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testAccounts.map((account, index) => (
            <Card key={index} className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-12 h-12 ${account.color} rounded-xl flex items-center justify-center`}>
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{account.role}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-slate-500 mt-1" />
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-sm font-mono font-semibold">{account.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Lock className="h-4 w-4 text-slate-500 mt-1" />
                    <div>
                      <p className="text-xs text-slate-500">Password</p>
                      <p className="text-sm font-mono font-semibold">{account.password}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-slate-500">Dashboard</p>
                    <p className="text-sm font-semibold text-emerald-600">{account.dashboard}</p>
                  </div>
                </div>
                <Button onClick={() => copyCredentials(account.email, account.password, index)} className="w-full" variant="outline">
                  {copiedIndex === index ? <><CheckCircle2 className="h-4 w-4 mr-2" />Copied!</> : <><Copy className="h-4 w-4 mr-2" />Copy</>}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
