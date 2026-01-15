import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  MapPin,
  Users,
  ExternalLink,
  BadgeCheck,
  Star,
  PenLine,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StarRating } from "@/components/star-rating";
import { ReviewCard } from "@/components/review-card";
import { ReviewsSchema } from "@/components/structured-data";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/actions/auth";
import type { ReviewWithProfile } from "@/types/database";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getCompany(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("*")
    .eq("slug", slug)
    .single();
  return data;
}

async function getReviews(companyId: string): Promise<ReviewWithProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(
      `
      *,
      profiles:user_id (display_name),
      review_responses (*)
    `
    )
    .eq("company_id", companyId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  return (data as ReviewWithProfile[]) || [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompany(slug);

  if (!company) {
    return {
      title: "Company Not Found",
    };
  }

  return {
    title: company.name,
    description:
      company.description ||
      `Read reviews and ratings for ${company.name}. Find out what candidates and hiring managers say about working with this recruitment company.`,
  };
}

export default async function CompanyPage({ params }: PageProps) {
  const { slug } = await params;
  const [company, user] = await Promise.all([getCompany(slug), getUser()]);

  if (!company) {
    notFound();
  }

  const reviews = await getReviews(company.id);

  const ratingBreakdown = reviews.length > 0
    ? {
        communication:
          reviews.reduce((acc, r) => acc + r.rating_communication, 0) /
          reviews.length,
        candidateCare:
          reviews.reduce((acc, r) => acc + r.rating_candidate_care, 0) /
          reviews.length,
        jobQuality:
          reviews.reduce((acc, r) => acc + r.rating_job_quality, 0) /
          reviews.length,
        speed:
          reviews.reduce((acc, r) => acc + r.rating_speed, 0) / reviews.length,
      }
    : null;

  const isOwner = user && company.owner_id === user.id;

  return (
    <>
      <ReviewsSchema company={company} reviews={reviews} />
      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Company Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={`${company.name} logo`}
                    className="h-24 w-24 rounded-lg object-contain bg-muted flex-shrink-0"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl font-bold text-primary">
                      {company.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-2xl font-bold">{company.name}</h1>
                      {company.is_verified && (
                        <Tooltip>
                          <TooltipTrigger>
                            <BadgeCheck className="h-6 w-6 text-blue-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Verified company owner</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <StarRating
                        rating={company.average_rating || 0}
                        size="lg"
                        showValue
                      />
                      <span className="text-muted-foreground">
                        {company.review_count} review
                        {company.review_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {company.description && (
                    <p className="text-muted-foreground">{company.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {company.locations.length > 0 && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{company.locations.join(", ")}</span>
                      </div>
                    )}
                    {company.size && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{company.size} employees</span>
                      </div>
                    )}
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Website</span>
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {company.sectors.map((sector) => (
                      <Badge key={sector} variant="secondary">
                        {sector}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                Reviews ({company.review_count})
              </h2>
              <Link href={`/companies/${company.slug}/review`}>
                <Button>
                  <PenLine className="mr-2 h-4 w-4" />
                  Write a Review
                </Button>
              </Link>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    currentUserId={user?.id}
                    isOwner={isOwner}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Star className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to share your experience with {company.name}
                  </p>
                  <Link href={`/companies/${company.slug}/review`}>
                    <Button>Write a Review</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Rating Breakdown */}
          {ratingBreakdown && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rating Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Communication</span>
                  <StarRating rating={ratingBreakdown.communication} size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Candidate Care</span>
                  <StarRating rating={ratingBreakdown.candidateCare} size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Job Quality</span>
                  <StarRating rating={ratingBreakdown.jobQuality} size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Process Speed</span>
                  <StarRating rating={ratingBreakdown.speed} size="sm" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Claim Company */}
          {!company.is_verified && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Is this your company?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Claim this profile to respond to reviews and manage your
                  company information.
                </p>
                <Link href={`/companies/${company.slug}/claim`}>
                  <Button variant="outline" className="w-full">
                    Claim this Company
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Owner Actions */}
          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Owner Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/companies/${company.slug}/manage`}>
                  <Button variant="outline" className="w-full">
                    Manage Company
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
        </div>
      </div>
    </>
  );
}
