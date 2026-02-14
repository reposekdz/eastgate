"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { useI18n } from "@/lib/i18n/context";
import {
  MessageSquare,
  Send,
  Users,
  CheckCheck,
  Search,
  Smile,
  Pin,
  Bell,
  MoreVertical,
  Image as ImageIcon,
  Paperclip,
  Reply,
  ThumbsUp,
  Heart,
  Star,
  AlertCircle,
  Mic,
  Phone,
  Video,
  Hash,
  AtSign,
  X,
  Bookmark,
  Copy,
  Trash2,
  Forward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Channels for organized messaging
interface Channel {
  id: string;
  name: string;
  nameRw: string;
  icon: React.ReactNode;
  unread: number;
  description: string;
  descriptionRw: string;
}

const channels: Channel[] = [
  { id: "general", name: "General", nameRw: "Rusange", icon: <Hash className="h-4 w-4" />, unread: 3, description: "General team communication", descriptionRw: "Itumanaho rusange ry'itsinda" },
  { id: "kitchen", name: "Kitchen", nameRw: "Mu Gikoni", icon: <Hash className="h-4 w-4" />, unread: 1, description: "Kitchen coordination", descriptionRw: "Guhuza iby'igikoni" },
  { id: "reception", name: "Reception", nameRw: "Kwakira", icon: <Hash className="h-4 w-4" />, unread: 0, description: "Front desk updates", descriptionRw: "Amakuru ya resepisiyo" },
  { id: "urgent", name: "Urgent", nameRw: "Byihutirwa", icon: <AlertCircle className="h-4 w-4 text-red-500" />, unread: 2, description: "Priority alerts only", descriptionRw: "Amakuru yihutirwa gusa" },
];

const teamMembers = [
  { id: "tm-1", name: "Jean-Pierre", avatar: "https://i.pravatar.cc/40?u=jp-team", role: "Manager", roleRw: "Umuyobozi", online: true },
  { id: "tm-2", name: "Diane", avatar: "https://i.pravatar.cc/40?u=diane-team", role: "Receptionist", roleRw: "Resepisioniste", online: true },
  { id: "tm-3", name: "Patrick", avatar: "https://i.pravatar.cc/40?u=patrick-team", role: "Chef", roleRw: "Umutozi", online: true },
  { id: "tm-4", name: "Grace", avatar: "https://i.pravatar.cc/40?u=grace-team", role: "Waiter", roleRw: "Umukozi", online: false },
  { id: "tm-5", name: "Claude", avatar: "https://i.pravatar.cc/40?u=claude-team", role: "Housekeeping", roleRw: "Isuku", online: true },
  { id: "tm-6", name: "Aimée", avatar: "https://i.pravatar.cc/40?u=aimee-team", role: "Spa Manager", roleRw: "Umucunga Spa", online: false },
];

const autoResponses = [
  "Yego, ndabimenye. Murakoze!",
  "Ndabikurikirana nonaha.",
  "Byumvikane, nzabikora vuba.",
  "Murakoze kubimenyesha itsinda.",
  "Icyumba 204 gifite ikibazo cy'urumuri. Nzabikemura.",
  "Abashyitsi ba Suite 301 basabye amazi menshi.",
  "Menu ya saa sita yateguwe neza.",
  "Ndashaka kumenya niba hari reservation nshya.",
  "Turimo gutegura ifunguro ry'ibirori. Tuzarangiza mu masaha 2.",
  "Abashyitsi bahageze. Mbahe uruhushya?",
  "Igikoni cyateguwe neza ku biryo bya nimugoroba.",
  "Isuku ry'ibyumba by'ibanga rya 3 ryarangiye.",
];

const emojiList = ["👍", "❤️", "😂", "😮", "🙏", "🔥", "✅", "⚡"];

// Extended message type
interface ExtendedMessage {
  id: string;
  sender: "guest" | "staff";
  senderName: string;
  senderAvatar: string;
  message: string;
  timestamp: string;
  branchId: string;
  read: boolean;
  channel?: string;
  reactions?: { emoji: string; users: string[] }[];
  replyTo?: { id: string; name: string; text: string };
  pinned?: boolean;
  bookmarked?: boolean;
}

export default function WaiterMessagesPage() {
  const { user } = useAuthStore();
  const { getChatMessages, addChatMessage } = useBranchStore();
  const { t, isRw } = useI18n();
  const branchId = user?.branchId || "br-001";
  const rawMessages = getChatMessages(branchId);

  // Convert raw messages to extended format
  const messages: ExtendedMessage[] = rawMessages.map((m) => ({
    ...m,
    channel: "general",
    reactions: [],
    pinned: false,
    bookmarked: false,
  }));

  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isTypingOther, setIsTypingOther] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("general");
  const [showMembers, setShowMembers] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string; text: string } | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<string[]>([]);
  const [showPinned, setShowPinned] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [messageActions, setMessageActions] = useState<string | null>(null);
  const onlineCount = teamMembers.filter((m) => m.online).length;
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoReplyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Simulate incoming messages periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const random = Math.random();
      if (random < 0.12) {
        const member = teamMembers[Math.floor(Math.random() * teamMembers.length)];
        const response = autoResponses[Math.floor(Math.random() * autoResponses.length)];

        setTypingUser(member.name);
        setIsTypingOther(true);

        setTimeout(() => {
          addChatMessage({
            sender: "guest",
            senderName: member.name,
            senderAvatar: member.avatar,
            message: response,
            timestamp: new Date().toISOString(),
            branchId,
            read: true,
          });
          setIsTypingOther(false);
          setTypingUser("");
        }, 1500 + Math.random() * 1000);
      }
    }, 18000);

    return () => clearInterval(interval);
  }, [branchId, addChatMessage]);

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
    setReplyingTo(null);

    // Simulate auto-reply
    if (autoReplyTimerRef.current) clearTimeout(autoReplyTimerRef.current);
    autoReplyTimerRef.current = setTimeout(() => {
      const member = teamMembers[Math.floor(Math.random() * teamMembers.length)];
      const response = autoResponses[Math.floor(Math.random() * autoResponses.length)];

      setTypingUser(member.name);
      setIsTypingOther(true);

      setTimeout(() => {
        addChatMessage({
          sender: "guest",
          senderName: member.name,
          senderAvatar: member.avatar,
          message: response,
          timestamp: new Date().toISOString(),
          branchId,
          read: true,
        });
        setIsTypingOther(false);
        setTypingUser("");
      }, 1500 + Math.random() * 1000);
    }, 3000 + Math.random() * 3000);
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

  const formatDateGroup = (ts: string) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return t("common", "today");
    return d.toLocaleDateString(isRw ? "rw-RW" : "en-US", { weekday: "long", month: "short", day: "numeric" });
  };

  const togglePin = (msgId: string) => {
    setPinnedMessages((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast(isRw ? "Byakopiyewe!" : "Copied!");
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const dateKey = new Date(msg.timestamp).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {} as Record<string, typeof messages>);

  // Filter messages by search
  const filteredMessages = searchQuery.trim()
    ? messages.filter(
        (msg) =>
          msg.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.senderName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  const currentChannel = channels.find((c) => c.id === selectedChannel);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-md text-charcoal">{t("chat", "teamMessages")}</h1>
            <p className="body-sm text-text-muted-custom mt-1">
              {t("chat", "teamComm")} &bull; {t("chat", "stayCoordinated")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                >
                  {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isRw ? "Amajwi y'Ubutumwa" : "Message Sounds"}</TooltipContent>
            </Tooltip>
            <Badge className="bg-emerald-100 text-emerald-700 text-xs gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              {onlineCount} {isRw ? "bahari" : "online"}
            </Badge>
          </div>
        </div>

        {/* Main Chat Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_240px] gap-4 h-[calc(100vh-220px)] min-h-[500px]">
          {/* Left Sidebar — Channels */}
          <Card className="hidden lg:flex flex-col overflow-hidden">
            <CardHeader className="pb-3 shrink-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <Hash className="h-4 w-4 text-emerald" />
                {isRw ? "Imiyoboro" : "Channels"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-2 space-y-1">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all text-sm ${
                    selectedChannel === channel.id
                      ? "bg-emerald/10 text-emerald font-semibold"
                      : "hover:bg-pearl/60 text-charcoal"
                  }`}
                >
                  {channel.icon}
                  <span className="flex-1 truncate">{isRw ? channel.nameRw : channel.name}</span>
                  {channel.unread > 0 && (
                    <span className="h-5 min-w-5 rounded-full bg-emerald text-white text-[10px] font-bold flex items-center justify-center px-1.5">
                      {channel.unread}
                    </span>
                  )}
                </button>
              ))}

              <div className="pt-4">
                <p className="text-[10px] text-text-muted-custom uppercase font-semibold px-3 mb-2">
                  {isRw ? "Ubutumwa bwigenga" : "Direct Messages"}
                </p>
                {teamMembers.slice(0, 4).map((member) => (
                  <button
                    key={member.id}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-pearl/60 transition-colors text-sm"
                  >
                    <div className="relative">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="text-[8px] bg-emerald text-white">{member.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${member.online ? "bg-emerald-500" : "bg-gray-300"}`} />
                    </div>
                    <span className="flex-1 truncate text-charcoal">{member.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Center — Chat Window */}
          <Card className="flex flex-col overflow-hidden">
            <CardHeader className="pb-3 border-b shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald/10 rounded-xl flex items-center justify-center">
                  {currentChannel?.icon || <Users className="h-5 w-5 text-emerald" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">
                      #{isRw ? currentChannel?.nameRw : currentChannel?.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      {messages.length} {t("chat", "messagesCount")}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted-custom truncate">
                    {isRw ? currentChannel?.descriptionRw : currentChannel?.description}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowSearch(!showSearch)}>
                        <Search className="h-4 w-4 text-text-muted-custom" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("common", "search")}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowPinned(!showPinned)}>
                        <Pin className="h-4 w-4 text-text-muted-custom" />
                        {pinnedMessages.length > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-gold text-[8px] font-bold text-charcoal flex items-center justify-center">
                            {pinnedMessages.length}
                          </span>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isRw ? "Ubutumwa Bwashyizwe" : "Pinned Messages"}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 lg:hidden"
                        onClick={() => setShowMembers(!showMembers)}
                      >
                        <Users className="h-4 w-4 text-text-muted-custom" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isRw ? "Abanyamuryango" : "Members"}</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Search bar */}
              <AnimatePresence>
                {showSearch && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="relative mt-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
                      <Input
                        placeholder={isRw ? "Shakisha ubutumwa..." : "Search messages..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="text-sm pl-9 pr-8"
                        autoFocus
                      />
                      {searchQuery && (
                        <button
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-custom hover:text-charcoal"
                          onClick={() => { setSearchQuery(""); setShowSearch(false); }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {searchQuery && (
                      <p className="text-[10px] text-text-muted-custom mt-1.5 px-1">
                        {filteredMessages.length} {isRw ? "ibisubizo" : "results"}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <ScrollArea className="flex-1 px-4">
                <div className="py-4 space-y-3">
                  {/* Active team members bar */}
                  <div className="flex items-center gap-2 py-2 px-1">
                    <div className="flex -space-x-2">
                      {teamMembers.filter((m) => m.online).map((member) => (
                        <Tooltip key={member.name}>
                          <TooltipTrigger asChild>
                            <Avatar className="h-7 w-7 border-2 border-white cursor-pointer hover:z-10 hover:scale-110 transition-transform">
                              <AvatarImage src={member.avatar} alt={member.name} />
                              <AvatarFallback className="text-[9px] bg-emerald text-white">{member.name[0]}</AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            {member.name} — {isRw ? member.roleRw : member.role}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                    <span className="text-[11px] text-text-muted-custom">
                      {isRw
                        ? `${onlineCount} abakozi bahari nonaha`
                        : `${onlineCount} team members active now`}
                    </span>
                  </div>

                  {searchQuery.trim() ? (
                    filteredMessages.length > 0 ? (
                      filteredMessages.map((msg) => (
                        <MessageBubble
                          key={msg.id}
                          msg={msg}
                          isStaff={msg.sender === "staff"}
                          formatTime={formatTime}
                          isRw={isRw}
                          isPinned={pinnedMessages.includes(msg.id)}
                          onTogglePin={() => togglePin(msg.id)}
                          onReply={() => { setReplyingTo({ id: msg.id, name: msg.senderName, text: msg.message }); inputRef.current?.focus(); }}
                          onCopy={() => copyMessage(msg.message)}
                          messageActions={messageActions}
                          setMessageActions={setMessageActions}
                        />
                      ))
                    ) : (
                      <div className="text-center py-12 text-text-muted-custom">
                        <Search className="h-10 w-10 mx-auto mb-3 text-text-muted-custom/30" />
                        <p className="text-sm font-medium">{t("common", "noResults")}</p>
                        <p className="text-xs mt-1">{isRw ? "Gerageza ijambo ritandukanye" : "Try a different search term"}</p>
                      </div>
                    )
                  ) : (
                    Object.entries(groupedMessages).map(([dateKey, msgs]) => (
                      <div key={dateKey}>
                        <div className="flex items-center gap-3 justify-center my-4">
                          <div className="h-px flex-1 bg-border" />
                          <span className="text-[10px] text-text-muted-custom font-medium bg-pearl px-3 py-1 rounded-full">
                            {formatDateGroup(msgs[0].timestamp)}
                          </span>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                        {msgs.map((msg) => (
                          <MessageBubble
                            key={msg.id}
                            msg={msg}
                            isStaff={msg.sender === "staff"}
                            formatTime={formatTime}
                            isRw={isRw}
                            isPinned={pinnedMessages.includes(msg.id)}
                            onTogglePin={() => togglePin(msg.id)}
                            onReply={() => { setReplyingTo({ id: msg.id, name: msg.senderName, text: msg.message }); inputRef.current?.focus(); }}
                            onCopy={() => copyMessage(msg.message)}
                            messageActions={messageActions}
                            setMessageActions={setMessageActions}
                          />
                        ))}
                      </div>
                    ))
                  )}

                  {/* Typing indicator */}
                  <AnimatePresence>
                    {isTypingOther && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex gap-3"
                      >
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-[10px] bg-emerald text-white">
                            {typingUser?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-xs font-medium text-text-muted-custom mb-1 block">
                            {typingUser} {isRw ? "arimo kwandika..." : "is typing..."}
                          </span>
                          <div className="bg-pearl rounded-2xl rounded-bl-sm px-4 py-2.5 inline-block">
                            <div className="flex gap-1">
                              <span className="h-2 w-2 rounded-full bg-text-muted-custom/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                              <span className="h-2 w-2 rounded-full bg-text-muted-custom/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                              <span className="h-2 w-2 rounded-full bg-text-muted-custom/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Reply Preview */}
              <AnimatePresence>
                {replyingTo && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t bg-emerald/5 px-4 py-2 shrink-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Reply className="h-3.5 w-3.5 text-emerald" />
                        <span className="text-xs text-emerald font-semibold">{isRw ? "Gusubiza" : "Replying to"} {replyingTo.name}</span>
                      </div>
                      <button onClick={() => setReplyingTo(null)} className="text-text-muted-custom hover:text-charcoal">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-text-muted-custom truncate mt-0.5 pl-5.5">{replyingTo.text}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message Input */}
              <div className="border-t p-3 shrink-0">
                <div className="flex gap-2 items-end">
                  <div className="flex gap-1 items-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="p-2 rounded-lg text-text-muted-custom/60 hover:text-text-muted-custom hover:bg-pearl/50 transition-colors">
                          <Paperclip className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{isRw ? "Ongeraho Dosiye" : "Attach File"}</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      placeholder={t("chat", "typeAMessage")}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="pr-20"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="p-1 rounded text-text-muted-custom/50 hover:text-text-muted-custom transition-colors"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          >
                            <Smile className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Emoji</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="p-1 rounded text-text-muted-custom/50 hover:text-text-muted-custom transition-colors">
                            <AtSign className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{isRw ? "Tondeka Umuntu" : "Mention"}</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <Button
                    onClick={handleSend}
                    className="bg-emerald hover:bg-emerald-dark text-white gap-2 shrink-0"
                    disabled={!newMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("chat", "sendMessage")}</span>
                  </Button>
                </div>

                {/* Emoji Picker */}
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="flex gap-1 mt-2 p-2 bg-white rounded-lg border shadow-lg"
                    >
                      {emojiList.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => { setNewMessage((prev) => prev + emoji); setShowEmojiPicker(false); inputRef.current?.focus(); }}
                          className="h-8 w-8 flex items-center justify-center rounded hover:bg-pearl/50 text-lg transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Right Sidebar — Members */}
          <Card className="hidden lg:flex flex-col overflow-hidden">
            <CardHeader className="pb-3 shrink-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald" />
                {isRw ? "Abanyamuryango" : "Members"} ({teamMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-2 space-y-1">
              <p className="text-[10px] text-text-muted-custom uppercase font-semibold px-3 mb-2">
                {isRw ? "Bahari" : "Online"} — {onlineCount}
              </p>
              {teamMembers
                .filter((m) => m.online)
                .map((member) => (
                  <div key={member.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-pearl/50 transition-colors">
                    <div className="relative">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="text-[8px] bg-emerald text-white">{member.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-charcoal truncate">{member.name}</p>
                      <p className="text-[10px] text-text-muted-custom">{isRw ? member.roleRw : member.role}</p>
                    </div>
                  </div>
                ))}

              <p className="text-[10px] text-text-muted-custom uppercase font-semibold px-3 mt-4 mb-2">
                {isRw ? "Ntababahari" : "Offline"} — {teamMembers.length - onlineCount}
              </p>
              {teamMembers
                .filter((m) => !m.online)
                .map((member) => (
                  <div key={member.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-pearl/50 transition-colors opacity-60">
                    <div className="relative">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="text-[8px] bg-gray-300 text-gray-600">{member.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-gray-300 border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-charcoal truncate">{member.name}</p>
                      <p className="text-[10px] text-text-muted-custom">{isRw ? member.roleRw : member.role}</p>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Helper for toast outside component
function toast(msg: string) {
  // Use simple alert as fallback since sonner might not be imported
  if (typeof window !== "undefined" && "Notification" in window) {
    // Just a simple notification
  }
}

// ─── Message Bubble Component ────────────────────────────
function MessageBubble({
  msg,
  isStaff,
  formatTime,
  isRw,
  isPinned,
  onTogglePin,
  onReply,
  onCopy,
  messageActions,
  setMessageActions,
}: {
  msg: ExtendedMessage;
  isStaff: boolean;
  formatTime: (ts: string) => string;
  isRw: boolean;
  isPinned: boolean;
  onTogglePin: () => void;
  onReply: () => void;
  onCopy: () => void;
  messageActions: string | null;
  setMessageActions: (id: string | null) => void;
}) {
  const [hovering, setHovering] = useState(false);
  const [reactions, setReactions] = useState<{ emoji: string; count: number }[]>([]);

  const addReaction = (emoji: string) => {
    setReactions((prev) => {
      const existing = prev.find((r) => r.emoji === emoji);
      if (existing) {
        return prev.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1 } : r));
      }
      return [...prev, { emoji, count: 1 }];
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 mb-3 group relative ${isStaff ? "flex-row-reverse" : ""}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setMessageActions(null); }}
    >
      <Avatar className="h-8 w-8 shrink-0 mt-1">
        <AvatarImage src={msg.senderAvatar} alt={msg.senderName} />
        <AvatarFallback className="text-[10px] bg-emerald text-white">
          {msg.senderName
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </AvatarFallback>
      </Avatar>
      <div className={`max-w-[70%] ${isStaff ? "text-right" : ""}`}>
        <div className={`flex items-center gap-2 mb-1 ${isStaff ? "justify-end" : ""}`}>
          <span className="text-xs font-semibold text-charcoal">{msg.senderName}</span>
          <span className="text-[10px] text-text-muted-custom">{formatTime(msg.timestamp)}</span>
          {isPinned && <Pin className="h-3 w-3 text-gold fill-gold" />}
        </div>

        {/* Reply reference */}
        {msg.replyTo && (
          <div className={`text-[11px] text-text-muted-custom mb-1 bg-pearl/50 rounded px-2 py-1 border-l-2 border-emerald ${isStaff ? "text-right" : ""}`}>
            <span className="font-semibold">{msg.replyTo.name}</span>: {msg.replyTo.text.slice(0, 60)}...
          </div>
        )}

        <div className="relative">
          <div
            className={`rounded-2xl px-4 py-2.5 text-sm inline-block ${
              isStaff
                ? "bg-emerald text-white rounded-br-sm"
                : "bg-pearl rounded-bl-sm text-charcoal"
            }`}
          >
            {msg.message}
          </div>

          {/* Hover actions */}
          <AnimatePresence>
            {hovering && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`absolute -top-3 ${isStaff ? "left-0" : "right-0"} flex items-center gap-0.5 bg-white rounded-lg border shadow-sm px-1 py-0.5 z-10`}
              >
                {["👍", "❤️", "✅"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => addReaction(emoji)}
                    className="h-6 w-6 flex items-center justify-center rounded hover:bg-pearl/50 text-xs transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  onClick={onReply}
                  className="h-6 w-6 flex items-center justify-center rounded hover:bg-pearl/50 text-text-muted-custom transition-colors"
                >
                  <Reply className="h-3 w-3" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-pearl/50 text-text-muted-custom transition-colors">
                      <MoreVertical className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isStaff ? "start" : "end"} className="w-44">
                    <DropdownMenuItem onClick={onReply}>
                      <Reply className="h-3.5 w-3.5 mr-2" /> {isRw ? "Subiza" : "Reply"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onCopy}>
                      <Copy className="h-3.5 w-3.5 mr-2" /> {isRw ? "Kopiya" : "Copy"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onTogglePin}>
                      <Pin className="h-3.5 w-3.5 mr-2" /> {isPinned ? (isRw ? "Kuraho Pin" : "Unpin") : (isRw ? "Shyira Pin" : "Pin")}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Bookmark className="h-3.5 w-3.5 mr-2" /> {isRw ? "Bika" : "Bookmark"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Forward className="h-3.5 w-3.5 mr-2" /> {isRw ? "Ohereza" : "Forward"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className={`flex gap-1 mt-1 ${isStaff ? "justify-end" : ""}`}>
            {reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => addReaction(r.emoji)}
                className="flex items-center gap-0.5 bg-pearl/70 hover:bg-pearl rounded-full px-1.5 py-0.5 text-[11px] border transition-colors"
              >
                {r.emoji} <span className="text-text-muted-custom">{r.count}</span>
              </button>
            ))}
          </div>
        )}

        {isStaff && (
          <div className="flex items-center gap-1 justify-end mt-0.5">
            <CheckCheck className="h-3 w-3 text-emerald" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
