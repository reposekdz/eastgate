"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/lib/i18n/context";
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Sparkles,
  CheckCheck,
  Mic,
  Paperclip,
  Phone,
  Video,
} from "lucide-react";

interface ChatMsg {
  id: string;
  sender: "guest" | "bot";
  name: string;
  avatar: string;
  message: string;
  time: string;
  status?: "sent" | "delivered" | "seen";
}

const AUTO_REPLIES_EN: Record<string, string> = {
  room: "We have several room types available: Standard (RWF 234,000/night), Deluxe (RWF 325,000/night), Executive Suite (RWF 585,000/night), and Presidential Suite (RWF 1,105,000/night). Would you like to make a reservation?",
  book: "You can book directly through our website at /book or call us at +250 788 123 456. We'd be happy to assist!",
  restaurant: "Our restaurant features authentic Rwandan cuisine and international dishes. The restaurant is open from 6:30 AM to 10:30 PM. You can also view our menu at /menu.",
  menu: "Check out our full menu at /menu! We have Hot Starters, Beef, Chicken, Fish, Pasta, BBQ, Desserts, and a wide selection of beverages.",
  spa: "Our spa offers traditional Rwandan treatments, massages, facials, and wellness packages. Open from 8 AM to 8 PM. Book at /spa.",
  event: "We host weddings, corporate events, conferences, and private dining. Our event halls can accommodate up to 500 guests. Contact us at events@eastgate.rw.",
  price: "Our room rates start from RWF 234,000/night for Standard rooms. We also offer special packages and seasonal discounts. Would you like details?",
  wifi: "Complimentary high-speed WiFi is available throughout the hotel for all guests.",
  pool: "Yes! We have an outdoor infinity pool with stunning views, open from 7 AM to 9 PM daily.",
  checkout: "Standard checkout time is 11:00 AM. Late checkout until 2:00 PM can be arranged at the front desk subject to availability.",
  parking: "Complimentary valet parking is available for all hotel guests. We also have a secure underground parking garage.",
  hello: "Hello! 😊 How can I assist you today? Feel free to ask about rooms, dining, spa services, or anything else!",
  hi: "Hi there! 😊 Welcome to EastGate Hotel. How may I help you?",
  thank: "You're welcome! If you need anything else, don't hesitate to ask. We're here to make your stay perfect! 🌟",
  order: "You can place food orders directly from our menu! Go to /menu or click the 'Order Food' button in the navigation bar to browse and order.",
  breakfast: "Our breakfast buffet is served daily from 6:30 AM to 10:00 AM in the main restaurant. It includes both Rwandan and international options.",
  dinner: "Dinner service runs from 6:30 PM to 10:30 PM. We recommend reservations for the best experience.",
};

const AUTO_REPLIES_RW: Record<string, string> = {
  icyumba: "Dufite ubwoko bwinshi bw'ibyumba: Icyumba Gisanzwe (RWF 234,000/ijoro), Icyumba Cyiza (RWF 325,000/ijoro), Suite y'Umuyobozi (RWF 585,000/ijoro), na Suite ya Perezida (RWF 1,105,000/ijoro). Mushaka gufata icyumba?",
  gufata: "Mushobora gufata ku rubuga rwacu /book cyangwa muhamagare kuri +250 788 123 456. Tuzabafasha dushimishijwe!",
  ibiryo: "Iresitora yacu itanga ibiryo by'u Rwanda n'iby'isi yose. Ifunguka kuva saa 12:30 kugeza saa 4:30. Mushobora kureba menu kuri /menu.",
  menu: "Reba menu yacu yose kuri /menu! Dufite ibitangura byoshye, inyama, inkoko, ifi, pasta, BBQ, ibinywabura, n'ibinyobwa bitandukanye.",
  spa: "Spa yacu itanga imiti y'u Rwanda, gukanda, gutera mu maso, n'ibicuruzwa by'ubuzima. Ifunguka kuva saa 2 kugeza saa 2 z'ijoro.",
  ibirori: "Dutegura ubukwe, inama z'ibucuruzi, amahuriro, n'ifunguro ry'umwihariye. Ahantu hacu hashobora kwakira abantu 500.",
  igiciro: "Ibiciro by'ibyumba byacu bitangira kuri RWF 234,000/ijoro ku cyumba gisanzwe. Dutanga n'ibiciro bidasanzwe.",
  muraho: "Muraho! 😊 Nagufasha nte uyu munsi? Baza ku byumba, ibiryo, spa, cyangwa ikindi icyo ari cyo cyose!",
  murakoze: "Murakaza neza! Mukeneye ikindi, ntimutinye kubaza. Turiho kugira ngo dukore igihe cyanyu kibe cyiza! 🌟",
  ifunguro: "Ifunguro rya bifeti ritangirwa buri gitondo kuva saa 12:30 kugeza saa 4:00. Rigizwe n'ibiryo by'u Rwanda n'iby'amahanga.",
};

