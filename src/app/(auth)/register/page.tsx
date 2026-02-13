"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, UserPlus } from "lucide-react";

export default function RegisterPage() {
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
              <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-gold text-charcoal">
                <UserPlus className="h-6 w-6" />
              </div>
            </div>
            <h1 className="heading-sm text-charcoal">Create Account</h1>
            <p className="body-sm text-text-muted-custom mt-1">
              Join the EastGate loyalty program
            </p>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5 block">
                  First Name
                </label>
                <Input placeholder="John" className="h-10 text-sm rounded-[6px]" />
              </div>
              <div>
                <label className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5 block">
                  Last Name
                </label>
                <Input placeholder="Doe" className="h-10 text-sm rounded-[6px]" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5 block">
                Email Address
              </label>
              <Input type="email" placeholder="you@example.com" className="h-10 text-sm rounded-[6px]" />
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5 block">
                Phone Number
              </label>
              <Input type="tel" placeholder="+250 7XX XXX XXX" className="h-10 text-sm rounded-[6px]" />
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
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

            {/* Terms */}
            <div className="flex items-start gap-2">
              <Checkbox id="terms" className="rounded-[4px] mt-0.5" />
              <label htmlFor="terms" className="text-xs text-slate-custom leading-relaxed cursor-pointer">
                I agree to the{" "}
                <Link href="#" className="text-emerald font-semibold">Terms of Service</Link> and{" "}
                <Link href="#" className="text-emerald font-semibold">Privacy Policy</Link>
              </label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-10 bg-gold hover:bg-gold-dark text-charcoal font-semibold rounded-[6px] uppercase tracking-wider text-sm transition-all hover:shadow-[0_0_20px_rgba(200,169,81,0.3)]"
            >
              Create Account
            </Button>
          </form>

          <Separator className="my-6" />

          <p className="text-center text-xs text-text-muted-custom">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald font-semibold hover:text-emerald-dark">
              Sign in
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
