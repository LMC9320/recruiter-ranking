import Link from "next/link";
import { Search, Star, Users, Building2, ArrowRight, Sparkles, Shield, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-950" />

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-300/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />

        <div className="container relative py-24 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in">
              <Sparkles className="h-4 w-4" />
              <span>The #1 platform for recruitment company reviews</span>
            </div>

            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl mb-6 animate-slide-up">
              Find the{" "}
              <span className="text-gradient">best recruiters</span>
              {" "}for your career
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Make informed decisions with honest reviews from candidates and hiring managers.
              Your next career move deserves the right recruitment partner.
            </p>

            {/* Search Bar */}
            <form
              action="/companies"
              method="GET"
              className="flex gap-3 max-w-2xl mx-auto mb-8 animate-slide-up"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Search recruitment companies..."
                  className="pl-12 h-14 text-lg rounded-xl border-2 focus:border-primary shadow-lg"
                />
              </div>
              <Button type="submit" size="lg" className="h-14 px-8 rounded-xl text-lg font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                Search
              </Button>
            </form>

            {/* Quick Links */}
            <div className="flex flex-wrap justify-center gap-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              {['Finance', 'Technology', 'Executive Search', 'Private Equity', 'Legal'].map((sector) => (
                <Link key={sector} href={`/companies?sector=${encodeURIComponent(sector)}`}>
                  <Button variant="outline" className="rounded-full hover:bg-primary hover:text-primary-foreground transition-colors">
                    {sector}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-950 border-y">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Building2, value: stats.companies, label: "Companies", color: "text-purple-600" },
              { icon: Star, value: stats.reviews, label: "Reviews", color: "text-yellow-500" },
              { icon: Users, value: "15+", label: "UK Locations", color: "text-green-600" },
              { icon: TrendingUp, value: "20+", label: "Sectors", color: "text-blue-600" },
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4 group-hover:scale-110 transition-transform">
                  <stat.icon className={`h-7 w-7 ${stat.color}`} />
                </div>
                <div className="text-4xl font-bold mb-1">{stat.value}</div>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Companies */}
      <section className="py-20 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">Top Rated Recruiters</h2>
              <p className="text-muted-foreground text-lg">
                Discover highly rated recruitment companies trusted by professionals
              </p>
            </div>
            <Link href="/companies">
              <Button variant="outline" size="lg" className="rounded-full group">
                View All
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {companies.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {companies.map((company, index) => (
                <div key={company.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CompanyCard company={company} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed">
              <Building2 className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No companies yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to review a recruitment company
              </p>
              <Link href="/signup">
                <Button size="lg" className="rounded-full">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Find the perfect recruitment partner in three simple steps
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {[
              {
                step: 1,
                title: "Search",
                description: "Find recruitment companies by name, sector, or location using our powerful search",
                icon: Search,
              },
              {
                step: 2,
                title: "Compare",
                description: "Read detailed reviews from candidates and hiring managers to make informed decisions",
                icon: Star,
              },
              {
                step: 3,
                title: "Connect",
                description: "Reach out to top-rated recruiters and take the next step in your career journey",
                icon: Users,
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center group">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-500/20 group-hover:from-primary/30 group-hover:to-purple-500/30 transition-colors">
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-900 shadow-lg flex items-center justify-center">
                      <item.icon className="h-7 w-7 text-primary" />
                    </div>
                  </div>
                </div>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "Verified Reviews",
                description: "All reviews are from real users. We verify authenticity to ensure you get honest insights.",
              },
              {
                icon: TrendingUp,
                title: "Detailed Ratings",
                description: "See breakdown ratings for communication, candidate care, job quality, and process speed.",
              },
              {
                icon: Sparkles,
                title: "Company Responses",
                description: "Verified company owners can respond to reviews, creating transparent dialogue.",
              },
            ].map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-purple-600 to-pink-600 p-12 lg:p-16 text-center text-white">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
            </div>

            <div className="relative">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Are you a recruitment company?
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Claim your company profile to respond to reviews, showcase your services,
                and build trust with potential clients.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/companies">
                  <Button size="lg" variant="secondary" className="rounded-full text-lg px-8 shadow-lg hover:shadow-xl transition-shadow">
                    Find Your Company
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="lg" variant="outline" className="rounded-full text-lg px-8 border-white/30 hover:bg-white/10 text-white">
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
