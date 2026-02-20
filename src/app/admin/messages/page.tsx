"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    MessageCircle,
    Search,
    Star,
    Trash2,
    Mail,
    Phone,
    CheckCircle,
    Circle,
    Send,
    RefreshCw,
    Archive,
} from "lucide-react";

interface Message {
    id: string;
    sender: string;
    senderName: string;
    senderEmail: string | null;
    senderPhone: string | null;
    senderAvatar: string | null;
    message: string;
    branchId: string;
    read: boolean;
    starred: boolean;
    archived: boolean;
    createdAt: string;
    updatedAt: string;
}

interface MessageStats {
    total: number;
    unread: number;
    starred: number;
}

export default function MessagesPage() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [stats, setStats] = useState<MessageStats>({ total: 0, unread: 0, starred: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [sendingReply, setSendingReply] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");

    useEffect(() => {
        fetchMessages();
    }, [activeTab]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set("type", activeTab);
            params.set("limit", "50");

            const res = await fetch(`/api/manager/messages?${params}`);
            const data = await res.json();

            if (data.success) {
                setMessages(data.messages || []);
                setStats(data.stats || { total: 0, unread: 0, starred: 0 });
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectMessage = (messageId: string) => {
        setSelectedMessages((prev) =>
            prev.includes(messageId)
                ? prev.filter((id) => id !== messageId)
                : [...prev, messageId]
        );
    };

    const handleSelectAll = () => {
        if (selectedMessages.length === messages.length) {
            setSelectedMessages([]);
        } else {
            setSelectedMessages(messages.map((m) => m.id));
        }
    };

    const markAsRead = async (messageIds: string[]) => {
        try {
            await fetch("/api/manager/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "markRead", messageIds }),
            });
            fetchMessages();
            setSelectedMessages([]);
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const toggleStar = async (messageId: string, starred: boolean) => {
        try {
            await fetch("/api/manager/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: starred ? "unstar" : "star",
                    messageIds: [messageId],
                }),
            });
            fetchMessages();
        } catch (error) {
            console.error("Failed to toggle star:", error);
        }
    };

    const deleteMessages = async (messageIds: string[]) => {
        if (!confirm(`Delete ${messageIds.length} message(s)?`)) return;

        try {
            await fetch("/api/manager/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete", messageIds }),
            });
            fetchMessages();
            setSelectedMessages([]);
        } catch (error) {
            console.error("Failed to delete messages:", error);
        }
    };

    const archiveMessages = async (messageIds: string[]) => {
        try {
            await fetch("/api/manager/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "archive", messageIds }),
            });
            fetchMessages();
            setSelectedMessages([]);
        } catch (error) {
            console.error("Failed to archive messages:", error);
        }
    };

    const filteredMessages = messages.filter(
        (msg) =>
            msg.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (msg.senderEmail && msg.senderEmail.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald/10 rounded-lg">
                        <MessageCircle className="h-6 w-6 text-emerald" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-charcoal">Guest Messages</h1>
                        <p className="text-sm text-text-muted-custom">
                            View and manage messages from guests via live chat
                        </p>
                    </div>
                </div>
                <Button onClick={fetchMessages} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-emerald/5 to-emerald/10 border-emerald/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-muted-custom">Total Messages</p>
                                <p className="text-3xl font-bold text-charcoal">{stats.total}</p>
                            </div>
                            <div className="h-12 w-12 bg-emerald/20 rounded-full flex items-center justify-center">
                                <Mail className="h-6 w-6 text-emerald" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber/5 to-amber/10 border-amber/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-muted-custom">Unread</p>
                                <p className="text-3xl font-bold text-charcoal">{stats.unread}</p>
                            </div>
                            <div className="h-12 w-12 bg-amber/20 rounded-full flex items-center justify-center">
                                <Circle className="h-6 w-6 text-amber" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple/5 to-purple/10 border-purple/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-muted-custom">Starred</p>
                                <p className="text-3xl font-bold text-charcoal">{stats.starred}</p>
                            </div>
                            <div className="h-12 w-12 bg-purple/20 rounded-full flex items-center justify-center">
                                <Star className="h-6 w-6 text-purple" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Actions Bar */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
                                <Input
                                    placeholder="Search messages..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            {selectedMessages.length > 0 && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => markAsRead(selectedMessages)}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Mark Read ({selectedMessages.length})
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => archiveMessages(selectedMessages)}
                                    >
                                        <Archive className="h-4 w-4 mr-2" />
                                        Archive
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600"
                                        onClick={() => deleteMessages(selectedMessages)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </Button>
                                    <div className="h-6 w-px bg-border mx-2" />
                                </>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSelectAll}
                            >
                                {selectedMessages.length === messages.length ? "Deselect All" : "Select All"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Messages List */}
            <Card>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <CardHeader className="pb-0">
                        <TabsList className="bg-pearl">
                            <TabsTrigger value="all" className="gap-2">
                                All Messages
                                <Badge variant="secondary" className="ml-1">{stats.total}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="unread" className="gap-2">
                                Unread
                                <Badge variant="secondary" className="ml-1 bg-amber/20 text-amber">{stats.unread}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="starred" className="gap-2">
                                Starred
                                <Badge variant="secondary" className="ml-1 bg-purple/20 text-purple">{stats.starred}</Badge>
                            </TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <TabsContent value="all" className="mt-0">
                            <MessagesList
                                messages={filteredMessages}
                                loading={loading}
                                selectedMessages={selectedMessages}
                                onSelect={handleSelectMessage}
                                onToggleStar={toggleStar}
                                onMarkRead={markAsRead}
                                formatDate={formatDate}
                                getInitials={getInitials}
                            />
                        </TabsContent>
                        <TabsContent value="unread" className="mt-0">
                            <MessagesList
                                messages={filteredMessages}
                                loading={loading}
                                selectedMessages={selectedMessages}
                                onSelect={handleSelectMessage}
                                onToggleStar={toggleStar}
                                onMarkRead={markAsRead}
                                formatDate={formatDate}
                                getInitials={getInitials}
                            />
                        </TabsContent>
                        <TabsContent value="starred" className="mt-0">
                            <MessagesList
                                messages={filteredMessages}
                                loading={loading}
                                selectedMessages={selectedMessages}
                                onSelect={handleSelectMessage}
                                onToggleStar={toggleStar}
                                onMarkRead={markAsRead}
                                formatDate={formatDate}
                                getInitials={getInitials}
                            />
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>
        </div>
    );
}

