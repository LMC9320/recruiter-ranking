"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateCompany } from "@/lib/actions/companies";
import { createClient } from "@/lib/supabase/client";
import { SECTORS, LOCATIONS, COMPANY_SIZES } from "@/lib/constants";
import type { Company, CompanySize } from "@/types/database";

export default function ManageCompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [slug, setSlug] = useState<string>("");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [sectors, setSectors] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [size, setSize] = useState<CompanySize | "">("");

  useEffect(() => {
    async function fetchCompany() {
      const { slug: paramSlug } = await params;
      setSlug(paramSlug);

      const supabase = createClient();

      // Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/login?redirect=/companies/${paramSlug}/manage`);
        return;
      }

      const { data } = await supabase
        .from("companies")
        .select("*")
        .eq("slug", paramSlug)
        .single() as { data: Company | null };

      if (!data || data.owner_id !== user.id) {
        router.push(`/companies/${paramSlug}`);
        return;
      }

      setCompany(data);
      setName(data.name);
      setDescription(data.description || "");
      setWebsite(data.website || "");
      setSectors(data.sectors);
      setLocations(data.locations);
      setSize(data.size || "");
      setLoading(false);
    }
    fetchCompany();
  }, [params, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const result = await updateCompany(company!.id, slug, {
      name,
      description,
      website,
      sectors,
      locations,
      size: size as CompanySize || undefined,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Company profile updated successfully");
    }

    setSaving(false);
  };

  const toggleSector = (sector: string) => {
    setSectors((prev) =>
      prev.includes(sector)
        ? prev.filter((s) => s !== sector)
        : [...prev, sector]
    );
  };

  const toggleLocation = (location: string) => {
    setLocations((prev) =>
      prev.includes(location)
        ? prev.filter((l) => l !== location)
        : [...prev, location]
    );
  };

  if (loading) {
    return (
      <div className="container py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="container py-8 max-w-3xl">
      <Link
        href={`/companies/${slug}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to {company.name}
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">Manage {company.name}</h1>
        <p className="text-muted-foreground">
          Update your company profile information
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Company Profile</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 pt-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 text-green-700 text-sm rounded-md">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Describe your company..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://www.example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Company Size</Label>
                  <Select
                    value={size}
                    onValueChange={(value) => setSize(value as CompanySize)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_SIZES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sectors</CardTitle>
                <CardDescription>
                  Select the sectors you specialize in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {SECTORS.map((sector) => (
                    <Badge
                      key={sector}
                      variant={
                        sectors.includes(sector) ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => toggleSector(sector)}
                    >
                      {sector}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Locations</CardTitle>
                <CardDescription>
                  Select your office locations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {LOCATIONS.map((location) => (
                    <Badge
                      key={location}
                      variant={
                        locations.includes(location) ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => toggleLocation(location)}
                    >
                      {location}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold">
                    {company.review_count}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Reviews</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold">
                    {company.average_rating?.toFixed(1) || "N/A"}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Average Rating
                  </p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold flex items-center justify-center gap-2">
                    <Users className="h-6 w-6" />
                  </div>
                  <p className="text-sm text-muted-foreground">Profile Views</p>
                  <p className="text-xs text-muted-foreground">
                    (Coming soon)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
