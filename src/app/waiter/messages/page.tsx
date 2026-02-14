"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { MessageSquare, Send, Users } from "lucide-react";

export default function WaiterMessagesPage() {
  const { user } = useAuthStore();
  const { getChatMessages, addChatMessage } = useBranchStore();
  const branchId = user?.branchId || "br-001";
  const messages = getChatMessages(branchId);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    addChatMessage({
      sender: "staff",
      senderName: user?.name || "Staff",
      senderAvatar: user?.avatar || "",
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      branchId,
      read: true,
    });
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-md text-charcoal">Team Messages</h1>
        <p className="body-sm text-text-muted-custom mt-1">
          Internal team communication &bull; Stay coordinated with your team
        </p>
      </div>

      <Card className="flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
        <CardHeader className="pb-3 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-base">Branch Chat</CardTitle>
              <p className="text-xs text-text-muted-custom">{messages.length} messages</p>
            </div>
            <Badge className="ml-auto bg-emerald-100 text-emerald-700 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 inline-block" />
              Online
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1 px-4">
            <div className="py-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === "staff" ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={msg.senderAvatar} alt={msg.senderName} />
                    <AvatarFallback className="text-[10px] bg-amber-100 text-amber-700">
                      {msg.senderName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`max-w-[70%] ${
                      msg.sender === "staff" ? "text-right" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-charcoal">
                        {msg.senderName}
                      </span>
                      <span className="text-[10px] text-text-muted-custom">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm ${
                        msg.sender === "staff"
                          ? "bg-amber-600 text-white rounded-br-sm"
                          : "bg-pearl rounded-bl-sm text-charcoal"
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="border-t p-4 shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                className="bg-amber-600 hover:bg-amber-700 text-white"
                disabled={!newMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