function MessagesList({
    messages,
    loading,
    selectedMessages,
    onSelect,
    onToggleStar,
    onMarkRead,
    formatDate,
    getInitials,
}: {
    messages: Message[];
    loading: boolean;
    selectedMessages: string[];
    onSelect: (id: string) => void;
    onToggleStar: (id: string, starred: boolean) => void;
    onMarkRead: (ids: string[]) => void;
    formatDate: (date: string) => string;
    getInitials: (name: string) => string;
}) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald" />
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-text-muted-custom/30 mx-auto mb-4" />
                <p className="text-text-muted-custom">No messages found</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-[500px]">
            <div className="space-y-2">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${!msg.read
                                ? "bg-emerald/5 border-emerald/20"
                                : "bg-white border-border hover:bg-pearl/50"
                            }`}
                    >
                        <Checkbox
                            checked={selectedMessages.includes(msg.id)}
                            onCheckedChange={() => onSelect(msg.id)}
                            className="mt-1"
                        />

                        <Avatar className="h-10 w-10">
                            <AvatarImage src={msg.senderAvatar || ""} />
                            <AvatarFallback className="bg-emerald text-white text-sm">
                                {getInitials(msg.senderName)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`font-semibold ${!msg.read ? "text-charcoal" : "text-text-muted-custom"}`}>
                                    {msg.senderName}
                                </span>
                                {!msg.read && (
                                    <Badge className="h-2 w-2 p-0 rounded-full bg-emerald" />
                                )}
                                <span className="text-xs text-text-muted-custom">
                                    {formatDate(msg.createdAt)}
                                </span>
                            </div>

                            <p className={`text-sm line-clamp-2 ${!msg.read ? "text-charcoal" : "text-text-muted-custom"}`}>
                                {msg.message}
                            </p>

                            <div className="flex items-center gap-3 mt-2">
                                {msg.senderEmail && (
                                    <span className="text-xs text-text-muted-custom flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {msg.senderEmail}
                                    </span>
                                )}
                                {msg.senderPhone && (
                                    <span className="text-xs text-text-muted-custom flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {msg.senderPhone}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 ${msg.starred ? "text-amber" : "text-text-muted-custom"}`}
                                onClick={() => onToggleStar(msg.id, msg.starred)}
                            >
                                <Star className={`h-4 w-4 ${msg.starred ? "fill-current" : ""}`} />
                            </Button>
                            {!msg.read && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-emerald"
                                    onClick={() => onMarkRead([msg.id])}
                                >
                                    <CheckCircle className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
