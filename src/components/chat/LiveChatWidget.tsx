"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Sparkles,
} from "lucide-react";

interface ChatMsg {
  id: string;
  sender: "guest" | "bot";
  name: string;
  avatar: string;
  message: string;
  time: string;
}

const AUTO_REPLIES: Record<string, string> = {
  room: "We have several room types available: Standard (RWF 234,000/night), Deluxe (RWF 325,000/night), Executive Suite (RWF 585,000/night), and Presidential Suite (RWF 1,105,000/night). Would you like to make a reservation?",
  book: "You can book directly through our website at /book or call us at +250 788 123 456. We'd be happy to assist!",
  restaurant: "Our restaurant features authentic Rwandan cuisine and international dishes. The restaurant is open from 6:30 AM to 10:30 PM. You can also view our menu at /menu.",
  spa: "Our spa offers traditional Rwandan treatments, massages, facials, and wellness packages. Open from 8 AM to 8 PM. Book at /spa.",
  event: "We host weddings, corporate events, conferences, and private dining. Our event halls can accommodate up to 500 guests. Contact us at events@eastgate.rw.",
  price: "Our room rates start from RWF 234,000/night for Standard rooms. We also offer special packages and seasonal discounts. Would you like details?",
  wifi: "Complimentary high-speed WiFi is available throughout the hotel for all guests.",
  pool: "Yes! We have an outdoor infinity pool with stunning views, open from 7 AM to 9 PM daily.",
  checkout: "Standard checkout time is 11:00 AM. Late checkout until 2:00 PM can be arranged at the front desk subject to availability.",
  parking: "Complimentary valet parking is available for all hotel guests. We also have a secure underground parking garage.",
};

const GREETING: ChatMsg = {
  id: "greeting",
  sender: "bot",
  name: "EastGate Concierge",
  avatar: "https://i.pravatar.cc/40?u=eastgate-bot",
  message: "Muraho! 👋 Welcome to EastGate Hotel Rwanda. How can I help you today? Ask about rooms, dining, spa, events, or anything else!",
  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

function getAutoReply(message: string): string {
  const lower = message.toLowerCase();
  for (const [keyword, reply] of Object.entries(AUTO_REPLIES)) {
    if (lower.includes(keyword)) return reply;
  }
  return "Thank you for your message! Our team will get back to you shortly. For immediate assistance, please call +250 788 123 456. In the meantime, feel free to ask about our rooms, restaurant, spa, or events!";
}

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMsg = {
      id: `user-${Date.now()}`,
      sender: "guest",
      name: "You",
      avatar: "",
      message: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const userText = input.trim();
    setInput("");
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botMsg: ChatMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        name: "EastGate Concierge",
        avatar: "https://i.pravatar.cc/40?u=eastgate-bot",
        message: getAutoReply(userText),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
      if (!isOpen || isMinimized) {
        setUnread((prev) => prev + 1);
      }
    }, 1200 + Math.random() * 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnread(0);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={handleOpen}
              className="h-14 w-14 rounded-full bg-emerald hover:bg-emerald-dark text-white shadow-xl hover:shadow-2xl transition-all duration-300 p-0 relative"
            >
              <MessageCircle className="h-6 w-6" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gold text-charcoal text-[10px] font-bold flex items-center justify-center">
                  {unread}
                </span>
              )}
            </Button>
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-emerald/30 animate-ping pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? "auto" : undefined,
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] rounded-2xl shadow-2xl overflow-hidden border border-emerald/20 bg-white flex flex-col"
            style={{ maxHeight: isMinimized ? "auto" : "min(600px, calc(100vh - 100px))" }}
          >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-emerald to-emerald-dark px-4 py-3 text-white shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border-2 border-white/20">
                    <AvatarImage src="https://i.pravatar.cc/40?u=eastgate-bot" alt="Concierge" />
                    <AvatarFallback className="bg-gold text-charcoal text-xs">EG</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">EastGate Concierge</p>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      <span className="text-[10px] text-white/80">Online • Typically replies instantly</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-white/80 hover:text-white hover:bg-white/10"
                    onClick={() => setIsMinimized(!isMinimized)}
                  >
                    <Minimize2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-white/80 hover:text-white hover:bg-white/10"
                    onClick={handleClose}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat Body */}
            {!isMinimized && (
              <>
                <ScrollArea className="flex-1 px-4">
                  <div className="py-4 space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2.5 ${msg.sender === "guest" ? "flex-row-reverse" : ""}`}
                      >
                        {msg.sender === "bot" && (
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarImage src={msg.avatar} alt={msg.name} />
                            <AvatarFallback className="text-[9px] bg-emerald text-white">EG</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`max-w-[75%] ${msg.sender === "guest" ? "text-right" : ""}`}>
                          <div
                            className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                              msg.sender === "guest"
                                ? "bg-emerald text-white rounded-br-sm"
                                : "bg-pearl/80 text-charcoal rounded-bl-sm"
                            }`}
                          >
                            {msg.message}
                          </div>
                          <span className="text-[10px] text-text-muted-custom mt-1 inline-block">{msg.time}</span>
                        </div>
                      </div>
                    ))}

                    {/* Typing indicator */}
                    {isTyping && (
                      <div className="flex gap-2.5">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src="https://i.pravatar.cc/40?u=eastgate-bot" alt="Concierge" />
                          <AvatarFallback className="text-[9px] bg-emerald text-white">EG</AvatarFallback>
                        </Avatar>
                        <div className="bg-pearl/80 rounded-2xl rounded-bl-sm px-4 py-3">
                          <div className="flex gap-1">
                            <span className="h-2 w-2 rounded-full bg-text-muted-custom/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="h-2 w-2 rounded-full bg-text-muted-custom/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="h-2 w-2 rounded-full bg-text-muted-custom/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>

                {/* Quick Actions */}
                <div className="px-4 pb-2 shrink-0">
                  <div className="flex gap-1.5 flex-wrap">
                    {["Room availability?", "Restaurant hours?", "Book a spa"].map((q) => (
                      <button
                        key={q}
                        className="text-[11px] px-2.5 py-1 rounded-full border border-emerald/20 text-emerald hover:bg-emerald/5 transition-colors"
                        onClick={() => {
                          setInput(q);
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input */}
                <div className="border-t px-4 py-3 shrink-0">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 border-emerald/20 focus-visible:ring-emerald/30 text-sm"
                    />
                    <Button
                      onClick={handleSend}
                      className="bg-emerald hover:bg-emerald-dark text-white h-9 w-9 p-0"
                      disabled={!input.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-text-muted-custom text-center mt-2">
                    <Sparkles className="h-3 w-3 inline mr-0.5" />
                    Powered by EastGate AI Concierge
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
