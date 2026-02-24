"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store/auth-store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ShieldCheck, Lock, Loader2, ArrowLeft, Eye, EyeOff,
  AlertCircle, Sparkles, Building2, User
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function StaffLoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    if (!password.trim()) {
      toast.error("Please enter your password");
      return;
    }

    setLoading(true);

    try {
      const success = await login(email, password, "kigali-main");

      if (success) {
        const { user } = useAuthStore.getState();

        if (user) {
          const role = user.role.toUpperCase();
          
          if (role === "SUPER_ADMIN" || role === "SUPER_MANAGER") {
            router.push("/admin");
          } else if (role === "BRANCH_MANAGER") {
            router.push("/manager");
          } else if (role === "RECEPTIONIST") {
            router.push("/receptionist");
          } else if (role === "WAITER") {
            router.push("/waiter");
          } else if (role === "KITCHEN_STAFF" || role === "CHEF") {
            router.push("/kitchen");
          } else {
            router.push("/");
          }
        }
      } else {
        toast.error("Invalid email or password");
      }
    } catch (error) {
      toast.error("Login failed. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal via-surface-dark to-charcoal flex flex-col">
      {/* Header with Logo */}
      <header className="w-full py-4 px-6 border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="relative">
              <Image
                src="/eastgatelogo.png"
                alt="EastGate Hotel"
                width={180}
                height={45}
                className="h-12 w-auto object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-heading font-bold text-white">EastGate Hotel</h1>
              <p className="text-xs text-gold">Luxury Hospitality Management</p>
            </div>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors">
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Animated Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25px 25px, rgba(200,169,81,0.4) 2%, transparent 0%), 
                               radial-gradient(circle at 75px 75px, rgba(11,110,79,0.4) 2%, transparent 0%)`,
              backgroundSize: "100px 100px",
            }} />
          </div>

          {/* Floating Orbs */}
          <motion.div
            className="absolute top-40 left-10 w-64 h-64 bg-emerald/20 rounded-full blur-3xl"
            animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-40 right-10 w-80 h-80 bg-gold/20 rounded-full blur-3xl"
            animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
                <CardHeader className="text-center pb-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="mx-auto mb-3 h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald via-emerald-dark to-emerald flex items-center justify-center shadow-lg shadow-emerald/50 relative"
                  >
                    <ShieldCheck className="h-8 w-8 text-white" />
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-white/20"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                  <CardTitle className="text-2xl font-heading text-white mb-1 flex items-center justify-center gap-2">
                    Staff Portal
                    <Sparkles className="h-4 w-4 text-gold" />
                  </CardTitle>
                  <CardDescription className="text-white/60 text-sm">
                    Sign in to access your dashboard
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-4">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/80 text-sm font-medium">
                        Email Address
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="staff@eastgatehotel.rw"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-emerald focus:ring-emerald"
                          required
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white/80 text-sm font-medium">
                        Access Code
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your access code"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-emerald focus:ring-emerald"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-emerald to-emerald-dark hover:from-emerald-dark hover:to-emerald text-white font-semibold py-6 rounded-lg transition-all duration-300 shadow-lg shadow-emerald/25"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Authenticating...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Sign In
                        </>
                      )}
                    </Button>

                    {/* Help Text */}
                    <p className="text-center text-white/40 text-xs mt-4">
                      Contact your administrator if you cannot access your account
                    </p>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
