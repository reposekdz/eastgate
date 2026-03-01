"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function ServicesPage() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [user?.branchId]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/receptionist/service-requests?branchId=${user?.branchId}`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.serviceRequests);
      }
    } catch (error) {
      toast.error("Failed to fetch service requests");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/receptionist/service-requests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      toast.success("Status updated");
      fetchRequests();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-emerald" />
            Service Requests
          </h1>
          <p className="text-muted-foreground">Manage guest service requests</p>
        </div>
        <Button onClick={fetchRequests} variant="outline">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <Card key={req.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="font-semibold">{req.guest} - Room {req.room}</h3>
                  <p className="text-sm">{req.type}</p>
                  <Badge>{req.priority}</Badge>
                </div>
                <div className="flex gap-2">
                  {req.status === "pending" && (
                    <Button size="sm" onClick={() => updateStatus(req.id, "in_progress")}>Start</Button>
                  )}
                  {req.status === "in_progress" && (
                    <Button size="sm" onClick={() => updateStatus(req.id, "completed")}>Complete</Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {requests.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No service requests</div>
          )}
        </div>
      )}
    </div>
  );
}
