"use client";

import { useState } from "react";
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
import { branches } from "@/lib/mock-data";
import { useAuthStore } from "@/lib/store/auth-store";
import { useI18n } from "@/lib/i18n/context";
import { Eye, EyeOff, ShieldCheck, Loader2, Lock, Info } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [branchId, setBranchId] = useState("br-001");
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const { t, isRw } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");
  const authError = searchParams.get("error");

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

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Branch */}
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

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5 block">
                {t("auth", "emailAddress")}
              </label>
              <Input
                type="email"
                placeholder="eastgate@gmail.com"
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
                <Link
                  href="#"
                  className="text-xs text-emerald hover:text-emerald-dark font-medium"
                >
                  {t("auth", "forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth", "enterPassword")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 text-sm rounded-[6px] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-custom hover:text-charcoal"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember */}
            <div className="flex items-center gap-2">
              <Checkbox id="remember" className="rounded-[4px]" />
              <label
                htmlFor="remember"
                className="text-sm text-slate-custom cursor-pointer"
              >
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

          <Separator className="my-6" />

          {/* Staff Notice */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
            <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">{t("auth", "staffNotice")}</p>
          </div>

          <p className="text-center text-xs text-text-muted-custom">
            {t("auth", "guestAccount")}{" "}
            <Link
              href="/register"
              className="text-emerald font-semibold hover:text-emerald-dark"
            >
              {t("auth", "createAccount")}
            </Link>
          </p>
        </CardContent>
      </Card>

      <p className="text-center text-[11px] text-text-muted-custom/60 mt-6">
        &copy; 2026 EastGate Hotel Rwanda. {t("auth", "secureEnterprise")}
      </p>
    </div>
  );
}
