import { Badge } from "@/components/ui/badge";
import type { RoomStatus } from "@/lib/types/enums";
import { getRoomStatusLabel } from "@/lib/format";

const statusStyles: Record<RoomStatus, string> = {
  available: "bg-status-available/10 text-status-available border-status-available/20",
  occupied: "bg-status-occupied/10 text-status-occupied border-status-occupied/20",
  cleaning: "bg-status-cleaning/10 text-status-cleaning border-status-cleaning/20",
  maintenance: "bg-status-maintenance/10 text-status-maintenance border-status-maintenance/20",
  reserved: "bg-status-reserved/10 text-status-reserved border-status-reserved/20",
};

const dotColors: Record<RoomStatus, string> = {
  available: "bg-status-available",
  occupied: "bg-status-occupied",
  cleaning: "bg-status-cleaning",
  maintenance: "bg-status-maintenance",
  reserved: "bg-status-reserved",
};

export default function RoomStatusBadge({ status, showDot = true }: { status: RoomStatus; showDot?: boolean }) {
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[4px] gap-1.5 ${statusStyles[status]}`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[status]}`} />}
      {getRoomStatusLabel(status)}
    </Badge>
  );
}
