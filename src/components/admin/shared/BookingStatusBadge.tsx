import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/lib/types/enums";
import { getBookingStatusLabel } from "@/lib/format";

const statusStyles: Record<BookingStatus, string> = {
  pending: "bg-order-pending/10 text-order-pending border-order-pending/20",
  confirmed: "bg-emerald/10 text-emerald border-emerald/20",
  checked_in: "bg-status-occupied/10 text-status-occupied border-status-occupied/20",
  checked_out: "bg-slate-100 text-slate-custom border-slate-200",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  refunded: "bg-status-reserved/10 text-status-reserved border-status-reserved/20",
};

export default function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[4px] ${statusStyles[status]}`}
    >
      {getBookingStatusLabel(status)}
    </Badge>
  );
}
