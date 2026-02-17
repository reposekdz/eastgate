"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    Clock,
    ClipboardCheck,
    MessageSquare,
    TrendingUp,
    PlusCircle,
    CheckCircle2,
    X,
    Zap
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export function StaffToolbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeAction, setActiveAction] = useState<string | null>(null);

    const actions = [
        { id: "clock", icon: Clock, label: "Shift Log", color: "text-blue-500", bg: "bg-blue-50" },
        { id: "report", icon: PlusCircle, label: "New Task", color: "text-emerald-500", bg: "bg-emerald-50" },
        { id: "messages", icon: MessageSquare, label: "Messages", color: "text-purple-500", bg: "bg-purple-50" },
        { id: "performance", icon: TrendingUp, label: "My Stats", color: "text-orange-500", bg: "bg-orange-50" },
    ];

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="mb-4 space-y-2 flex flex-col items-end"
                    >
                        {actions.map((action) => (
                            <motion.div
                                key={action.id}
                                whileHover={{ x: -5 }}
                                className="flex items-center gap-3"
                            >
                                <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-lg border border-slate-200">
                                    <span className="text-xs font-semibold text-slate-700">{action.label}</span>
                                </div>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className={`h-12 w-12 rounded-2xl shadow-xl transition-all hover:scale-110 ${action.bg} border-none`}
                                    onClick={() => {
                                        toast.info(`Opening ${action.label}...`);
                                    }}
                                >
                                    <action.icon className={`h-5 w-5 ${action.color}`} />
                                </Button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <Button
                size="icon"
                className={`h-14 w-14 rounded-2xl shadow-2xl transition-all duration-300 ${isOpen ? "bg-slate-900 rotate-90" : "bg-emerald shadow-emerald/30 hover:scale-105"
                    }`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="h-6 w-6 text-white" /> : <Zap className="h-6 w-6 text-white fill-white" />}
            </Button>
        </div>
    );
}
