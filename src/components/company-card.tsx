import Link from "next/link";
import { MapPin, Users, BadgeCheck, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/star-rating";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Company } from "@/types/database";

interface CompanyCardProps {
  company: Company;
}

export function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Link href={`/companies/${company.slug}`} className="block group">
      <div className="h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 hover:border-purple-200 dark:hover:border-purple-800">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            {company.logo_url ? (
              <div className="relative">
                <img
                  src={company.logo_url}
                  alt={`${company.name} logo`}
                  className="h-14 w-14 rounded-xl object-contain bg-gray-50 dark:bg-gray-800 p-1"
                />
              </div>
            ) : (
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">
                  {company.name.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                  {company.name}
                </h3>
                {company.is_verified && (
                  <Tooltip>
                    <TooltipTrigger>
                      <BadgeCheck className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Verified company owner</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StarRating
                  rating={company.average_rating || 0}
                  size="sm"
                  showValue
                />
                <span className="text-xs text-muted-foreground">
                  ({company.review_count})
                </span>
              </div>
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="h-5 w-5 text-primary" />
          </div>
        </div>

        {/* Description */}
        {company.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {company.description}
          </p>
        )}

        {/* Sectors */}
        <div className="flex flex-wrap gap-2 mb-4">
          {company.sectors.slice(0, 3).map((sector) => (
            <Badge
              key={sector}
              variant="secondary"
              className="text-xs rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-0"
            >
              {sector}
            </Badge>
          ))}
          {company.sectors.length > 3 && (
            <Badge variant="outline" className="text-xs rounded-full">
              +{company.sectors.length - 3}
            </Badge>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t">
          {company.locations.length > 0 && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span>
                {company.locations.slice(0, 2).join(", ")}
                {company.locations.length > 2 &&
                  ` +${company.locations.length - 2}`}
              </span>
            </div>
          )}
          {company.size && (
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>{company.size}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
