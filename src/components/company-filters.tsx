"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SECTORS, LOCATIONS, SORT_OPTIONS } from "@/lib/constants";

export function CompanyFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentSector = searchParams.get("sector") || "";
  const currentLocation = searchParams.get("location") || "";
  const currentRating = searchParams.get("rating") || "";
  const currentSort = searchParams.get("sort") || "rating";

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/companies?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/companies");
  };

  const hasFilters =
    currentSearch || currentSector || currentLocation || currentRating;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search companies..."
          className="pl-10"
          defaultValue={currentSearch}
          onChange={(e) => {
            const value = e.target.value;
            const timeoutId = setTimeout(() => {
              updateParams("search", value);
            }, 300);
            return () => clearTimeout(timeoutId);
          }}
        />
      </div>

      {/* Filters Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Sector</Label>
          <Select
            value={currentSector}
            onValueChange={(value) => updateParams("sector", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All sectors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All sectors</SelectItem>
              {SECTORS.map((sector) => (
                <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Location</Label>
          <Select
            value={currentLocation}
            onValueChange={(value) => updateParams("location", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All locations</SelectItem>
              {LOCATIONS.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Minimum Rating</Label>
          <Select
            value={currentRating}
            onValueChange={(value) => updateParams("rating", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any rating</SelectItem>
              <SelectItem value="4">4+ stars</SelectItem>
              <SelectItem value="3">3+ stars</SelectItem>
              <SelectItem value="2">2+ stars</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Sort by</Label>
          <Select
            value={currentSort}
            onValueChange={(value) => updateParams("sort", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {currentSearch && (
            <Badge variant="secondary" className="gap-1">
              Search: {currentSearch}
              <button onClick={() => updateParams("search", "")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {currentSector && (
            <Badge variant="secondary" className="gap-1">
              {currentSector}
              <button onClick={() => updateParams("sector", "")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {currentLocation && (
            <Badge variant="secondary" className="gap-1">
              {currentLocation}
              <button onClick={() => updateParams("location", "")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {currentRating && (
            <Badge variant="secondary" className="gap-1">
              {currentRating}+ stars
              <button onClick={() => updateParams("rating", "")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
