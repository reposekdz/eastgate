"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Users, TrendingUp, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function ReportsPage() {
  const { user } = useAuthStore();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("daily");

  useEffect(() => {
    fetchReport();
  }, [user?.branchId, reportType]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/receptionist/reports?branchId=${user?.branchId}&type=${reportType}`);
      const data = await res.json();
      if (data.success) {
        setReport(data.report);
      }
    } catch (error) {
      toast.error("Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reports</h1>
        <Button onClick={fetchReport}>
          <Download className="h-4 w-4 mr-2" />
          Generate
        </Button>
      </div>

      <select
        value={reportType}
        onChange={(e) => setReportType(e.target.value)}
        className="px-4 py-2 border rounded-md"
      >
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : report ? (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Check-ins</p>
                  <p className="text-2xl font-bold">{report.summary.totalCheckIns}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Check-outs</p>
                  <p className="text-2xl font-bold">{report.summary.totalCheckOuts}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Occupancy</p>
                  <p className="text-2xl font-bold">{report.summary.currentOccupancy}%</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <DollarSign className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">
                    {(report.summary.totalRevenue / 1000).toFixed(0)}K
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Room Status</h3>
            <div className="grid grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Occupied</p>
                <p className="text-xl font-bold">{report.roomStatus.occupied}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-xl font-bold">{report.roomStatus.available}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cleaning</p>
                <p className="text-xl font-bold">{report.roomStatus.cleaning}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Maintenance</p>
                <p className="text-xl font-bold">{report.roomStatus.maintenance}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reserved</p>
                <p className="text-xl font-bold">{report.roomStatus.reserved}</p>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
