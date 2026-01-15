"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ReviewerType } from "@/types/database";
import { calculateOverallRating } from "@/lib/utils";

interface ReviewFormData {
  companyId: string;
  companySlug: string;
  ratingCommunication: number;
  ratingCandidateCare: number;
  ratingJobQuality: number;
  ratingSpeed: number;
  pros: string;
  cons: string;
  summary: string;
  reviewerType: ReviewerType;
}

export async function submitReview(data: ReviewFormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to submit a review" };
  }

  // Check if user already reviewed this company
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("company_id", data.companyId)
    .eq("user_id", user.id)
    .single();

  if (existingReview) {
    return { error: "You have already reviewed this company" };
  }

  const overallRating = calculateOverallRating({
    communication: data.ratingCommunication,
    candidateCare: data.ratingCandidateCare,
    jobQuality: data.ratingJobQuality,
    speed: data.ratingSpeed,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("reviews") as any).insert({
    company_id: data.companyId,
    user_id: user.id,
    rating_communication: data.ratingCommunication,
    rating_candidate_care: data.ratingCandidateCare,
    rating_job_quality: data.ratingJobQuality,
    rating_speed: data.ratingSpeed,
    overall_rating: overallRating,
    pros: data.pros,
    cons: data.cons,
    summary: data.summary,
    reviewer_type: data.reviewerType,
    status: "approved", // Auto-approve for MVP, can change to 'pending' for moderation
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/companies/${data.companySlug}`);
  redirect(`/companies/${data.companySlug}?review=success`);
}

export async function updateReview(
  reviewId: string,
  companySlug: string,
  data: Partial<ReviewFormData>
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to update a review" };
  }

  // Verify ownership
  const { data: review } = await supabase
    .from("reviews")
    .select("user_id")
    .eq("id", reviewId)
    .single() as { data: { user_id: string } | null };

  if (!review || review.user_id !== user.id) {
    return { error: "You can only edit your own reviews" };
  }

  const updateData: Record<string, unknown> = {};

  if (data.ratingCommunication !== undefined) {
    updateData.rating_communication = data.ratingCommunication;
  }
  if (data.ratingCandidateCare !== undefined) {
    updateData.rating_candidate_care = data.ratingCandidateCare;
  }
  if (data.ratingJobQuality !== undefined) {
    updateData.rating_job_quality = data.ratingJobQuality;
  }
  if (data.ratingSpeed !== undefined) {
    updateData.rating_speed = data.ratingSpeed;
  }
  if (data.pros !== undefined) updateData.pros = data.pros;
  if (data.cons !== undefined) updateData.cons = data.cons;
  if (data.summary !== undefined) updateData.summary = data.summary;
  if (data.reviewerType !== undefined) {
    updateData.reviewer_type = data.reviewerType;
  }

  // Recalculate overall rating if any rating changed
  if (
    data.ratingCommunication !== undefined ||
    data.ratingCandidateCare !== undefined ||
    data.ratingJobQuality !== undefined ||
    data.ratingSpeed !== undefined
  ) {
    const { data: currentReview } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", reviewId)
      .single() as { data: { rating_communication: number; rating_candidate_care: number; rating_job_quality: number; rating_speed: number } | null };

    if (currentReview) {
      updateData.overall_rating = calculateOverallRating({
        communication:
          data.ratingCommunication ?? currentReview.rating_communication,
        candidateCare:
          data.ratingCandidateCare ?? currentReview.rating_candidate_care,
        jobQuality: data.ratingJobQuality ?? currentReview.rating_job_quality,
        speed: data.ratingSpeed ?? currentReview.rating_speed,
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("reviews") as any)
    .update(updateData)
    .eq("id", reviewId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/companies/${companySlug}`);
  return { success: true };
}

export async function deleteReview(reviewId: string, companySlug: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to delete a review" };
  }

  // Verify ownership
  const { data: review } = await supabase
    .from("reviews")
    .select("user_id")
    .eq("id", reviewId)
    .single() as { data: { user_id: string } | null };

  if (!review || review.user_id !== user.id) {
    return { error: "You can only delete your own reviews" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("reviews") as any).delete().eq("id", reviewId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/companies/${companySlug}`);
  return { success: true };
}

export async function submitReviewResponse(
  reviewId: string,
  companySlug: string,
  responseText: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in" };
  }

  // Verify user is the company owner
  const { data: review } = await supabase
    .from("reviews")
    .select("company_id, companies!inner(owner_id)")
    .eq("id", reviewId)
    .single() as { data: { company_id: string; companies: { owner_id: string } } | null };

  if (!review || review.companies.owner_id !== user.id) {
    return { error: "Only the company owner can respond to reviews" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("review_responses") as any).insert({
    review_id: reviewId,
    user_id: user.id,
    response_text: responseText,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/companies/${companySlug}`);
  return { success: true };
}
