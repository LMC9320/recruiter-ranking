import { Building2, MessageSquare, FileCheck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

async function getStats() {
  const supabase = await createClient();

  const [
    { count: companyCount },
    { count: reviewCount },
    { count: pendingClaimsCount },
    { count: pendingReviewsCount },
  ] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase.from("reviews").select("*", { count: "exact", head: true }),
    supabase
      .from("claim_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  return {
    companies: companyCount || 0,
    reviews: reviewCount || 0,
    pendingClaims: pendingClaimsCount || 0,
    pendingReviews: pendingReviewsCount || 0,
  };
}

export default async function AdminPage() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Dashboard Overview</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Companies
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.companies}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reviews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Claims
            </CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingClaims}</div>
            {stats.pendingClaims > 0 && (
              <p className="text-xs text-amber-600">Requires attention</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Reviews
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReviews}</div>
            {stats.pendingReviews > 0 && (
              <p className="text-xs text-amber-600">Requires moderation</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
