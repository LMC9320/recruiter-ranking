import { Suspense } from "react";
import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CompanyCard } from "@/components/company-card";
import { CompanyFilters } from "@/components/company-filters";
import { createClient } from "@/lib/supabase/server";
import type { Company } from "@/types/database";

export const metadata: Metadata = {
  title: "Browse Recruitment Companies",
  description:
    "Find and compare recruitment companies. Filter by sector, location, and ratings to find the perfect recruiter for your needs.",
};

interface SearchParams {
  search?: string;
  sector?: string;
  location?: string;
  rating?: string;
  sort?: string;
}

async function getCompanies(searchParams: SearchParams): Promise<Company[]> {
  const supabase = await createClient();

  let query = supabase.from("companies").select("*");

  // Apply search filter
  if (searchParams.search) {
    query = query.ilike("name", `%${searchParams.search}%`);
  }

  // Apply sector filter
  if (searchParams.sector) {
    query = query.contains("sectors", [searchParams.sector]);
  }

  // Apply location filter
  if (searchParams.location) {
    query = query.contains("locations", [searchParams.location]);
  }

  // Apply rating filter
  if (searchParams.rating) {
    query = query.gte("average_rating", parseFloat(searchParams.rating));
  }

  // Apply sorting
  switch (searchParams.sort) {
    case "reviews":
      query = query.order("review_count", { ascending: false });
      break;
    case "recent":
      query = query.order("updated_at", { ascending: false });
      break;
    case "name":
      query = query.order("name", { ascending: true });
      break;
    case "rating":
    default:
      query = query.order("average_rating", {
        ascending: false,
        nullsFirst: false,
      });
      break;
  }

  const { data } = await query as { data: Company[] | null };
  return data || [];
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const companies = await getCompanies(params);

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse Recruitment Companies</h1>
        <p className="text-muted-foreground">
          Discover and compare recruitment companies based on real reviews
        </p>
      </div>

      <Suspense fallback={<div>Loading filters...</div>}>
        <CompanyFilters />
      </Suspense>

      <div className="mt-8">
        {companies.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Showing {companies.length} compan{companies.length === 1 ? "y" : "ies"}
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No companies found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search terms
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
