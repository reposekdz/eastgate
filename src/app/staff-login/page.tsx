"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore, getStaffCredentials } from "@/lib/store/auth-store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ShieldCheck, Mail, Lock, Building2, Loader2, ArrowLeft, Eye, EyeOff,
  AlertCircle, ChevronDown, ChevronUp, Copy, Check, Sparkles, Shield
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

const branches = [
  { id: "all", name: "All Branches (Admin/Manager)" },
  { id: "br-001", name: "Kigali Main" },
  { id: "br-002", name: "Ngoma Branch" },
  { id: "br-003", name: "Kirehe Branch" },
  { id: "br-004", name: "Gatsibo Branch" },
];

export default function StaffLoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [branchId, setBranchId] = useState("all");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const staffCreds = getStaffCredentials();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    if (!password.trim()) {
      toast.error("Please enter your access code");
      return;
    }

    setLoading(true);

    try {
      const success = await login(email, password, branchId);

      if (success) {
        toast.success("Login successful! Redirecting...");
        
        const { user } = useAuthStore.getState();
        
        if (user) {
          switch (user.role) {
            case "super_admin":
              router.push("/admin");
              break;
            case "super_manager":
            case "branch_manager":
              router.push("/manager");
              break;
            case "receptionist":
              router.push("/receptionist");
              break;
            case "waiter":
              router.push("/waiter");
              break;
            case "accountant":
              router.push("/admin/finance");
              break;
            default:
              router.push("/");
          }
        }
      } else {
        toast.error("Invalid credentials or branch access");
      }
    } catch (error) {
      toast.error("An error occurred during login");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fillCredential = (cred: { email: string; password: string }) => {
    setEmail(cred.email);
    setPassword(cred.password);
    toast.success("Credentials filled — click Sign In");
  };

  const copyCredential = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: "bg-red-500/20 text-red-300 border-red-500/30",
      super_manager: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      branch_manager: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      receptionist: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      waiter: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      accountant: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    };
    return colors[role] || "bg-gray-500/20 text-gray-300 border-gray-500/30";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal via-surface-dark to-charcoal flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(200,169,81,0.4) 2%, transparent 0%), 
                           radial-gradient(circle at 75px 75px, rgba(11,110,79,0.4) 2%, transparent 0%)`,
          backgroundSize: "100px 100px",
        }} />
      </div>

      {/* Floating Orbs */}
      <motion.div
        className="absolute top-20 left-20 w-64 h-64 bg-emerald/20 rounded-full blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-80 h-80 bg-gold/20 rounded-full blur-3xl"
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <Link href="/" className="inline-block mb-4 group">
            <Image
              src="/eastgatelogo.png"
              alt="EastGate Hotel"
              width={200}
              height={50}
              className="h-16 w-auto object-contain mx-auto drop-shadow-2xl group-hover:scale-105 transition-transform"
            />
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald via-emerald-dark to-emerald flex items-center justify-center shadow-lg shadow-emerald/50 relative"
              >
                <ShieldCheck className="h-10 w-10 text-white" />
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-white/20"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <CardTitle className="text-3xl font-heading text-white mb-2 flex items-center justify-center gap-2">
                Staff Portal
                <Sparkles className="h-5 w-5 text-gold" />
              </CardTitle>
              <CardDescription className="text-white/70 text-base">
                Secure access to your EastGate dashboard
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Branch Selection */}
                <div className="space-y-2">
                  <Label htmlFor="branch" className="text-white/90 flex items-center gap-2 text-sm font-semibold">
                    <Building2 size={16} className="text-gold" />
                    Branch Location
                  </Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white h-12 hover:bg-white/15 transition-colors backdrop-blur-sm">
                      <SelectValue />
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
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/90 flex items-center gap-2 text-sm font-semibold">
                    <Mail size={16} className="text-gold" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@eastgate.rw"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 hover:bg-white/15 transition-colors backdrop-blur-sm focus:ring-2 focus:ring-emerald/50"
                    disabled={loading}
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/90 flex items-center gap-2 text-sm font-semibold">
                    <Lock size={16} className="text-gold" />
                    Access Code
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your secure code"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 pr-12 hover:bg-white/15 transition-colors backdrop-blur-sm focus:ring-2 focus:ring-emerald/50"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 text-white/60 hover:text-white hover:bg-white/10"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald via-emerald-dark to-emerald hover:from-emerald-dark hover:via-emerald hover:to-emerald-dark text-white h-12 font-bold text-base shadow-lg shadow-emerald/30 hover:shadow-emerald/50 transition-all hover:scale-[1.02]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-5 w-5" />
                      Sign In to Dashboard
                    </>
                  )}
                </Button>
              </form>

              {/* Staff Credentials */}
              <div>
                <button
                  onClick={() => setShowCredentials(!showCredentials)}
                  className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-gold/10 to-emerald/10 border border-gold/30 rounded-lg hover:bg-gold/20 transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-gold" />
                    <span className="text-sm font-semibold text-white">Demo Credentials</span>
                  </div>
                  {showCredentials ? (
                    <ChevronUp className="h-4 w-4 text-white/70 group-hover:text-white transition-colors" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-white/70 group-hover:text-white transition-colors" />
                  )}
                </button>

                <AnimatePresence>
                  {showCredentials && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ScrollArea className="mt-2 max-h-72 border border-white/10 rounded-lg bg-black/20 backdrop-blur-sm">
                        <div className="space-y-1 p-2">
                          {staffCreds.map((cred, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="flex items-center gap-2 p-3 rounded-lg hover:bg-white/10 transition-all cursor-pointer group border border-transparent hover:border-white/20"
                              onClick={() => fillCredential(cred)}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold text-white truncate">{cred.name}</span>
                                  <Badge className={cn("text-[10px] px-2 py-0.5 border", getRoleBadge(cred.role))}>
                                    {cred.role.replace(/_/g, " ")}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-white/60">
                                  <span className="font-mono">{cred.email}</span>
                                  <span>•</span>
                                  <span className="font-mono">{cred.password}</span>
                                </div>
                                <div className="text-[10px] text-white/40 mt-0.5">{cred.branchName}</div>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); copyCredential(`${cred.email} / ${cred.password}`, idx); }}
                                className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                {copiedIdx === idx ? <Check className="h-4 w-4 text-emerald" /> : <Copy className="h-4 w-4 text-white/70" />}
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      </ScrollArea>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Help Notice */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-300">
                  <p className="font-semibold mb-1">Staff Access Only</p>
                  <p className="text-blue-300/80">Contact your branch manager if you need credentials or have access issues.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Guest Login Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-white/60 text-sm mb-2">Not a staff member?</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors text-sm font-semibold group"
          >
            <span>Guest Login / Create Account</span>
            <ArrowLeft className="h-4 w-4 rotate-180 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-white/40 mt-6">
          © 2026 EastGate Hotel Rwanda. Secure Enterprise Portal.
        </p>
      </div>
    </div>
  );
}
