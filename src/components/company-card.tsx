import Link from "next/link";
import { MapPin, Users, ExternalLink, BadgeCheck } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    <Link href={`/companies/${company.slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={`${company.name} logo`}
                  className="h-12 w-12 rounded-lg object-contain bg-muted"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {company.name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg leading-tight">
                    {company.name}
                  </h3>
                  {company.is_verified && (
                    <Tooltip>
                      <TooltipTrigger>
                        <BadgeCheck className="h-5 w-5 text-blue-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Verified company owner</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating
                    rating={company.average_rating || 0}
                    size="sm"
                    showValue
                  />
                  <span className="text-xs text-muted-foreground">
                    ({company.review_count} review
                    {company.review_count !== 1 ? "s" : ""})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {company.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {company.description}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {company.sectors.slice(0, 3).map((sector) => (
              <Badge key={sector} variant="secondary" className="text-xs">
                {sector}
              </Badge>
            ))}
            {company.sectors.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{company.sectors.length - 3}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {company.locations.length > 0 && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>
                  {company.locations.slice(0, 2).join(", ")}
                  {company.locations.length > 2 &&
                    ` +${company.locations.length - 2}`}
                </span>
              </div>
            )}
            {company.size && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{company.size}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
