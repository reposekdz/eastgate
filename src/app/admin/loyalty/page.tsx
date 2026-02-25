"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDate, formatCurrency } from "@/lib/format";
import { useSession } from "next-auth/react";
import { 
  RefreshCw, 
  Search, 
  Star,
  Gift,
  TrendingUp,
  Users,
  Crown,
  Award,
  Plus,
  Minus,
  Settings,
  Filter
} from "lucide-react";

// Helper function for API URL
const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
};

// Guest interface
interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  loyaltyTier: string;
  loyaltyPoints: number;
  totalStays: number;
  totalSpent: number;
  isVip: boolean;
  lastVisit: string | null;
}

const TIER_CONFIG = {
  bronze: { name: "Bronze", minPoints: 0, color: "bg-amber-700", textColor: "text-amber-700", borderColor: "border-amber-700" },
  silver: { name: "Silver", minPoints: 1000, color: "bg-gray-400", textColor: "text-gray-500", borderColor: "border-gray-400" },
  gold: { name: "Gold", minPoints: 5000, color: "bg-yellow-500", textColor: "text-yellow-600", borderColor: "border-yellow-500" },
  platinum: { name: "Platinum", minPoints: 15000, color: "bg-purple-600", textColor: "text-purple-600", borderColor: "border-purple-600" },
};

export default function LoyaltyManagement() {
  const { data: session } = useSession();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [pointsAction, setPointsAction] = useState<"add" | "redeem">("add");
  const [pointsAmount, setPointsAmount] = useState(0);
  const [pointsReason, setPointsReason] = useState("");

  const fetchLoyaltyData = useCallback(async () => {
    if (!session?.user?.branchId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        branchId: session.user.branchId,
        stats: "true",
      });

      const response = await fetch(`${getApiUrl()}/loyalty?${params}`, {
        headers: {
          "Authorization": `Bearer ${(session as any)?.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGuests(data.members || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching loyalty data:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchLoyaltyData();
  }, [fetchLoyaltyData]);

  const handlePointsAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuest || !session?.user?.branchId) return;

    try {
      const endpoint = pointsAction === "add" ? "POST" : "PUT";
      const body = pointsAction === "add" 
        ? { 
            guestId: selectedGuest.id, 
            points: pointsAmount, 
            reason: pointsReason,
            branchId: session.user.branchId 
          }
        : {
            guestId: selectedGuest.id,
            action: "redeem",
            points: pointsAmount,
            branchId: session.user.branchId,
          };

      const response = await fetch(`${getAuthenticatedApiUrl()}/loyalty`, {
        method: endpoint,
        headers: {
          "Authorization": `Bearer ${(session as any)?.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowPointsModal(false);
        setPointsAmount(0);
        setPointsReason("");
        fetchLoyaltyData();
      }
    } catch (error) {
      console.error("Error processing points:", error);
    }
  };

  const handleTierChange = async (guestId: string, newTier: string) => {
    if (!session?.user?.branchId) return;

    try {
      const response = await fetch(`${getAuthenticatedApiUrl()}/loyalty`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${(session as any)?.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guestId,
          action: "adjust_tier",
          newTier,
          reason: "Manual adjustment",
          branchId: session.user.branchId,
        }),
      });

      if (response.ok) {
        fetchLoyaltyData();
      }
    } catch (error) {
      console.error("Error updating tier:", error);
    }
  };

  const filteredGuests = guests.filter((guest) => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = !tierFilter || guest.loyaltyTier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "platinum": return <Crown className="h-4 w-4" />;
      case "gold": return <Award className="h-4 w-4" />;
      case "silver": return <Star className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Loyalty Program</h1>
            <p className="text-sm text-gray-500 mt-1">Manage member points, tiers, and rewards</p>
          </div>
          <button
            onClick={fetchLoyaltyData}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
                <p className="text-sm text-gray-500">Total Members</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPoints?.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Points</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
                <p className="text-sm text-gray-500">Total Value</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Gift className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.recentTierChanges}</p>
                <p className="text-sm text-gray-500">Tier Upgrades (30d)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tier Distribution */}
      {stats && (
        <div className="px-6 pb-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Tier Distribution</h3>
            <div className="flex gap-4">
              {Object.entries(TIER_CONFIG).map(([tier, config]) => {
                const count = stats.tierStats?.[tier] || 0;
                const percentage = stats.totalMembers > 0 ? Math.round((count / stats.totalMembers) * 100) : 0;
                return (
                  <div key={tier} className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`flex items-center gap-1 font-medium ${config.textColor}`}>
                        {getTierIcon(tier)}
                        {config.name}
                      </span>
                      <span className="text-sm text-gray-500">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${config.color}`} 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-6 py-3">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Tiers</option>
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
        </div>
      </div>

      {/* Members List */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              Loading members...
            </div>
          ) : filteredGuests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Gift className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No loyalty members found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stays</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Visit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredGuests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            {guest.avatar ? (
                              <img src={guest.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <span className="text-sm font-medium text-gray-600">
                                {guest.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{guest.name}</p>
                            <p className="text-sm text-gray-500">{guest.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={guest.loyaltyTier}
                          onChange={(e) => handleTierChange(guest.id, e.target.value)}
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${
                            TIER_CONFIG[guest.loyaltyTier as keyof typeof TIER_CONFIG]?.borderColor
                          } ${TIER_CONFIG[guest.loyaltyTier as keyof typeof TIER_CONFIG]?.textColor} bg-white`}
                        >
                          {Object.entries(TIER_CONFIG).map(([tier, config]) => (
                            <option key={tier} value={tier}>{config.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-900">{guest.loyaltyPoints.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{guest.totalStays}</td>
                      <td className="px-4 py-3 text-gray-600">{formatCurrency(guest.totalSpent)}</td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {guest.lastVisit ? formatDate(guest.lastVisit) : "Never"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedGuest(guest);
                              setPointsAction("add");
                              setShowPointsModal(true);
                            }}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Add Points"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedGuest(guest);
                              setPointsAction("redeem");
                              setShowPointsModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Redeem Points"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Points Modal */}
      {showPointsModal && selectedGuest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">
                {pointsAction === "add" ? "Add Points" : "Redeem Points"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Member: {selectedGuest.name} • Current: {selectedGuest.loyaltyPoints.toLocaleString()} points
              </p>
            </div>
            
            <form onSubmit={handlePointsAction} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points Amount
                </label>
                <input
                  type="number"
                  min="1"
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              
              {pointsAction === "add" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason
                  </label>
                  <select
                    value={pointsReason}
                    onChange={(e) => setPointsReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select reason</option>
                    <option value="stay">Hotel Stay</option>
                    <option value="dining">Dining</option>
                    <option value="spa">Spa Service</option>
                    <option value="promotion">Promotion Bonus</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}
              
              {pointsAction === "redeem" && pointsAmount > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    This redemption will be worth approximately <strong>${((pointsAmount / 100) * 10).toFixed(2)}</strong> in rewards
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPointsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 text-white rounded-lg ${
                    pointsAction === "add" 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {pointsAction === "add" ? "Add Points" : "Redeem Points"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const getAuthenticatedApiUrl = () => {
  return getApiUrl();
};

