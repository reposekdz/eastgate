"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, 
  Send, 
  Building2,
  CheckCheck,
  RefreshCw,
  Globe,
  Star,
  Paperclip,
  Mic,
  MapPin,
  Search,
  Phone,
  Video,
  MoreHorizontal,
  FileText,
  Download,
  Play
} from "lucide-react";

interface Conversation {
  id: string;
  name: string;
  phone?: string;
  branchId: string;
  branchName: string;
  lastMessage: string;
  lastMessageTime: string;
  messageCount: number;
  unreadCount: number;
  priority?: "low" | "normal" | "high" | "urgent";
  tags?: string[];
  status?: "active" | "waiting" | "resolved" | "archived";
}

interface Message {
  id: string;
  sender: string;
  senderName: string;
  senderEmail?: string;
  message: string;
  createdAt: string;
  read: boolean;
  type?: "text" | "file" | "voice" | "image" | "location";
  fileUrl?: string;
  reactions?: { emoji: string; count: number; users: string[] }[];
}

interface StaffChatProps {
  staffId: string;
  staffName: string;
  branchId: string;
}

const quickReplies = [
  "Thank you for contacting us!",
  "I'll help you with that right away.",
  "Let me check that for you.",
  "Is there anything else I can help you with?",
  "Your request has been processed.",
  "We appreciate your patience.",
  "I'll transfer you to the right department.",
  "Your booking is confirmed."
];

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  normal: "bg-gray-100 text-gray-800", 
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};

export default function StaffChat({ staffId, staffName, branchId }: StaffChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [crossBranch, setCrossBranch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const fetchConversations = async () => {
    try {
      const params = new URLSearchParams({
        branchId,
        crossBranch: crossBranch.toString(),
        search: searchTerm,
        status: filterStatus
      });
      const response = await fetch(`/api/chat/realtime?${params}`);
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations.map((conv: any) => ({
          ...conv,
          priority: conv.priority || "normal",
          status: conv.status || "active",
          tags: conv.tags || []
        })));
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/realtime?conversationId=${conversationId}`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages.map((msg: any) => ({
          ...msg,
          type: msg.message.includes('📎') ? 'file' : 
                msg.message.includes('🎤') ? 'voice' :
                msg.message.includes('📍') ? 'location' :
                msg.message.includes('🖼️') ? 'image' : 'text',
          reactions: msg.reactions || []
        })));
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const sendMessage = async (content?: string) => {
    const messageContent = content || newMessage.trim();
    if (!messageContent || !selectedConversation) return;

    setLoading(true);
    try {
      const selectedConv = conversations.find(c => c.id === selectedConversation);
      const response = await fetch("/api/chat/realtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: "staff",
          senderName: staffName,
          senderEmail: selectedConversation,
          message: messageContent,
          branchId: selectedConv?.branchId || branchId,
          staffId
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNewMessage("");
        fetchMessages(selectedConversation);
        fetchConversations();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoading(false);
    }
  };

  const setPriority = async (priority: string) => {
    if (!selectedConversation) return;
    try {
      await fetch("/api/chat/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "setPriority",
          conversationId: selectedConversation,
          priority
        })
      });
      fetchConversations();
    } catch (error) {
      console.error("Failed to set priority:", error);
    }
  };

  const sendQuickReply = async (reply: string) => {
    await sendMessage(reply);
    setShowQuickReplies(false);
  };

  const handleFileUpload = async (file: File) => {
    await sendMessage(`📎 ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
  };

  const startVoiceRecording = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      sendMessage("🎤 Voice message (0:15)");
    }, 3000);
  };

  const addReaction = async (messageId: string, emoji: string) => {
    const updatedMessages = messages.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        const existingReaction = reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
          existingReaction.count++;
          existingReaction.users.push(staffName);
        } else {
          reactions.push({ emoji, count: 1, users: [staffName] });
        }
        return { ...msg, reactions };
      }
      return msg;
    });
    setMessages(updatedMessages);
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations();
      if (selectedConversation) {
        fetchMessages(selectedConversation);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [crossBranch, selectedConversation, searchTerm, filterStatus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Staff Chat
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={fetchConversations}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant={crossBranch ? "default" : "outline"}
                size="sm"
                onClick={() => setCrossBranch(!crossBranch)}
              >
                <Globe className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="h-[520px]">
            <div className="space-y-2 p-4">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation === conv.id
                      ? "bg-emerald/10 border border-emerald/20"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setSelectedConversation(conv.id);
                    fetchMessages(conv.id);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">{conv.name}</p>
                        {conv.priority && conv.priority !== "normal" && (
                          <Badge className={`text-xs ${priorityColors[conv.priority]}`}>
                            {conv.priority}
                          </Badge>
                        )}
                        {conv.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Building2 className="h-3 w-3" />
                        <span>{conv.branchName}</span>
                      </div>
                      {conv.tags && conv.tags.length > 0 && (
                        <div className="flex gap-1 mb-1">
                          {conv.tags.slice(0, 2).map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.lastMessage}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(conv.lastMessageTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {selectedConversation ? "Live Conversation" : "Select a conversation"}
            </CardTitle>
            {selectedConversation && (
              <div className="flex items-center gap-2">
                <Select onValueChange={setPriority}>
                  <SelectTrigger className="w-32">
                    <Star className="h-4 w-4" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          {typingUsers.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {typingUsers.join(", ")} typing...
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-0">
          {selectedConversation ? (
            <>
              <ScrollArea className="h-[440px] p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 group ${
                        msg.sender === "staff" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs">
                          {msg.sender === "staff" ? "ST" : "GU"}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`max-w-[70%] ${msg.sender === "staff" ? "text-right" : ""}`}>
                        <div
                          className={`rounded-lg px-3 py-2 text-sm relative ${
                            msg.sender === "staff"
                              ? "bg-emerald text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          {msg.type === "file" && (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>{msg.message}</span>
                              <Button size="sm" variant="ghost">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {msg.type === "voice" && (
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost">
                                <Play className="h-3 w-3" />
                              </Button>
                              <span>{msg.message}</span>
                            </div>
                          )}
                          {msg.type === "text" && msg.message}
                          
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {msg.reactions.map((reaction, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {reaction.emoji} {reaction.count}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <div className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex gap-1">
                              {["👍", "❤️", "😊", "👏"].map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => addReaction(msg.id, emoji)}
                                  className="text-xs hover:scale-110 transition-transform"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${
                          msg.sender === "staff" ? "justify-end" : ""
                        }`}>
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {msg.sender === "staff" && (
                            <CheckCheck className={`h-3 w-3 ${msg.read ? "text-emerald" : "text-muted-foreground"}`} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              {showQuickReplies && (
                <div className="border-t p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-2">
                    {quickReplies.map((reply, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        onClick={() => sendQuickReply(reply)}
                        className="text-xs justify-start"
                      >
                        {reply}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="border-t p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQuickReplies(!showQuickReplies)}
                  >
                    Quick Replies
                  </Button>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startVoiceRecording}
                    disabled={isRecording}
                  >
                    <Mic className={`h-4 w-4 ${isRecording ? 'text-red-500' : ''}`} />
                  </Button>
                  <Button variant="outline" size="sm">
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your response..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    rows={2}
                    className="resize-none"
                  />
                  <Button
                    onClick={() => sendMessage()}
                    disabled={!newMessage.trim() || loading}
                    className="bg-emerald hover:bg-emerald-dark self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[520px] text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select a conversation to start chat</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
