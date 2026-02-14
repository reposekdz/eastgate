"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countries } from "@/lib/countries";
import { useAuthStore } from "@/lib/store/auth-store";
import {
  Eye,
  EyeOff,
  UserPlus,
  Loader2,
  CheckCircle2,
  XCircle,
  Globe,
  Phone,
  Mail,
  User,
  Lock,
  Shield,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const { registerGuestAccount } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("RW");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nationality, setNationality] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Country search
  const [countrySearch, setCountrySearch] = useState("");

  const selectedCountry = countries.find((c) => c.code === countryCode);
  const dialCode = selectedCountry?.dialCode || "+250";

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return countries;
    const q = countrySearch.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.includes(q)
    );
  }, [countrySearch]);

  // Password strength
  const passwordStrength = useMemo(() => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
    score = Object.values(checks).filter(Boolean).length;
    return { score, checks };
  }, [password]);

  const getStrengthLabel = (score: number) => {
    if (score <= 1) return { label: "Very Weak", color: "bg-red-500" };
    if (score === 2) return { label: "Weak", color: "bg-orange-500" };
    if (score === 3) return { label: "Fair", color: "bg-yellow-500" };
    if (score === 4) return { label: "Strong", color: "bg-emerald" };
    return { label: "Very Strong", color: "bg-green-600" };
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!email || !isEmailValid) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!phoneNumber.trim()) {
      toast.error("Please enter your phone number.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (!passwordsMatch) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!agreedTerms) {
      toast.error("Please agree to the Terms of Service.");
      return;
    }

    setLoading(true);
    try {
      const result = await registerGuestAccount({
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim(),
        phone: `${dialCode} ${phoneNumber.trim()}`,
        password,
        nationality: nationality || selectedCountry?.name || "Unknown",
      });

      if (result.success) {
        toast.success("Account created successfully! Welcome to EastGate Hotel.");
        router.push("/");
      } else {
        toast.error(result.error || "Registration failed. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg">
      {/* Mobile Brand */}
      <div className="lg:hidden text-center mb-6">
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
            <div className="flex justify-center mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-gradient-to-br from-gold to-gold-dark text-charcoal shadow-lg">
                <UserPlus className="h-6 w-6" />
              </div>
            </div>
            <h1 className="heading-sm text-charcoal">Create Your Account</h1>
            <p className="body-sm text-text-muted-custom mt-1">
              Join EastGate Hotel — book rooms, order food & enjoy exclusive perks
            </p>
          </div>

          {/* Guest benefits */}
          <div className="bg-gradient-to-r from-emerald/5 to-gold/5 rounded-lg p-3 mb-6 border border-emerald/10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-gold" />
              <span className="text-xs font-semibold text-charcoal">Guest Account Benefits</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-text-muted-custom">
              <span>✓ Book rooms online</span>
              <span>✓ Order food in-app</span>
              <span>✓ Track reservations</span>
              <span>✓ Loyalty rewards</span>
              <span>✓ Special promotions</span>
              <span>✓ Digital receipts</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="h-3 w-3 text-emerald" />
                  First Name *
                </label>
                <Input
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-10 text-sm rounded-[6px]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5 block">
                  Last Name *
                </label>
                <Input
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-10 text-sm rounded-[6px]"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-emerald" />
                Email Address *
              </label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "h-10 text-sm rounded-[6px] pr-8",
                    email && (isEmailValid ? "border-emerald" : "border-red-400")
                  )}
                />
                {email && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    {isEmailValid ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Country / Nationality */}
            <div>
              <label className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-emerald" />
                Country / Nationality *
              </label>
              <Select value={countryCode} onValueChange={(v) => { setCountryCode(v); const c = countries.find(ct => ct.code === v); if (c) setNationality(c.name); }}>
                <SelectTrigger className="h-10 text-sm rounded-[6px]">
                  <SelectValue placeholder="Select country">
                    {selectedCountry && (
                      <span className="flex items-center gap-2">
                        <span>{selectedCountry.flag}</span>
                        <span>{selectedCountry.name}</span>
                        <span className="text-text-muted-custom text-xs">({selectedCountry.dialCode})</span>
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search countries..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <ScrollArea className="h-60">
                    {filteredCountries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <span className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span>{country.name}</span>
                          <span className="text-text-muted-custom text-xs ml-auto">{country.dialCode}</span>
                        </span>
                      </SelectItem>
                    ))}
                    {filteredCountries.length === 0 && (
                      <div className="py-4 text-center text-xs text-text-muted-custom">No countries found</div>
                    )}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-emerald" />
                Phone Number *
              </label>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 h-10 bg-pearl border rounded-[6px] text-sm font-medium text-charcoal shrink-0 min-w-[90px]">
                  <span>{selectedCountry?.flag}</span>
                  <span className="text-xs">{dialCode}</span>
                </div>
                <Input
                  type="tel"
                  placeholder="788 000 000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9\s-]/g, ""))}
                  className="h-10 text-sm rounded-[6px] flex-1"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-emerald" />
                Password *
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
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

              {/* Strength meter */}
              {password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors",
                          i <= passwordStrength.score
                            ? getStrengthLabel(passwordStrength.score).color
                            : "bg-gray-200"
                        )}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-text-muted-custom">
                      {getStrengthLabel(passwordStrength.score).label}
                    </span>
                    <div className="flex gap-2 text-[10px]">
                      <span className={passwordStrength.checks.length ? "text-emerald" : "text-text-muted-custom"}>8+ chars</span>
                      <span className={passwordStrength.checks.uppercase ? "text-emerald" : "text-text-muted-custom"}>A-Z</span>
                      <span className={passwordStrength.checks.number ? "text-emerald" : "text-text-muted-custom"}>0-9</span>
                      <span className={passwordStrength.checks.special ? "text-emerald" : "text-text-muted-custom"}>!@#</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5 block">
                Confirm Password *
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "h-10 text-sm rounded-[6px] pr-10",
                    confirmPassword && (passwordsMatch ? "border-emerald" : "border-red-400")
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-custom hover:text-charcoal"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-[11px] text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={agreedTerms}
                onCheckedChange={(checked) => setAgreedTerms(checked === true)}
                className="rounded-[4px] mt-0.5"
              />
              <label htmlFor="terms" className="text-xs text-slate-custom leading-relaxed cursor-pointer">
                I agree to the{" "}
                <Link href="#" className="text-emerald font-semibold">Terms of Service</Link> and{" "}
                <Link href="#" className="text-emerald font-semibold">Privacy Policy</Link>
              </label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || !agreedTerms}
              className="w-full h-11 bg-gold hover:bg-gold-dark text-charcoal font-semibold rounded-[6px] uppercase tracking-wider text-sm transition-all hover:shadow-[0_0_20px_rgba(200,169,81,0.3)] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          <Separator className="my-5" />

          {/* Staff notice */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
            <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700">
              <strong>Staff accounts</strong> (admin, manager, receptionist, waiter) are pre-configured by the manager. Staff should use the{" "}
              <Link href="/login" className="text-emerald font-semibold">Sign In</Link> page with their assigned credentials.
            </p>
          </div>

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
