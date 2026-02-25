"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/lib/i18n/context";
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Sparkles,
  CheckCheck,
  Users,
  Globe,
} from "lucide-react";

interface ChatMsg {
  id: string;
  sender: "guest" | "staff";
  senderName: string;
  senderEmail?: string;
  message: string;
  createdAt: string;
  read: boolean;
  time: string;
}

interface ActiveUser {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  department: string;
  lastLogin: string;
}

export default function LiveChatWidget() {
  const { t, locale, isRw } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [guestEmail] = useState(`guest-${Date.now()}@eastgate.rw`);
  const [guestName] = useState(isRw ? "Umugenzi" : "Guest");
  const branchId = "br-001";

  // Fetch active users across all branches
  const fetchActiveUsers = async () => {
    try {
      const params = new URLSearchParams({ branchId, crossBranch: "true" });
      const response = await fetch(`/api/chat/active-users?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.activeUsers)) {
        setActiveUsers(data.activeUsers);
      }
    } catch (error) {
      console.error("Failed to fetch active users:", error);
    }
  };

  // Send message to real-time API
  const sendMessageToDB = async (message: string, sender: string = "guest") => {
    try {
      const response = await fetch("/api/chat/realtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender,
          senderName: guestName,
          senderEmail: guestEmail,
          message,
          branchId,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error("Failed to send message:", error);
      return false;
    }
  };

  // Fetch real-time messages
  const fetchMessages = async () => {
    try {
      const params = new URLSearchParams({ conversationId: guestEmail });
      const response = await fetch(`/api/chat/realtime?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.messages)) {
        const formattedMessages = data.messages.map((msg: any) => ({
          id: msg.id,
          sender: msg.sender,
          senderName: msg.senderName,
          senderEmail: msg.senderEmail,
          message: msg.message,
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          createdAt: msg.createdAt,
          read: msg.read,
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  // Real-time initialization
  useEffect(() => {
    fetchActiveUsers();
    fetchMessages();
    
    // Real-time polling every 2 seconds
    const interval = setInterval(() => {
      fetchActiveUsers();
      fetchMessages();
    }, 2000);

    return () => clearInterval(interval);
  }, [isRw]);

  // Initialize greeting if no messages
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: "greeting",
        sender: "staff",
        senderName: "EastGate Team",
        message: isRw
          ? "Muraho! 👋 Murakaze kuri EastGate Hotel Rwanda. Abakozi bacu bahari kugufasha. Baza ku byumba, ibiryo, spa, ibirori, cyangwa ikindi icyo ari cyo cyose!"
          : "Hello! 👋 Welcome to EastGate Hotel Rwanda. Our staff across all branches are here to help you. Ask about rooms, dining, spa, events, or anything else!",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        createdAt: new Date().toISOString(),
        read: true,
      }]);
    }
  }, [messages.length, isRw]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleQuickReply = async (value: string) => {
    const quickMessages: Record<string, string> = {
      rooms: isRw ? "Ndashaka ibyumba!" : "I'm interested in rooms!",
      restaurant: isRw ? "Ndashaka ibiryo!" : "I'd like to know about dining!",
      spa: isRw ? "Ndashaka spa!" : "Tell me about the spa!",
      events: isRw ? "Ndashaka ibirori!" : "I want to know about events!",
    };
    const message = quickMessages[value] || "";
    if (!message) return;

    const userMsg: ChatMsg = {
      id: `user-${Date.now()}`,
      sender: "guest",
      senderName: guestName,
      senderEmail: guestEmail,
      message: message,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAt: new Date().toISOString(),
      read: false,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Send to real-time API
    await sendMessageToDB(message);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMsg = {
      id: `user-${Date.now()}`,
      sender: "guest",
      senderName: guestName,
      senderEmail: guestEmail,
      message: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAt: new Date().toISOString(),
      read: false,
    };

    setMessages((prev) => [...prev, userMsg]);
    const userText = input.trim();
    setInput("");

    // Send to real-time API
    const success = await sendMessageToDB(userText);
    
    if (success) {
      // Mark as delivered
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => m.id === userMsg.id ? { ...m, read: true } : m)
        );
      }, 1000);
    }
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

  // Quick reply buttons
  const quickReplies = isRw ? [
    { label: "🛏️ Ibyumba", value: "rooms" },
    { label: "🍽️ Ibiryo", value: "restaurant" },
    { label: "💆 Spa", value: "spa" },
    { label: "📅 Ibirori", value: "events" },
  ] : [
    { label: "🛏️ Rooms", value: "rooms" },
    { label: "🍽️ Dining", value: "restaurant" },
    { label: "💆 Spa", value: "spa" },
    { label: "📅 Events", value: "events" },
  ];

  const quickActions = isRw
    ? ["Ibiciro by'ibyumba?", "Ibiryo bihari?", "Spa ifunguka ryari?", "Ibirori byacu?"]
    : ["Room prices?", "What food is available?", "Spa opening hours?", "Our events?"];

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50"
          >
            <Button
              onClick={handleOpen}
              className="h-auto rounded-full bg-emerald hover:bg-emerald-dark text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-5 py-3 gap-2 relative"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold text-sm">{t("chat", "chatBtn")}</span>
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gold text-charcoal text-[10px] font-bold flex items-center justify-center">
                  {unread}
                </span>
              )}
            </Button>
            <span className="absolute inset-0 rounded-full bg-emerald/30 animate-ping pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-Time Chat Window */}
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
            className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden border border-emerald/20 bg-white flex flex-col"
            style={{ maxHeight: isMinimized ? "auto" : "min(600px, calc(100vh - 140px))" }}
          >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-emerald to-emerald-dark px-4 py-3 text-white shrink-0 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border-2 border-white/20">
                    <AvatarImage src="https://i.pravatar.cc/40?u=eastgate-team" alt="Team" />
                    <AvatarFallback className="bg-gold text-charcoal text-xs">EG</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">EastGate Live Chat</p>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                      <Globe className="h-3 w-3" />
                      <span className="text-[10px] text-white/80">
                        {activeUsers.length} {isRw ? "abakozi bahari" : "staff online"} • {isRw ? "Gusubiza vuba" : "Quick response"}
                      </span>
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
                    {/* Date separator */}
                    <div className="flex items-center gap-3 justify-center">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-[10px] text-text-muted-custom font-medium px-2">
                        {t("common", "today")} • {isRw ? "Ukwezi" : "Real-time"}
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    {/* Quick Reply Buttons */}
                    {messages.length <= 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-wrap gap-2 justify-center"
                      >
                        {quickReplies.map((reply) => (
                          <Button
                            key={reply.value}
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickReply(reply.value)}
                            className="text-xs border-emerald/50 text-emerald hover:bg-emerald hover:text-white"
                          >
                            {reply.label}
                          </Button>
                        ))}
                      </motion.div>
                    )}

                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2.5 ${msg.sender === "guest" ? "flex-row-reverse" : ""}`}
                      >
                        {msg.sender === "staff" && (
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarImage src="https://i.pravatar.cc/40?u=eastgate-team" alt={msg.senderName} />
                            <AvatarFallback className="text-[9px] bg-emerald text-white">EG</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`max-w-[75%] ${msg.sender === "guest" ? "text-right" : ""}`}>
                          <div
                            className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${msg.sender === "guest"
                              ? "bg-emerald text-white rounded-br-sm"
                              : "bg-pearl/80 text-charcoal rounded-bl-sm"
                              }`}
                          >
                            {msg.message}
                          </div>
                          <div className={`flex items-center gap-1 mt-1 ${msg.sender === "guest" ? "justify-end" : ""}`}>
                            <span className="text-[10px] text-text-muted-custom">{msg.time}</span>
                            {msg.sender === "guest" && (
                              <CheckCheck className={`h-3 w-3 ${msg.read ? "text-emerald" : "text-text-muted-custom/50"}`} />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Active Staff Indicator */}
                    {activeUsers.length > 0 && (
                      <div className="flex items-center gap-2 justify-center py-2">
                        <Users className="h-3 w-3 text-emerald" />
                        <span className="text-[10px] text-emerald font-medium">
                          {activeUsers.length} {isRw ? "abakozi bahari" : "staff online"} - 
                          {activeUsers.slice(0, 3).map(u => u.name.split(' ')[0]).join(', ')}
                          {activeUsers.length > 3 && ` +${activeUsers.length - 3}`}
                        </span>
                      </div>
                    )}

                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>

                {/* Quick Actions */}
                <div className="px-4 pb-2 shrink-0">
                  <div className="flex gap-1.5 flex-wrap">
                    {quickActions.map((q) => (
                      <button
                        key={q}
                        className="text-[11px] px-2.5 py-1 rounded-full border border-emerald/20 text-emerald hover:bg-emerald/5 transition-colors"
                        onClick={() => setInput(q)}
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
                      placeholder={isRw ? "Andika ubutumwa..." : "Type your message..."}
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
                    {isRw ? "Ukwezi • Abakozi b'ukuri" : "Real-time • Live staff"}
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