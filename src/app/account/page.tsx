import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Star, Building2, FileCheck, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { Profile, Company, Review } from "@/types/database";

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single() as { data: Profile | null };

  // Get user's reviews
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, companies (name, slug)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5) as { data: (Review & { companies: { name: string; slug: string } })[] | null };

  // Get user's claimed companies
  const { data: claimedCompanies } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_id", user.id) as { data: Company[] | null };

  // Get pending claims
  const { data: pendingClaims } = await supabase
    .from("claim_requests")
    .select("*, companies (name, slug)")
    .eq("user_id", user.id)
    .eq("status", "pending") as { data: { id: string; created_at: string; companies: { name: string; slug: string } }[] | null };

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-8">My Account</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">
                Display Name
              </label>
              <p className="font-medium">
                {profile?.display_name || "Not set"}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">
                Member Since
              </label>
              <p className="font-medium">
                {formatDate(user.created_at)}
              </p>
            </div>
            {profile?.is_admin && (
              <Badge variant="secondary">Admin</Badge>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {reviews?.length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Reviews Written</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {claimedCompanies?.length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Companies Owned</p>
              </div>
            </div>
            <Link href="/account/reviews">
              <Button variant="outline" className="w-full">
                View All My Reviews
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Protect your account with two-factor authentication (2FA)
            </p>
            <Link href="/account/security">
              <Button variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                Manage 2FA Settings
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Claimed Companies */}
        {claimedCompanies && claimedCompanies.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                My Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {claimedCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {company.review_count} reviews -{" "}
                        {company.average_rating?.toFixed(1) || "No"} rating
                      </p>
                    </div>
                    <Link href={`/companies/${company.slug}/manage`}>
                      <Button size="sm" variant="outline">
                        Manage
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Claims */}
        {pendingClaims && pendingClaims.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Pending Verification Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {(claim.companies as { name: string }).name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Submitted {formatDate(claim.created_at)}
                      </p>
                    </div>
                    <Badge variant="secondary">Pending Review</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Reviews */}
        {reviews && reviews.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Recent Reviews
              </CardTitle>
              <Link href="/account/reviews">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {(review.companies as { name: string }).name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {review.overall_rating.toFixed(1)} stars -{" "}
                        {formatDate(review.created_at)}
                      </p>
                    </div>
                    <Link
                      href={`/companies/${
                        (review.companies as { slug: string }).slug
                      }`}
                    >
                      <Button size="sm" variant="ghost">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Danger Zone */}
        <Card className="md:col-span-2 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Link href="/account/delete">
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
