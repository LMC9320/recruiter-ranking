"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StarRating } from "@/components/star-rating";
import { submitReview } from "@/lib/actions/reviews";
import { createClient } from "@/lib/supabase/client";
import { RATING_CATEGORIES, REVIEWER_TYPES } from "@/lib/constants";
import type { Company } from "@/types/database";
import type { ReviewerType } from "@/types/database";

export default function WriteReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string>("");

  const [ratings, setRatings] = useState({
    communication: 0,
    candidateCare: 0,
    jobQuality: 0,
    speed: 0,
  });
  const [reviewerType, setReviewerType] = useState<ReviewerType>("candidate");
  const [summary, setSummary] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");

  useEffect(() => {
    async function fetchCompany() {
      const { slug: paramSlug } = await params;
      setSlug(paramSlug);

      const supabase = createClient();
      const { data } = await supabase
        .from("companies")
        .select("*")
        .eq("slug", paramSlug)
        .single();

      if (!data) {
        router.push("/companies");
        return;
      }

      setCompany(data);
      setLoading(false);
    }
    fetchCompany();
  }, [params, router]);

  const handleRatingChange = (
    key: keyof typeof ratings,
    value: number
  ) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Validate ratings
    if (Object.values(ratings).some((r) => r === 0)) {
      setError("Please provide all ratings");
      setSubmitting(false);
      return;
    }

    if (!summary.trim()) {
      setError("Please provide a summary of your experience");
      setSubmitting(false);
      return;
    }

    const result = await submitReview({
      companyId: company!.id,
      companySlug: slug,
      ratingCommunication: ratings.communication,
      ratingCandidateCare: ratings.candidateCare,
      ratingJobQuality: ratings.jobQuality,
      ratingSpeed: ratings.speed,
      pros: pros.trim(),
      cons: cons.trim(),
      summary: summary.trim(),
      reviewerType,
    });

    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="container py-8 max-w-2xl">
      <Link
        href={`/companies/${slug}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to {company.name}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Write a Review</CardTitle>
          <CardDescription>
            Share your experience with {company.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reviewer Type */}
            <div className="space-y-2">
              <Label>I am a...</Label>
              <Select
                value={reviewerType}
                onValueChange={(value) =>
                  setReviewerType(value as ReviewerType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REVIEWER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ratings */}
            <div className="space-y-4">
              <Label>Rate your experience</Label>
              {RATING_CATEGORIES.map((category) => (
                <div
                  key={category.key}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{category.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                  <StarRating
                    rating={
                      ratings[category.key as keyof typeof ratings]
                    }
                    size="lg"
                    interactive
                    onRatingChange={(value) =>
                      handleRatingChange(
                        category.key as keyof typeof ratings,
                        value
                      )
                    }
                  />
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <Label htmlFor="summary">Summary *</Label>
              <Textarea
                id="summary"
                placeholder="Summarize your overall experience..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={4}
                required
              />
            </div>

            {/* Pros */}
            <div className="space-y-2">
              <Label htmlFor="pros">Pros</Label>
              <Textarea
                id="pros"
                placeholder="What did you like about working with them?"
                value={pros}
                onChange={(e) => setPros(e.target.value)}
                rows={3}
              />
            </div>

            {/* Cons */}
            <div className="space-y-2">
              <Label htmlFor="cons">Cons</Label>
              <Textarea
                id="cons"
                placeholder="What could be improved?"
                value={cons}
                onChange={(e) => setCons(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
            >
              {submitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit Review
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
