"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { branches } from "@/lib/mock-data";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-md">
      {/* Mobile Brand */}
      <div className="lg:hidden text-center mb-8">
        <h2 className="heading-sm text-charcoal tracking-wider">
          East<span className="text-gold">Gate</span>
        </h2>
        <p className="text-xs text-text-muted-custom uppercase tracking-widest mt-1">
          Hotel Rwanda
        </p>
      </div>

      <Card className="py-0 border-transparent shadow-lg">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-emerald text-white">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
            <h1 className="heading-sm text-charcoal">Welcome Back</h1>
            <p className="body-sm text-text-muted-custom mt-1">
              Sign in to your management dashboard
            </p>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
            {/* Branch */}
            <div>
              <label className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5 block">
                Branch
              </label>
              <Select defaultValue="br-001">
                <SelectTrigger className="h-10 text-sm rounded-[6px]">
                  <SelectValue placeholder="Select your branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5 block">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="admin@eastgatehotel.rw"
                className="h-10 text-sm rounded-[6px]"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-charcoal uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="#"
                  className="text-xs text-emerald hover:text-emerald-dark font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="h-10 text-sm rounded-[6px] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-custom hover:text-charcoal"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember */}
            <div className="flex items-center gap-2">
              <Checkbox id="remember" className="rounded-[4px]" />
              <label htmlFor="remember" className="text-sm text-slate-custom cursor-pointer">
                Remember me
              </label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-10 bg-emerald hover:bg-emerald-dark text-white font-semibold rounded-[6px] uppercase tracking-wider text-sm transition-all hover:shadow-[0_0_20px_rgba(11,110,79,0.3)]"
              asChild
            >
              <Link href="/admin">Sign In</Link>
            </Button>
          </form>

          <Separator className="my-6" />

          <p className="text-center text-xs text-text-muted-custom">
            Guest account?{" "}
            <Link href="/register" className="text-emerald font-semibold hover:text-emerald-dark">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>

      <p className="text-center text-[11px] text-text-muted-custom/60 mt-6">
        &copy; 2026 EastGate Hotel Rwanda. Secure Enterprise Platform.
      </p>
    </div>
  );
}
