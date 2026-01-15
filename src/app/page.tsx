import Link from "next/link";
import { Search, Star, Users, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CompanyCard } from "@/components/company-card";
import { createClient } from "@/lib/supabase/server";
import type { Company } from "@/types/database";

async function getFeaturedCompanies(): Promise<Company[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("*")
    .order("average_rating", { ascending: false, nullsFirst: false })
    .limit(6) as { data: Company[] | null };
  return data || [];
}

async function getStats() {
  const supabase = await createClient();
  const { count: companyCount } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true });
  const { count: reviewCount } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");
  return {
    companies: companyCount || 0,
    reviews: reviewCount || 0,
  };
}

export default async function HomePage() {
  const [companies, stats] = await Promise.all([
    getFeaturedCompanies(),
    getStats(),
  ]);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/5 to-background py-20 lg:py-32">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Find the{" "}
              <span className="text-primary">best recruiters</span> for your
              career
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Read honest reviews from candidates and hiring managers. Make
              informed decisions about your recruitment partners.
            </p>

            {/* Search Bar */}
            <form
              action="/companies"
              method="GET"
              className="mt-8 flex gap-2 max-w-xl mx-auto"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Search for a recruitment company..."
                  className="pl-10 h-12"
                />
              </div>
              <Button type="submit" size="lg" className="h-12">
                Search
              </Button>
            </form>

            {/* Quick Links */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link href="/companies?sector=Finance">
                <Button variant="outline" size="sm">
                  Finance
                </Button>
              </Link>
              <Link href="/companies?sector=Technology">
                <Button variant="outline" size="sm">
                  Technology
                </Button>
              </Link>
              <Link href="/companies?sector=Executive+Search">
                <Button variant="outline" size="sm">
                  Executive Search
                </Button>
              </Link>
              <Link href="/companies?sector=Private+Equity">
                <Button variant="outline" size="sm">
                  Private Equity
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/50 py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Building2 className="mx-auto h-8 w-8 text-primary mb-2" />
                <div className="text-3xl font-bold">{stats.companies}</div>
                <p className="text-sm text-muted-foreground">
                  Recruitment Companies
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Star className="mx-auto h-8 w-8 text-yellow-500 mb-2" />
                <div className="text-3xl font-bold">{stats.reviews}</div>
                <p className="text-sm text-muted-foreground">Reviews</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="mx-auto h-8 w-8 text-green-500 mb-2" />
                <div className="text-3xl font-bold">15+</div>
                <p className="text-sm text-muted-foreground">UK Locations</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Building2 className="mx-auto h-8 w-8 text-blue-500 mb-2" />
                <div className="text-3xl font-bold">20+</div>
                <p className="text-sm text-muted-foreground">Sectors Covered</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Companies */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Top Rated Recruiters</h2>
              <p className="text-muted-foreground">
                Discover highly rated recruitment companies
              </p>
            </div>
            <Link href="/companies">
              <Button variant="outline">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {companies.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No companies yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to review a recruitment company
                </p>
                <Link href="/signup">
                  <Button>Get Started</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/50 py-16">
        <div className="container">
          <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Search</h3>
              <p className="text-sm text-muted-foreground">
                Find recruitment companies by name, sector, or location
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Read Reviews</h3>
              <p className="text-sm text-muted-foreground">
                See what candidates and hiring managers say about their
                experiences
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Share Your Experience</h3>
              <p className="text-sm text-muted-foreground">
                Help others by leaving your own review after working with a
                recruiter
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="py-12 text-center">
              <h2 className="text-2xl font-bold mb-4">
                Are you a recruitment company?
              </h2>
              <p className="mb-6 opacity-90">
                Claim your company profile to respond to reviews and showcase
                your services
              </p>
              <Link href="/companies">
                <Button variant="secondary" size="lg">
                  Find & Claim Your Company
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
