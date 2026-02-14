"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, ThumbsUp, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

// Persist reviews in localStorage
function getStoredReviews(): Review[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("eastgate-reviews");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function storeReviews(reviews: Review[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("eastgate-reviews", JSON.stringify(reviews));
}

function getStoredAvg(): { avg: number; count: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("eastgate-rating-stats");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function storeStats(avg: number, count: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem("eastgate-rating-stats", JSON.stringify({ avg, count }));
}

export default function StarRating() {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [averageRating, setAverageRating] = useState(4.9);
  const [totalRatings, setTotalRatings] = useState(2847);

  // Load persisted data
  useEffect(() => {
    const stored = getStoredReviews();
    if (stored.length > 0) setReviews(stored);
    const stats = getStoredAvg();
    if (stats) {
      setAverageRating(stats.avg);
      setTotalRatings(stats.count);
    }
  }, []);

  const starLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  const handleSubmit = useCallback(() => {
    if (selected === 0) return;

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      name: name.trim() || "Anonymous Guest",
      rating: selected,
      comment: comment.trim(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      helpful: 0,
    };

    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    storeReviews(updatedReviews);

    // Update average
    const allRatings = totalRatings + 1;
    const newAvg = ((averageRating * totalRatings) + selected) / allRatings;
    setAverageRating(Math.round(newAvg * 10) / 10);
    setTotalRatings(allRatings);
    storeStats(Math.round(newAvg * 10) / 10, allRatings);

    setSubmitted(true);
    setShowForm(false);
    setComment("");
    setName("");
    toast.success("Murakoze! Your rating has been submitted.");

    setTimeout(() => {
      setSubmitted(false);
      setSelected(0);
    }, 4000);
  }, [selected, name, comment, reviews, totalRatings, averageRating]);

  const handleHelpful = (reviewId: string) => {
    const updated = reviews.map((r) =>
      r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r
    );
    setReviews(updated);
    storeReviews(updated);
  };

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <div className="relative">
      {/* Main Rating Display */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          className="inline-flex flex-col items-center"
        >
          <span className="font-heading text-5xl sm:text-6xl font-bold text-charcoal">
            {averageRating}
          </span>
          <div className="flex gap-1.5 my-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={24}
                className={cn(
                  "transition-colors",
                  star <= Math.round(averageRating)
                    ? "text-gold fill-gold"
                    : "text-gray-300"
                )}
              />
            ))}
          </div>
          <p className="body-sm text-text-muted-custom">
            Based on <span className="font-semibold text-charcoal">{totalRatings.toLocaleString()}</span> guest reviews
          </p>
        </motion.div>
      </div>

      {/* Interactive Rating Input */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="thank-you"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="h-16 w-16 rounded-full bg-emerald/10 flex items-center justify-center mx-auto mb-4"
              >
                <ThumbsUp size={28} className="text-emerald" />
              </motion.div>
              <h4 className="font-heading text-xl font-semibold text-charcoal mb-2">
                Murakoze cyane!
              </h4>
              <p className="body-sm text-text-muted-custom">
                Your feedback helps us improve our services
              </p>
            </motion.div>
          ) : (
            <motion.div key="rating-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h4 className="font-heading text-lg font-semibold text-charcoal text-center mb-1">
                Rate Your Experience
              </h4>
              <p className="body-sm text-text-muted-custom text-center mb-5">
                How was your stay at EastGate?
              </p>

              {/* Star Selector */}
              <div className="flex justify-center gap-2 sm:gap-3 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => {
                      setSelected(star);
                      if (!showForm) setShowForm(true);
                    }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className="relative cursor-pointer focus:outline-none"
                  >
                    <Star
                      size={36}
                      className={cn(
                        "transition-all duration-200",
                        (hovered || selected) >= star
                          ? "text-gold fill-gold drop-shadow-[0_0_8px_rgba(200,169,81,0.5)]"
                          : "text-gray-300 hover:text-gold/40"
                      )}
                    />
                    {/* Sparkle on hover */}
                    <AnimatePresence>
                      {hovered === star && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-gold"
                        />
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
              </div>

              {/* Label */}
              <AnimatePresence mode="wait">
                {(hovered > 0 || selected > 0) && (
                  <motion.p
                    key={hovered || selected}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-center body-sm font-medium text-gold-dark mb-4"
                  >
                    {starLabels[hovered || selected]}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Expanded Form */}
              <AnimatePresence>
                {showForm && selected > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pt-3 border-t border-gray-100">
                      <Input
                        placeholder="Your name (optional)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="text-sm"
                      />
                      <Textarea
                        placeholder="Tell us about your experience..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="text-sm min-h-[80px] resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSubmit}
                          className="flex-1 bg-gold hover:bg-gold-dark text-charcoal font-semibold rounded-[4px] gap-2"
                        >
                          <Send size={14} /> Submit Rating
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setShowForm(false); setSelected(0); }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recent Reviews */}
      {reviews.length > 0 && (
        <div className="mt-10 max-w-2xl mx-auto">
          <h4 className="font-heading text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
            <MessageSquare size={18} className="text-emerald" />
            Recent Reviews ({reviews.length})
          </h4>
          <div className="space-y-3">
            {displayedReviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-emerald/10 flex items-center justify-center text-sm font-semibold text-emerald">
                      {review.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-charcoal">{review.name}</p>
                      <p className="text-xs text-text-muted-custom">{review.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        className={s <= review.rating ? "text-gold fill-gold" : "text-gray-300"}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="body-sm text-slate-custom mb-2">{review.comment}</p>
                )}
                <button
                  onClick={() => handleHelpful(review.id)}
                  className="flex items-center gap-1.5 text-xs text-text-muted-custom hover:text-emerald transition-colors"
                >
                  <ThumbsUp size={12} /> Helpful ({review.helpful})
                </button>
              </motion.div>
            ))}
          </div>
          {reviews.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-4 text-sm font-medium text-emerald hover:text-emerald-dark transition-colors mx-auto block"
            >
              {showAll ? "Show Less" : `View All ${reviews.length} Reviews`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
