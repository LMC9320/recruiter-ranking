"use client";

import { useState } from "react";
import { ThumbsUp, MessageSquare, User } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StarRating } from "@/components/star-rating";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { ReviewWithProfile } from "@/types/database";

interface ReviewCardProps {
  review: ReviewWithProfile;
  currentUserId?: string;
  isOwner?: boolean;
}

export function ReviewCard({ review, currentUserId }: ReviewCardProps) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count);
  const [hasVoted, setHasVoted] = useState(false);

  const handleHelpfulVote = async () => {
    if (!currentUserId || hasVoted) return;

    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("helpful_votes") as any).insert({
      review_id: review.id,
      user_id: currentUserId,
    });

    if (!error) {
      setHelpfulCount((prev) => prev + 1);
      setHasVoted(true);
    }
  };

  const ratingCategories = [
    { label: "Communication", value: review.rating_communication },
    { label: "Candidate Care", value: review.rating_candidate_care },
    { label: "Job Quality", value: review.rating_job_quality },
    { label: "Process Speed", value: review.rating_speed },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">
                {review.profiles?.display_name || "Anonymous"}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {review.reviewer_type === "candidate"
                    ? "Candidate"
                    : "Hiring Manager"}
                </Badge>
                <span>{formatDate(review.created_at)}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <StarRating rating={review.overall_rating} showValue />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rating Breakdown */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {ratingCategories.map((category) => (
            <div key={category.label} className="flex items-center justify-between">
              <span className="text-muted-foreground">{category.label}</span>
              <StarRating rating={category.value} size="sm" />
            </div>
          ))}
        </div>

        <Separator />

        {/* Review Content */}
        <div className="space-y-3">
          <p className="text-sm">{review.summary}</p>

          {review.pros && (
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">Pros</p>
              <p className="text-sm text-muted-foreground">{review.pros}</p>
            </div>
          )}

          {review.cons && (
            <div>
              <p className="text-sm font-medium text-red-600 mb-1">Cons</p>
              <p className="text-sm text-muted-foreground">{review.cons}</p>
            </div>
          )}
        </div>

        {/* Company Response */}
        {review.review_responses && review.review_responses.length > 0 && (
          <>
            <Separator />
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Company Response</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {review.review_responses[0].response_text}
              </p>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHelpfulVote}
            disabled={!currentUserId || hasVoted}
            className="gap-2"
          >
            <ThumbsUp className={`h-4 w-4 ${hasVoted ? "fill-current" : ""}`} />
            Helpful ({helpfulCount})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
