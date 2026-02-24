"use client";

export const dynamic = "force-dynamic";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/lib/store/auth-store";
import { Eye, EyeOff, Loader2, Lock, Mail, Building2 } from "lucide-react";
import { toast } from "sonner";

function LoginPageContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }

    setLoading(true);
    try {
      console.log("Attempting login...");
      const success = await login(email, password, "kigali-main");
      console.log("Login result:", success);

      if (success) {
        const { user } = useAuthStore.getState();
        console.log("User after login:", user);

        if (user) {
          toast.success("Welcome back!");
          const userRole = user.role.toUpperCase();
          console.log("User role:", userRole);

          if (redirectPath) {
            console.log("Redirecting to:", redirectPath);
            router.push(redirectPath);
          } else if (userRole === "SUPER_ADMIN" || userRole === "SUPER_MANAGER") {
            console.log("Redirecting to /admin");
            router.push("/admin");
          } else if (userRole === "BRANCH_MANAGER") {
            console.log("Redirecting to /manager");
            router.push("/manager");
          } else if (userRole === "RECEPTIONIST") {
            console.log("Redirecting to /receptionist");
            router.push("/receptionist");
          } else if (userRole === "KITCHEN_STAFF" || userRole === "CHEF") {
            console.log("Redirecting to /kitchen");
            router.push("/kitchen");
          } else if (userRole === "WAITER") {
            console.log("Redirecting to /waiter");
            router.push("/waiter");
          } else {
            console.log("Redirecting to /admin (default)");
            router.push("/admin");
          }
        } else {
          console.error("No user found after successful login");
          toast.error("Login error: No user data");
        }
      } else {
        console.log("Login failed");
        toast.error("Invalid email or password");
      }
    } catch (error) {
      console.error("Login exception:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/30 mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">EastGate Hotel</h1>
          <p className="text-slate-300 mt-2">Staff Management Portal</p>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-charcoal text-center mb-2">
              Welcome Back
            </h2>
            <p className="text-center text-slate-500 mb-6">
              Sign in to access your dashboard
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="text-sm font-semibold text-charcoal mb-2 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="your.email@eastgatehotel.rw"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-11 bg-slate-50 border-slate-200 rounded-lg text-base focus:border-emerald-500 focus:ring-emerald-500"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-semibold text-charcoal mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-11 pr-11 bg-slate-50 border-slate-200 rounded-lg text-base focus:border-emerald-500 focus:ring-emerald-500"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-500/25 text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Help Text */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-center text-sm text-slate-600">
                Need help accessing your account?
              </p>
              <p className="text-center text-sm text-slate-500 mt-1">
                Contact your system administrator
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-6">
          © 2026 EastGate Hotel Rwanda. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-emerald border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
