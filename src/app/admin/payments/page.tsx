"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { formatCurrency } from "@/lib/format";
import { CreditCard, Search, DollarSign, CheckCircle, Clock, XCircle } from "lucide-react";

const paymentMethodLabels: Record<string, string> = {
  stripe: "Stripe",
  visa: "Visa",
  mastercard: "Mastercard",
  mtn_mobile: "MTN MoMo",
  airtel_money: "Airtel Money",
  bank_transfer: "Bank Transfer",
  paypal: "PayPal",
  cash: "Cash",
  split: "Split",
};

export default function PaymentsPage() {
  const { user, hasAccess } = useAuthStore();
  const { getBranches, getBookings } = useBranchStore();
  const isSuper = hasAccess(["super_admin", "super_manager"]);
  const branchId = user?.branchId ?? "br-001";
  const role = user?.role ?? "guest";
  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const branches = getBranches(role, isSuper ? "all" : branchId);
  const allBookings = getBookings(isSuper ? "all" : branchId, role);
  const filtered = allBookings.filter((b) => {
    const matchSearch =
      !search ||
      b.guestName.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase());
    const matchBranch = filterBranch === "all" || b.branchId === filterBranch;
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    return matchSearch && matchBranch && matchStatus;
  });

  const totalPaid = filtered
    .filter((b) => ["checked_in", "checked_out", "confirmed"].includes(b.status))
    .reduce((s, b) => s + b.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-md text-charcoal">Payments</h1>
        <p className="body-sm text-text-muted-custom mt-1">
          View and track all payments across branches — cards, mobile money, bank transfer
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-emerald/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-emerald" />
            </div>
            <div>
              <p className="text-xs font-medium text-text-muted-custom">Total (filtered)</p>
              <p className="text-xl font-bold text-charcoal">{formatCurrency(totalPaid)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-text-muted-custom">Completed</p>
              <p className="text-xl font-bold text-charcoal">
                {filtered.filter((b) => b.status === "checked_in" || b.status === "checked_out").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-text-muted-custom">Pending</p>
              <p className="text-xl font-bold text-charcoal">
                {filtered.filter((b) => b.status === "pending" || b.status === "confirmed").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-text-muted-custom">Transactions</p>
              <p className="text-xl font-bold text-charcoal">{filtered.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by guest or booking ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {isSuper && (
              <Select value={filterBranch} onValueChange={setFilterBranch}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="checked_in">Checked In</SelectItem>
                <SelectItem value="checked_out">Checked Out</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Guest</TableHead>
                  {isSuper && <TableHead>Branch</TableHead>}
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isSuper ? 6 : 5} className="text-center py-12 text-muted-foreground">
                      No payments match your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono text-sm">{b.id}</TableCell>
                      <TableCell className="font-medium">{b.guestName}</TableCell>
                      {isSuper && (
                        <TableCell>{branches.find((br) => br.id === b.branchId)?.name ?? b.branchId}</TableCell>
                      )}
                      <TableCell className="font-semibold text-emerald">{formatCurrency(b.totalAmount)}</TableCell>
                      <TableCell>{paymentMethodLabels[b.paymentMethod] ?? b.paymentMethod}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            b.status === "checked_out" || b.status === "checked_in"
                              ? "default"
                              : b.status === "cancelled"
                                ? "destructive"
                                : "secondary"
                          }
                          className={
                            b.status === "checked_in" || b.status === "checked_out"
                              ? "bg-emerald"
                              : b.status === "cancelled"
                                ? ""
                                : "bg-amber-100 text-amber-800"
                          }
                        >
                          {b.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
