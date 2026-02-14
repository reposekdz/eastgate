"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/store/auth-store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ShieldCheck,
  Mail,
  Lock,
  Building2,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
  const [showHelp, setShowHelp] = useState(false);

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
        
        // Redirect based on role
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal via-surface-dark to-charcoal flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(200,169,81,0.4) 2%, transparent 0%), 
                           radial-gradient(circle at 75px 75px, rgba(11,110,79,0.4) 2%, transparent 0%)`,
          backgroundSize: "100px 100px",
        }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Back Button */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block mb-4">
            <Image
              src="/eastgatelogo.png"
              alt="EastGate Hotel"
              width={200}
              height={50}
              className="h-12 w-auto object-contain mx-auto"
            />
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-emerald to-emerald-dark flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-heading text-white mb-2">
                Staff Login
              </CardTitle>
              <CardDescription className="text-white/60">
                Access your EastGate Hotel staff dashboard
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Branch Selection */}
                <div className="space-y-2">
                  <Label htmlFor="branch" className="text-white/80 flex items-center gap-2">
                    <Building2 size={16} />
                    Branch
                  </Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white h-12">
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
                  <Label htmlFor="email" className="text-white/80 flex items-center gap-2">
                    <Mail size={16} />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@eastgate.rw"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12"
                    disabled={loading}
                  />
                </div>

                {/* Password / Access Code */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80 flex items-center gap-2">
                    <Lock size={16} />
                    Access Code
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your access code"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 pr-12"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 text-white/60 hover:text-white hover:bg-white/10"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>

                {/* Help Notice */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-blue-300">
                    <p className="font-semibold mb-1">For Staff Only</p>
                    <p>Contact your branch manager if you don&apos;t have your credentials.</p>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald to-emerald-dark hover:from-emerald-dark hover:to-emerald text-white h-12 font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In to Dashboard"
                  )}
                </Button>
              </form>

              {/* Help Toggle */}
              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-white/60 hover:text-white text-sm"
                >
                  {showHelp ? "Hide" : "Show"} Admin Test Credentials
                </Button>
              </div>

              {/* Test Credentials */}
              {showHelp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 space-y-3 overflow-hidden"
                >
                  <p className="text-xs text-yellow-300 font-semibold mb-2">Test Credentials (Development Only)</p>
                  
                  <div className="space-y-2 text-xs">
                    <div className="bg-black/20 rounded p-2">
                      <p className="text-yellow-400 font-semibold">Super Admin:</p>
                      <p className="text-white/80">Email: eastgate@hgmail.com</p>
                      <p className="text-white/80">Code: 2026</p>
                      <p className="text-white/60 text-[10px] mt-1">Access: All branches, full control</p>
                    </div>

                    <div className="bg-black/20 rounded p-2">
                      <p className="text-blue-400 font-semibold">Manager (Kigali Main):</p>
                      <p className="text-white/80">Email: jp@eastgate.rw</p>
                      <p className="text-white/80">Code: jp123</p>
                    </div>

                    <div className="bg-black/20 rounded p-2">
                      <p className="text-green-400 font-semibold">Receptionist (Kigali Main):</p>
                      <p className="text-white/80">Email: grace@eastgate.rw</p>
                      <p className="text-white/80">Code: grace123</p>
                    </div>

                    <div className="bg-black/20 rounded p-2">
                      <p className="text-purple-400 font-semibold">Waiter (Kigali Main):</p>
                      <p className="text-white/80">Email: patrick@eastgate.rw</p>
                      <p className="text-white/80">Code: patrick123</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Guest Login Link */}
        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm mb-2">Not a staff member?</p>
          <Link
            href="/login"
            className="text-gold hover:text-gold-light transition-colors text-sm font-semibold"
          >
            Guest Login / Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