export default function LiveChatWidget() {
  const { t, locale, isRw } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const [onlineUsers] = useState(3);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Save message to database
  const saveMessageToDB = async (msg: { sender: string; senderName: string; senderEmail?: string; senderPhone?: string; message: string; branchId?: string }) => {
    try {
      await fetch("/api/public/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: msg.sender,
          senderName: msg.senderName,
          senderEmail: msg.senderEmail || "guest@eastgate.rw",
          senderPhone: msg.senderPhone || "",
          message: msg.message,
          branchId: msg.branchId || "main-branch",
        }),
      });
    } catch (error) {
      console.error("Failed to save message to database:", error);
    }
  };

  // Initialize greeting message based on locale
  useEffect(() => {
    setMessages([{
      id: "greeting",
      sender: "bot",
      name: "EastGate Concierge",
      avatar: "https://i.pravatar.cc/40?u=eastgate-bot",
      message: isRw
        ? "Muraho! 👋 Murakaze kuri EastGate Hotel Rwanda. Nagufasha nte uyu munsi? Baza ku byumba, ibiryo, spa, ibirori, cyangwa ikindi icyo ari cyo cyose!"
        : "Hello! 👋 Welcome to EastGate Hotel Rwanda. How can I help you today? Ask about rooms, dining, spa, events, or anything else!",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "seen",
    }]);
  }, [isRw]);

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

  const handleQuickReply = (value: string) => {
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
      name: isRw ? "Wowe" : "You",
      avatar: "",
      message: message,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
    };

    setMessages((prev) => [...prev, userMsg]);

    // Save guest message to database
    saveMessageToDB({
      sender: "guest",
      senderName: isRw ? "Umugenzi" : "Guest",
      message: message,
    });

    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const botReply = getAutoReply(message);
      const botMsg: ChatMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        name: "EastGate Concierge",
        avatar: "https://i.pravatar.cc/40?u=eastgate-bot",
        message: botReply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "seen",
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 1000 + Math.random() * 1000);
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  const getAutoReply = useCallback((message: string): string => {
    const lower = message.toLowerCase();
    const replies = isRw ? AUTO_REPLIES_RW : AUTO_REPLIES_EN;
    for (const [keyword, reply] of Object.entries(replies)) {
      if (lower.includes(keyword)) return reply;
    }
    return isRw
      ? "Murakoze kubaza! Itsinda ryacu rizagusubiza vuba. Ku bufasha bwihutirwa, muhamagare +250 788 123 456. Hagati aho, mubaze ku byumba, iresitora, spa, cyangwa ibirori!"
      : "Thank you for your message! Our team will get back to you shortly. For immediate assistance, please call +250 788 123 456. In the meantime, feel free to ask about our rooms, restaurant, spa, or events!";
  }, [isRw]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMsg = {
      id: `user-${Date.now()}`,
      sender: "guest",
      name: isRw ? "Wowe" : "You",
      avatar: "",
      message: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
    };

    setMessages((prev) => [...prev, userMsg]);
    const userText = input.trim();
    setInput("");

    // Save guest message to database
    saveMessageToDB({
      sender: "guest",
      senderName: isRw ? "Umugenzi" : "Guest",
      message: userText,
    });

    // Mark as delivered after 300ms
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => m.id === userMsg.id ? { ...m, status: "delivered" } : m)
      );
    }, 300);

    // Mark as seen after 600ms
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => m.id === userMsg.id ? { ...m, status: "seen" } : m)
      );
    }, 600);

    // Show typing
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
        status: "seen",
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

  const quickActions = isRw
    ? [t("chat", "roomAvailability"), t("chat", "restaurantHours"), t("chat", "bookSpa"), t("chat", "pricesInfo")]
    : [t("chat", "roomAvailability"), t("chat", "restaurantHours"), t("chat", "bookSpa"), t("chat", "pricesInfo")];

  return (
    <>
      {/* Floating Chat Button with "Twandikire" text */}
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
            className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden border border-emerald/20 bg-white flex flex-col"
            style={{ maxHeight: isMinimized ? "auto" : "min(600px, calc(100vh - 140px))" }}
          >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-emerald to-emerald-dark px-4 py-3 text-white shrink-0 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border-2 border-white/20">
                    <AvatarImage src="https://i.pravatar.cc/40?u=eastgate-bot" alt="Concierge" />
                    <AvatarFallback className="bg-gold text-charcoal text-xs">EG</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{t("chat", "title")}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-[10px] text-white/80">
                        {t("chat", "online")} • {onlineUsers} {isRw ? "bahari" : "active"} • {t("chat", "repliesInstantly")}
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
                        {t("common", "today")}
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
                        {msg.sender === "bot" && (
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarImage src={msg.avatar} alt={msg.name} />
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
                            {msg.sender === "guest" && msg.status && (
                              <CheckCheck className={`h-3 w-3 ${msg.status === "seen" ? "text-emerald" : "text-text-muted-custom/50"}`} />
                            )}
                          </div>
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
                        <div>
                          <div className="bg-pearl/80 rounded-2xl rounded-bl-sm px-4 py-3">
                            <div className="flex gap-1">
                              <span className="h-2 w-2 rounded-full bg-text-muted-custom/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                              <span className="h-2 w-2 rounded-full bg-text-muted-custom/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                              <span className="h-2 w-2 rounded-full bg-text-muted-custom/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                          </div>
                          <span className="text-[10px] text-text-muted-custom mt-0.5 block">
                            {t("chat", "typing")}
                          </span>
                        </div>
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
                      placeholder={t("chat", "typeMessage")}
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
                    {t("chat", "poweredBy")}
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
