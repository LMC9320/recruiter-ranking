"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, X, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StarRating } from "@/components/star-rating";
import { createClient } from "@/lib/supabase/client";
import { updateReviewStatus, deleteReviewAdmin } from "@/lib/actions/admin";
import { formatDate } from "@/lib/utils";
import type { Review, ReviewStatus } from "@/types/database";

interface ReviewWithCompany extends Review {
  companies: { name: string; slug: string };
  profiles: { display_name: string | null };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReviewStatus | "all">("all");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    async function loadReviews() {
      setLoading(true);
      const supabase = createClient();

      let query = supabase
        .from("reviews")
        .select(
          `
          *,
          companies (name, slug),
          profiles:user_id (display_name)
        `
        )
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data } = await query.limit(50);
      setReviews((data as ReviewWithCompany[]) || []);
      setLoading(false);
    }
    loadReviews();
  }, [filter]);

  async function handleStatusChange(reviewId: string, status: ReviewStatus) {
    setProcessing(reviewId);
    await updateReviewStatus(reviewId, status);
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, status } : r))
    );
    setProcessing(null);
  }

  async function handleDelete(reviewId: string) {
    if (!confirm("Are you sure you want to delete this review?")) return;
    setProcessing(reviewId);
    await deleteReviewAdmin(reviewId);
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    setProcessing(null);
  }

  const getStatusBadge = (status: ReviewStatus) => {
    const variants: Record<ReviewStatus, "default" | "secondary" | "destructive" | "outline"> = {
      approved: "default",
      pending: "secondary",
      rejected: "destructive",
      flagged: "outline",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Review Moderation</h2>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as ReviewStatus | "all")}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="flagged">Flagged</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No reviews found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {review.companies.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      By {review.profiles?.display_name || "Anonymous"} -{" "}
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(review.status)}
                    <StarRating rating={review.overall_rating} size="sm" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{review.summary}</p>

                {review.pros && (
                  <div>
                    <span className="text-sm font-medium text-green-600">
                      Pros:{" "}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {review.pros}
                    </span>
                  </div>
                )}

                {review.cons && (
                  <div>
                    <span className="text-sm font-medium text-red-600">
                      Cons:{" "}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {review.cons}
                    </span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {review.status !== "approved" && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(review.id, "approved")}
                      disabled={processing === review.id}
                      className="gap-1"
                    >
                      {processing === review.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Approve
                    </Button>
                  )}
                  {review.status !== "flagged" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(review.id, "flagged")}
                      disabled={processing === review.id}
                      className="gap-1"
                    >
                      <Flag className="h-4 w-4" />
                      Flag
                    </Button>
                  )}
                  {review.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(review.id, "rejected")}
                      disabled={processing === review.id}
                      className="gap-1"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(review.id)}
                    disabled={processing === review.id}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
