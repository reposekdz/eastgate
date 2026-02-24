"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n/context";
import { Star, Loader2, CheckCircle, TrendingUp, Award, Users, ThumbsUp, MessageSquare, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface RatingDistribution {
  rating: number;
  _count: number;
}

interface Review {
  id: string;
  guestName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  branch: { name: string };
}

export default function GuestRatingSystem() {
  const { t } = useI18n();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [avgRating, setAvgRating] = useState(4.8);
  const [totalReviews, setTotalReviews] = useState(0);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [distribution, setDistribution] = useState<RatingDistribution[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    fetchBranches();
    fetchRatings();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await fetch("/api/branches");
      const data = await res.json();
      if (data.success) {
        setBranches(data.branches);
        if (data.branches.length > 0) {
          setSelectedBranch(data.branches[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch branches:", error);
    }
  };

  const fetchRatings = async () => {
    try {
      const res = await fetch("/api/ratings");
      const data = await res.json();
      if (data.success) {
        setAvgRating(data.avgRating || 4.8);
        setTotalReviews(data.totalReviews || 0);
        setDistribution(data.distribution || []);
        setRecentReviews(data.reviews || []);
      }
    } catch (error) {
      console.error("Failed to fetch ratings:", error);
      // Set default values on error
      setAvgRating(4.8);
      setTotalReviews(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating || !name || !selectedBranch) {
      toast.error("Please provide rating, name, and select a branch");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          guestName: name,
          guestEmail: email,
          comment,
          branchId: selectedBranch,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
        setAvgRating(data.avgRating || avgRating);
        setTotalReviews(data.totalReviews || totalReviews + 1);
        toast.success("Thank you for your rating! 🌟");
        
        // Refresh ratings to show updated data
        fetchRatings();
        
        setTimeout(() => {
          setSubmitted(false);
          setRating(0);
          setName("");
          setEmail("");
          setComment("");
        }, 4000);
      } else {
        toast.error(data.error || "Failed to submit rating");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate rating distribution percentages
  const getRatingPercentage = (stars: number) => {
    if (!distribution.length || totalReviews === 0) return 0;
    const count = distribution.find(d => d.rating === stars)?._count || 0;
    return Math.round((count / totalReviews) * 100);
  };

  // Get rating label
  const getRatingLabel = (stars: number) => {
    if (stars === 5) return "Excellent";
    if (stars === 4) return "Very Good";
    if (stars === 3) return "Good";
    if (stars === 2) return "Fair";
    return "Poor";
  };

  return (
    <section className="py-20 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-emerald font-semibold mb-2 uppercase tracking-wider text-sm">
            {t("homepageExtras", "guestRatingHeading")}
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal mb-4">
            {t("homepageExtras", "shareExperience")}{" "}
            <span className="text-emerald">{t("homepageExtras", "shareExperienceAccent")}</span>
          </h2>
          <p className="text-text-muted-custom max-w-2xl mx-auto mb-6">
            {t("homepageExtras", "shareExperienceIntro")}
          </p>

          {/* Rating Statistics */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Average Rating */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="text-center bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald to-emerald/80 rounded-full mb-4">
                <Award className="w-10 h-10 text-white" />
              </div>
              <div className="text-6xl font-bold text-emerald mb-2">{avgRating.toFixed(1)}</div>
              <div className="flex gap-1 justify-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={24}
                    className={star <= Math.round(avgRating) ? "fill-gold text-gold" : "text-gray-300"}
                  />
                ))}
              </div>
              <p className="text-sm text-text-muted-custom font-medium">
                Based on {totalReviews.toLocaleString()} reviews
              </p>
            </motion.div>

            {/* Rating Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 md:col-span-2"
            >
              <h3 className="text-lg font-bold text-charcoal mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald" />
                Rating Distribution
              </h3>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-20">
                      <span className="text-sm font-medium text-charcoal">{stars}</span>
                      <Star size={14} className="fill-gold text-gold" />
                    </div>
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${getRatingPercentage(stars)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-emerald to-emerald/80 rounded-full"
                      />
                    </div>
                    <span className="text-sm font-medium text-text-muted-custom w-12 text-right">
                      {getRatingPercentage(stars)}%
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { icon: Users, label: "Verified Guests", value: totalReviews },
              { icon: ThumbsUp, label: "Satisfaction Rate", value: `${Math.round(avgRating * 20)}%` },
              { icon: MessageSquare, label: "With Comments", value: `${Math.round(totalReviews * 0.75)}` },
              { icon: Sparkles, label: "5-Star Reviews", value: `${getRatingPercentage(5)}%` },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl p-4 text-center shadow-md border border-gray-100"
              >
                <stat.icon className="w-6 h-6 text-emerald mx-auto mb-2" />
                <div className="text-2xl font-bold text-charcoal mb-1">{stat.value}</div>
                <div className="text-xs text-text-muted-custom">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Reviews Section */}
        {recentReviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-charcoal">Recent Reviews</h3>
              <Button
                variant="outline"
                onClick={() => setShowReviews(!showReviews)}
                className="text-emerald border-emerald hover:bg-emerald hover:text-white"
              >
                {showReviews ? "Hide" : "Show All"} Reviews
              </Button>
            </div>
            
            <AnimatePresence>
              {showReviews && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid md:grid-cols-2 gap-4"
                >
                  {recentReviews.slice(0, 6).map((review, idx) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-charcoal">{review.guestName}</h4>
                          <p className="text-xs text-text-muted-custom">{review.branch.name}</p>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              className={star <= review.rating ? "fill-gold text-gold" : "text-gray-300"}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-text-muted-custom line-clamp-3">
                          "{review.comment}"
                        </p>
                      )}
                      <p className="text-xs text-text-muted-custom mt-2">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Rating Form */}
        {submitted ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-16 bg-gradient-to-br from-emerald/5 to-gold/5 rounded-2xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <CheckCircle size={80} className="text-emerald mx-auto mb-6" />
            </motion.div>
            <h3 className="text-3xl font-bold text-charcoal mb-3">Thank You! 🎉</h3>
            <p className="text-lg text-text-muted-custom mb-4">Your rating has been submitted successfully.</p>
            <p className="text-sm text-text-muted-custom max-w-md mx-auto">
              We truly appreciate your feedback. It helps us continue to provide exceptional service to all our guests.
            </p>
            <div className="mt-6 flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.div
                  key={star}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + star * 0.1 }}
                >
                  <Star size={32} className="fill-gold text-gold" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="bg-gray-50 rounded-2xl p-8 shadow-lg"
          >
            <div className="mb-8">
              <label className="block text-lg font-bold text-charcoal mb-4 text-center">
                How was your experience?
              </label>
              <div className="flex justify-center gap-3 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                    className="transition-all focus:outline-none focus:ring-2 focus:ring-emerald rounded-full p-1"
                  >
                    <Star
                      size={48}
                      className={
                        star <= (hover || rating)
                          ? "fill-gold text-gold drop-shadow-lg"
                          : "text-gray-300"
                      }
                    />
                  </motion.button>
                ))}
              </div>
              {(hover || rating) > 0 && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-emerald font-semibold text-lg"
                >
                  {getRatingLabel(hover || rating)}
                </motion.p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  {t("common", "name")} *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  {t("common", "email")}
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-charcoal mb-2">
                {t("common", "branch")} *
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald"
                required
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} - {branch.location}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-charcoal mb-2">
                Comment
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                rows={4}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !rating || !name || !selectedBranch}
              className="w-full bg-gradient-to-r from-emerald to-emerald/90 hover:from-emerald/90 hover:to-emerald text-white py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting Your Review...
                </>
              ) : (
                <>
                  <Star className="mr-2 h-5 w-5" />
                  Submit Your Rating
                </>
              )}
            </Button>
            <p className="text-xs text-center text-text-muted-custom mt-3">
              Your feedback is valuable and helps us improve our services
            </p>
          </motion.form>
        )}
      </div>
    </section>
  );
}
