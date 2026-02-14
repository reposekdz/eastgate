"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { branches } from "@/lib/mock-data";
import { useAuthStore, getStaffCredentials } from "@/lib/store/auth-store";
import { useI18n } from "@/lib/i18n/context";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  Lock,
  Info,
  Users,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function LoginPageContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [branchId, setBranchId] = useState("br-001");
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState<"staff" | "guest">("staff");
  const [showCredentials, setShowCredentials] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const { login } = useAuthStore();
  const { t, isRw } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");
  const authError = searchParams.get("error");

  const staffCreds = getStaffCredentials();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error(t("auth", "loginFieldsError"));
      return;
    }

    setLoading(true);
    try {
      const success = await login(email, password, branchId);

      if (success) {
        toast.success(t("auth", "loginSuccess"));
        const { user } = useAuthStore.getState();

        if (redirectPath) {
          router.push(redirectPath);
        } else if (user?.role === "guest") {
          router.push("/");
        } else if (user?.role === "super_admin" || user?.role === "super_manager" || user?.role === "accountant" || user?.role === "event_manager") {
          router.push("/admin");
        } else if (user?.role === "branch_manager") {
          router.push("/manager");
        } else if (user?.role === "receptionist") {
          router.push("/receptionist");
        } else if (user?.role === "waiter" || user?.role === "restaurant_staff") {
          router.push("/waiter");
        } else {
          router.push("/admin");
        }
      } else {
        toast.error(t("auth", "loginError"));
      }
    } catch {
      toast.error(t("auth", "genericError"));
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
      super_admin: "bg-red-100 text-red-700",
      super_manager: "bg-purple-100 text-purple-700",
      branch_manager: "bg-blue-100 text-blue-700",
      receptionist: "bg-emerald-100 text-emerald-700",
      waiter: "bg-orange-100 text-orange-700",
      accountant: "bg-yellow-100 text-yellow-700",
    };
    return colors[role] || "bg-gray-100 text-gray-700";
  };

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
        <CardContent className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-emerald text-white shadow-lg">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
            <h1 className="heading-sm text-charcoal">{t("auth", "welcomeBack")}</h1>
            <p className="body-sm text-text-muted-custom mt-1">
              {t("auth", "signInSubtitle")}
            </p>
            {authError === "insufficient_permissions" && (
              <p className="text-xs text-destructive mt-2 font-medium bg-destructive/10 rounded-md px-3 py-1.5">
                {t("auth", "insufficientPermissions")}
              </p>
            )}
            {redirectPath && !authError && (
              <p className="text-xs text-emerald mt-2 font-medium bg-emerald/10 rounded-md px-3 py-1.5">
                {t("auth", "pleaseSignIn")}
              </p>
            )}
          </div>

          {/* Login Type Tabs */}
          <Tabs value={loginType} onValueChange={(v) => setLoginType(v as "staff" | "guest")} className="mb-5">
            <TabsList className="grid w-full grid-cols-2 h-10">
              <TabsTrigger value="staff" className="gap-1.5 text-xs">
                <ShieldCheck className="h-3.5 w-3.5" />
                Staff Login
              </TabsTrigger>
              <TabsTrigger value="guest" className="gap-1.5 text-xs">
                <Users className="h-3.5 w-3.5" />
                Guest Login
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Branch - only for staff */}
            {loginType === "staff" && (
              <div>
                <label className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5 block">
                  {t("auth", "branch")}
                </label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger className="h-10 text-sm rounded-[6px]">
                    <SelectValue placeholder={t("auth", "selectBranch")} />
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
            )}

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5 block">
                {t("auth", "emailAddress")}
              </label>
              <Input
                type="email"
                placeholder={loginType === "staff" ? "eastgate@hmail.com" : "you@example.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 text-sm rounded-[6px]"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-charcoal uppercase tracking-wider">
                  {t("auth", "password")}
                </label>
                <Link href="#" className="text-xs text-emerald hover:text-emerald-dark font-medium">
                  {t("auth", "forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={loginType === "staff" ? "2026" : t("auth", "enterPassword")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                {t("auth", "rememberMe")}
              </label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-emerald hover:bg-emerald-dark text-white font-semibold rounded-[6px] uppercase tracking-wider text-sm transition-all hover:shadow-[0_0_20px_rgba(11,110,79,0.3)]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("auth", "signingIn")}
                </>
              ) : (
                t("auth", "signIn")
              )}
            </Button>
          </form>

          <Separator className="my-5" />

          {/* Staff Credentials Reference */}
          {loginType === "staff" && (
            <div className="mb-4">
              <button
                onClick={() => setShowCredentials(!showCredentials)}
                className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-emerald/5 to-gold/5 border border-emerald/20 rounded-lg hover:bg-emerald/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-emerald" />
                  <span className="text-xs font-semibold text-charcoal">Staff Credentials (Demo)</span>
                </div>
                {showCredentials ? (
                  <ChevronUp className="h-4 w-4 text-text-muted-custom" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-text-muted-custom" />
                )}
              </button>

              {showCredentials && (
                <ScrollArea className="mt-2 max-h-64 border rounded-lg">
                  <div className="space-y-0.5 p-2">
                    {staffCreds.map((cred, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-pearl/80 transition-colors cursor-pointer group"
                        onClick={() => fillCredential(cred)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-charcoal truncate">{cred.name}</span>
                            <Badge className={cn("text-[9px] px-1.5 py-0", getRoleBadge(cred.role))}>
                              {cred.role.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-text-muted-custom">
                            <span className="font-mono">{cred.email}</span>
                            <span>•</span>
                            <span className="font-mono">{cred.password}</span>
                            <span>•</span>
                            <span>{cred.branchName}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); copyCredential(`${cred.email} / ${cred.password}`, idx); }}
                            className="h-6 w-6 rounded bg-pearl flex items-center justify-center hover:bg-gray-200"
                          >
                            {copiedIdx === idx ? <Check className="h-3 w-3 text-emerald" /> : <Copy className="h-3 w-3 text-text-muted-custom" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {/* Staff Notice */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
            <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              {loginType === "staff"
                ? "Staff credentials are assigned by the manager. Contact your branch manager if you don't have access."
                : "Guest accounts can book rooms, order food, and access loyalty rewards."
              }
            </p>
          </div>

          <p className="text-center text-xs text-text-muted-custom">
            {loginType === "guest" ? (
              <>
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-emerald font-semibold hover:text-emerald-dark">
                  Create Account
                </Link>
              </>
            ) : (
              <>
                {t("auth", "guestAccount")}{" "}
                <Link href="/register" className="text-emerald font-semibold hover:text-emerald-dark">
                  {t("auth", "createAccount")}
                </Link>
              </>
            )}
          </p>
        </CardContent>
      </Card>

      <p className="text-center text-[11px] text-text-muted-custom/60 mt-6">
        &copy; 2026 EastGate Hotel Rwanda. {t("auth", "secureEnterprise")}
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-emerald border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-text-muted-custom">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
