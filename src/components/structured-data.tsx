import type { Company, ReviewWithProfile } from "@/types/database";

interface OrganizationSchemaProps {
  company: Company;
}

export function OrganizationSchema({ company }: OrganizationSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    description: company.description,
    url: company.website,
    ...(company.average_rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: company.average_rating,
        reviewCount: company.review_count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ReviewSchemaProps {
  company: Company;
  reviews: ReviewWithProfile[];
}

export function ReviewsSchema({ company, reviews }: ReviewSchemaProps) {
  if (reviews.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: company.name,
    description: company.description,
    url: company.website,
    review: reviews.slice(0, 10).map((review) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.profiles?.display_name || "Anonymous",
      },
      datePublished: review.created_at,
      reviewBody: review.summary,
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.overall_rating,
        bestRating: 5,
        worstRating: 1,
      },
    })),
    ...(company.average_rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: company.average_rating,
        reviewCount: company.review_count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "RecruiterRank",
    description:
      "Discover and review recruitment companies. Read honest reviews from candidates and hiring managers.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://recruiterrank.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${
          process.env.NEXT_PUBLIC_APP_URL || "https://recruiterrank.com"
        }/companies?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
