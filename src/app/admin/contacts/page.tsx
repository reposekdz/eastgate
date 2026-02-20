"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import {
    MessageCircle,
    Search,
    Trash2,
    Mail,
    Phone,
    CheckCircle,
    RefreshCw,
    Reply,
    Check,
} from "lucide-react";

interface Contact {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    subject: string | null;
    message: string;
    department: string | null;
    status: string;
    ipAddress: string | null;
    userAgent: string | null;
    branchId: string;
    createdAt: string;
    updatedAt: string;
}

interface ContactStats {
    total: number;
    pending: number;
    responded: number;
    resolved: number;
}

export default function ContactsPage() {
    const { t, isRw } = useI18n();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [stats, setStats] = useState<ContactStats>({ total: 0, pending: 0, responded: 0, resolved: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [replyText, setReplyText] = useState("");
    const [sendingReply, setSendingReply] = useState(false);

    useEffect(() => {
        fetchContacts();
    }, [statusFilter]);

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== "all") {
                params.set("status", statusFilter);
            }
            params.set("limit", "50");

            const res = await fetch(`/api/public/contact?${params}`);
            const data = await res.json();

            if (data.success) {
                setContacts(data.contacts || []);
                // Calculate stats from all contacts
                const allContacts = data.contacts || [];
                setStats({
                    total: allContacts.length,
                    pending: allContacts.filter((c: Contact) => c.status === "pending").length,
                    responded: allContacts.filter((c: Contact) => c.status === "responded").length,
                    resolved: allContacts.filter((c: Contact) => c.status === "resolved").length,
                });
            }
        } catch (error) {
            console.error("Failed to fetch contacts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (contactId: string, newStatus: string) => {
        try {
            const res = await fetch("/api/public/contact", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contactId, status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                fetchContacts();
                if (selectedContact?.id === contactId) {
                    setSelectedContact({ ...selectedContact, status: newStatus });
                }
            }
        } catch (error) {
            console.error("Failed to update contact status:", error);
        }
    };

    const handleDelete = async (contactId: string) => {
        if (!confirm("Are you sure you want to delete this contact?")) return;
        try {
            const res = await fetch(`/api/public/contact?id=${contactId}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) {
                fetchContacts();
                if (selectedContact?.id === contactId) {
                    setSelectedContact(null);
                }
            }
        } catch (error) {
            console.error("Failed to delete contact:", error);
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedContact) return;
        setSendingReply(true);
        try {
            await handleUpdateStatus(selectedContact.id, "responded");
            setReplyText("");
            alert(`Reply would be sent to ${selectedContact.email}: ${replyText}`);
        } catch (error) {
            console.error("Failed to send reply:", error);
        } finally {
            setSendingReply(false);
        }
    };

    const filteredContacts = contacts.filter((contact) => {
        const matchesSearch =
            searchQuery === "" ||
            contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (contact.subject && contact.subject.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{isRw ? "Ikiguzi" : "Pending"}</Badge>;
            case "responded":
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800">{isRw ? "Yanwifashishije" : "Responded"}</Badge>;
            case "resolved":
                return <Badge variant="secondary" className="bg-green-100 text-green-800">{isRw ? "Iracurujwe" : "Resolved"}</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-charcoal">{isRw ? "Amabwirisho" : "Contact Inquiries"}</h1>
                    <p className="text-text-muted">{isRw ? "Mugen Ambros" : "Manage contact form submissions"}</p>
                </div>
                <Button onClick={fetchContacts} variant="outline" size="sm">
                    <RefreshCw size={16} className="mr-2" />
                    {isRw ? "Ongera" : "Refresh"}
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-muted">{isRw ? "Byose" : "Total"}</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <MessageCircle className="h-8 w-8 text-gray-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-muted">{isRw ? "Ikiguzi" : "Pending"}</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-muted">{isRw ? "Yanwifashishije" : "Responded"}</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.responded}</p>
                            </div>
                            <Mail className="h-8 w-8 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-muted">{isRw ? "Iracurujwe" : "Resolved"}</p>
                                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Contact List */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle>{isRw ? "Urudathengashusho" : "Inquiries List"}</CardTitle>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder={isRw ? "Shakisha..." : "Search..."}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 w-48"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 border rounded-md text-sm"
                                >
                                    <option value="all">{isRw ? "Byose" : "All"}</option>
                                    <option value="pending">{isRw ? "Ikiguzi" : "Pending"}</option>
                                    <option value="responded">{isRw ? "Yanwifashishije" : "Responded"}</option>
                                    <option value="resolved">{isRw ? "Iracurujwe" : "Resolved"}</option>
                                </select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                            </div>
                        ) : filteredContacts.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                {isRw ? "Nta mabwirisho ahari" : "No contacts found"}
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                {filteredContacts.map((contact) => (
                                    <div
                                        key={contact.id}
                                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedContact?.id === contact.id
                                                ? "bg-emerald/5 border-emerald"
                                                : "hover:bg-gray-50"
                                            }`}
                                        onClick={() => setSelectedContact(contact)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-medium truncate">{contact.name}</p>
                                                {getStatusBadge(contact.status)}
                                            </div>
                                            <p className="text-sm text-gray-500 truncate">{contact.email}</p>
                                            <p className="text-sm text-gray-400 truncate">
                                                {contact.subject || contact.message.substring(0, 50)}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(contact.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Contact Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>{isRw ? "Ibitekerezo" : "Details"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedContact ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        {isRw ? "Umwirondoro" : "Name"}
                                    </label>
                                    <p className="font-medium">{selectedContact.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        {isRw ? "Imeyili" : "Email"}
                                    </label>
                                    <p className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        {selectedContact.email}
                                    </p>
                                </div>
                                {selectedContact.phone && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">
                                            {isRw ? "Telefoni" : "Phone"}
                                        </label>
                                        <p className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            {selectedContact.phone}
                                        </p>
                                    </div>
                                )}
                                {selectedContact.subject && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">
                                            {isRw ? "Ibibazo" : "Subject"}
                                        </label>
                                        <p>{selectedContact.subject}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        {isRw ? "Ubutumwa" : "Message"}
                                    </label>
                                    <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">
                                        {selectedContact.message}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        {isRw ? "Itariki" : "Date"}
                                    </label>
                                    <p className="text-sm">
                                        {new Date(selectedContact.createdAt).toLocaleString()}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-2 pt-4 border-t">
                                    <Button
                                        size="sm"
                                        onClick={() => handleUpdateStatus(selectedContact.id, "responded")}
                                        disabled={selectedContact.status === "responded"}
                                    >
                                        <Reply className="h-4 w-4 mr-1" />
                                        {isRw ? "Fashisho" : "Respond"}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUpdateStatus(selectedContact.id, "resolved")}
                                        disabled={selectedContact.status === "resolved"}
                                    >
                                        <Check className="h-4 w-4 mr-1" />
                                        {isRw ? "Racura" : "Resolve"}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDelete(selectedContact.id)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        {isRw ? "Siba" : "Delete"}
                                    </Button>
                                </div>

                                {/* Reply Section */}
                                <div className="pt-4 border-t">
                                    <label className="text-sm font-medium text-gray-500">
                                        {isRw ? "Andika igibwisho" : "Write Reply"}
                                    </label>
                                    <textarea
                                        className="w-full mt-1 p-2 border rounded-md text-sm"
                                        rows={4}
                                        placeholder={isRw ? "Andika igibwisho cyawe..." : "Write your reply..."}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                    />
                                    <Button
                                        className="mt-2 w-full"
                                        onClick={handleSendReply}
                                        disabled={!replyText.trim() || sendingReply}
                                    >
                                        <Reply className="h-4 w-4 mr-2" />
                                        {sendingReply ? (isRw ? "Ikurikiranwa..." : "Sending...") : (isRw ? "Ohereza igibwisho" : "Send Reply")}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                {isRw ? "Hitamo ikibwirisho" : "Select a contact to view details"}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
