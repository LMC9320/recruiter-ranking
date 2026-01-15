"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2, ExternalLink, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { createCompanyAdmin, deleteCompanyAdmin } from "@/lib/actions/admin";
import { SECTORS, LOCATIONS, COMPANY_SIZES } from "@/lib/constants";
import type { Company, CompanySize } from "@/types/database";

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState("");

  // New company form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [sectors, setSectors] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [size, setSize] = useState<CompanySize | "">("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    const supabase = createClient();
    const { data } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });
    setCompanies(data || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!name.trim()) return;

    setProcessing(true);
    const result = await createCompanyAdmin({
      name: name.trim(),
      description: description.trim() || undefined,
      website: website.trim() || undefined,
      sectors,
      locations,
      size: size || undefined,
    });

    if (result.success) {
      setShowAddDialog(false);
      resetForm();
      fetchCompanies();
    }

    setProcessing(false);
  }

  async function handleDelete(companyId: string, companyName: string) {
    if (
      !confirm(
        `Are you sure you want to delete "${companyName}"? This will also delete all associated reviews.`
      )
    )
      return;

    await deleteCompanyAdmin(companyId);
    setCompanies((prev) => prev.filter((c) => c.id !== companyId));
  }

  function resetForm() {
    setName("");
    setDescription("");
    setWebsite("");
    setSectors([]);
    setLocations([]);
    setSize("");
  }

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Companies ({companies.length})</h2>
        <Button onClick={() => setShowAddDialog(true)} className="gap-1">
          <Plus className="h-4 w-4" />
          Add Company
        </Button>
      </div>

      <Input
        placeholder="Search companies..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="space-y-2">
        {filteredCompanies.map((company) => (
          <Card key={company.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                    <span className="font-bold text-primary">
                      {company.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{company.name}</span>
                      {company.is_verified && (
                        <BadgeCheck className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{company.review_count} reviews</span>
                      {company.average_rating && (
                        <span>- {company.average_rating.toFixed(1)} rating</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/companies/${company.slug}`}>
                    <Button size="sm" variant="ghost">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(company.id, company.name)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Company Name"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://www.example.com"
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label>Company Size</Label>
              <Select
                value={size}
                onValueChange={(v) => setSize(v as CompanySize)}
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

            <div className="space-y-2">
              <Label>Sectors</Label>
              <div className="flex flex-wrap gap-1">
                {SECTORS.map((sector) => (
                  <Badge
                    key={sector}
                    variant={sectors.includes(sector) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() =>
                      setSectors((prev) =>
                        prev.includes(sector)
                          ? prev.filter((s) => s !== sector)
                          : [...prev, sector]
                      )
                    }
                  >
                    {sector}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Locations</Label>
              <div className="flex flex-wrap gap-1">
                {LOCATIONS.map((location) => (
                  <Badge
                    key={location}
                    variant={
                      locations.includes(location) ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() =>
                      setLocations((prev) =>
                        prev.includes(location)
                          ? prev.filter((l) => l !== location)
                          : [...prev, location]
                      )
                    }
                  >
                    {location}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={processing || !name.trim()}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
