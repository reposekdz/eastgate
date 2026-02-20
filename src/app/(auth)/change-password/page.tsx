"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Loader2, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";

export const dynamic = 'force-dynamic';

export default function ChangePasswordPage() {
    const router = useRouter();
    const sessionResult = useSession();
    const session = sessionResult?.data;
    const update = sessionResult?.update;
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const passwordStrength = {
        hasMinLength: newPassword.length >= 8,
        hasUpper: /[A-Z]/.test(newPassword),
        hasLower: /[a-z]/.test(newPassword),
        hasNumber: /[0-9]/.test(newPassword),
        hasSymbol: /[^A-Za-z0-9]/.test(newPassword),
    };

    const strengthCount = Object.values(passwordStrength).filter(Boolean).length;
    const strengthColor = strengthCount <= 2 ? "bg-red-500" : strengthCount <= 4 ? "bg-yellow-500" : "bg-green-500";
    const strengthText = strengthCount <= 2 ? "Weak" : strengthCount <= 4 ? "Moderate" : "Strong";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        if (strengthCount < 3) {
            toast.error("Please choose a stronger password");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            if (response.ok) {
                toast.success("Password updated successfully!");
                // Update session to reflect mustChangePassword = false
                await update();
                router.push("/dashboard");
            } else {
                const error = await response.text();
                toast.error(error || "Failed to update password");
            }
        } catch (error) {
            toast.error("An error occurred during password update");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl">
                    <CardHeader className="space-y-1 pb-6 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="bg-primary/10 p-3 rounded-2xl">
                                <ShieldCheck className="w-10 h-10 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Security Update Required</CardTitle>
                        <CardDescription className="text-base">
                            Please update your password to continue accessing the system.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <div className="relative">
                                    <Input
                                        id="current-password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="pl-10 h-12"
                                        required
                                    />
                                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="new-password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="pl-10 pr-10 h-12"
                                        required
                                    />
                                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>

                                {newPassword && (
                                    <div className="space-y-2 mt-2">
                                        <div className="flex justify-between items-center text-xs font-medium">
                                            <span className="text-slate-500">Strength: {strengthText}</span>
                                            <span className="text-slate-500">{strengthCount}/5</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                className={`h-full ${strengthColor}`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(strengthCount / 5) * 100}%` }}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                                            <Requirement met={passwordStrength.hasMinLength} text="Min 8 chars" />
                                            <Requirement met={passwordStrength.hasUpper} text="Uppercase" />
                                            <Requirement met={passwordStrength.hasLower} text="Lowercase" />
                                            <Requirement met={passwordStrength.hasNumber} text="Number" />
                                            <Requirement met={passwordStrength.hasSymbol} text="Symbol" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirm-password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10 h-12"
                                        required
                                    />
                                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-base font-semibold transition-all hover:translate-y-[-2px] active:translate-y-[0]"
                                disabled={loading || strengthCount < 3}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Updating Security...
                                    </>
                                ) : (
                                    "Update & Continue"
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-slate-100 flex items-start gap-3 bg-blue-50/50 p-4 rounded-xl text-blue-800">
                            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <p className="text-sm leading-relaxed">
                                For security reasons, your manager has required a password update for your account. This ensures your access remains protected.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

function Requirement({ met, text }: { met: boolean; text: string }) {
    return (
        <div className={`flex items-center gap-1.5 text-[10px] ${met ? "text-green-600 font-medium" : "text-slate-400"}`}>
            {met ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-1 h-1 rounded-full bg-slate-300 ml-1 mr-1" />}
            {text}
        </div>
    );
}
