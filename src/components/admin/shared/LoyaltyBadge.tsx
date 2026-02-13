import { Badge } from "@/components/ui/badge";
import type { LoyaltyTier } from "@/lib/types/enums";
import { getLoyaltyTierLabel } from "@/lib/format";
import { Award } from "lucide-react";

const tierStyles: Record<string, string> = {
  silver: "bg-loyalty-silver/10 text-loyalty-silver border-loyalty-silver/20",
  gold: "bg-loyalty-gold/10 text-loyalty-gold border-loyalty-gold/20",
  platinum: "bg-loyalty-platinum/10 text-loyalty-platinum border-loyalty-platinum/20",
  member: "bg-slate-100 text-slate-custom border-slate-200",
};

export default function LoyaltyBadge({ tier }: { tier: LoyaltyTier | null }) {
  const style = tier ? tierStyles[tier] : tierStyles.member;
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[4px] gap-1 ${style}`}
    >
      <Award className="h-3 w-3" />
      {getLoyaltyTierLabel(tier)}
    </Badge>
  );
}
