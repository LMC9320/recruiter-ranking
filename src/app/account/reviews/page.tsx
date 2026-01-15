"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/star-rating";
import { createClient } from "@/lib/supabase/client";
import { deleteReview } from "@/lib/actions/reviews";
import { formatDate } from "@/lib/utils";
import type { Review } from "@/types/database";

interface ReviewWithCompany extends Review {
  companies: { name: string; slug: string };
}

export default function MyReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("reviews")
        .select("*, companies (name, slug)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setReviews((data as ReviewWithCompany[]) || []);
      setLoading(false);
    }

    fetchReviews();
  }, [router]);

  async function handleDelete(reviewId: string, companySlug: string) {
    if (!confirm("Are you sure you want to delete this review?")) return;

    setDeleting(reviewId);
    const result = await deleteReview(reviewId, companySlug);

    if (!result.error) {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    }

    setDeleting(null);
  }

  if (loading) {
    return (
      <div className="container py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl">
      <Link
        href="/account"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Account
      </Link>

      <h1 className="text-2xl font-bold mb-8">My Reviews</h1>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              You haven&apos;t written any reviews yet
            </p>
            <Link href="/companies">
              <Button>Browse Companies</Button>
            </Link>
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
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        review.status === "approved"
                          ? "default"
                          : review.status === "pending"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {review.status}
                    </Badge>
                    <StarRating rating={review.overall_rating} size="sm" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{review.summary}</p>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Communication</span>
                    <StarRating rating={review.rating_communication} size="sm" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Candidate Care</span>
                    <StarRating rating={review.rating_candidate_care} size="sm" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Job Quality</span>
                    <StarRating rating={review.rating_job_quality} size="sm" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Process Speed</span>
                    <StarRating rating={review.rating_speed} size="sm" />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Link href={`/companies/${review.companies.slug}`}>
                    <Button size="sm" variant="outline" className="gap-1">
                      <ExternalLink className="h-4 w-4" />
                      View Company
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      handleDelete(review.id, review.companies.slug)
                    }
                    disabled={deleting === review.id}
                    className="gap-1"
                  >
                    {deleting === review.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
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
