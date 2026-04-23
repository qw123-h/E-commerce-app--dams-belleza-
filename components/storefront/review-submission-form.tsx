"use client";

import {FormEvent, useState} from "react";
import {useTranslations} from "next-intl";

export function ReviewSubmissionForm({productId}: {productId: string}) {
  const t = useTranslations("catalog.labels");
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{type: "success" | "error"; message: string} | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit review");
      }

      setFeedback({
        type: "success",
        message: t("reviewSubmitted"),
      });
      setRating(5);
      setComment("");

      // Auto-hide success message after 3 seconds
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : t("reviewError"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article className="rounded-3xl border border-charcoal-900/10 bg-cream-50 p-4 sm:p-6 shadow-lg shadow-charcoal-900/5">
      <h2 className="font-display text-xl sm:text-2xl text-charcoal-900">{t("submitReviewTitle")}</h2>
      <p className="mt-2 text-sm text-charcoal-700">{t("submitReviewSubtitle")}</p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Rating selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-charcoal-600">
            {t("ratingLabel")}
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                disabled={isSubmitting}
                className={`text-2xl transition ${
                  star <= rating
                    ? "text-charcoal-900 cursor-pointer"
                    : "text-charcoal-300 hover:text-charcoal-600"
                } disabled:opacity-50`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Comment field */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-charcoal-600">
            {t("commentLabel")}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 1000))}
            placeholder={t("commentPlaceholder")}
            disabled={isSubmitting}
            className="w-full rounded-2xl border border-charcoal-900/10 bg-white px-4 py-3 text-sm placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-charcoal-900/20 disabled:bg-charcoal-100"
            rows={4}
          />
          <p className="text-xs text-charcoal-600">{comment.length} / 1000</p>
        </div>

        {/* Feedback messages */}
        {feedback && (
          <div
            className={`rounded-2xl px-4 py-3 text-sm font-medium ${
              feedback.type === "success"
                ? "border border-green-200 bg-green-50 text-green-900"
                : "border border-red-200 bg-red-50 text-red-900"
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-charcoal-900 px-4 py-3 text-sm font-semibold text-cream-50 transition hover:bg-charcoal-700 disabled:bg-charcoal-400"
        >
          {isSubmitting ? t("submittingReview") : t("submitReview")}
        </button>
      </form>
    </article>
  );
}
