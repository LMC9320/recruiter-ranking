export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ReviewerType = "candidate" | "hiring_manager";
export type ReviewStatus = "pending" | "approved" | "rejected" | "flagged";
export type ClaimStatus = "pending" | "approved" | "rejected" | "expired";
export type VerificationType = "email" | "manual";
export type ProofType = "companies_house" | "official_documentation" | "other";
export type CompanySize = "1-10" | "11-50" | "51-200" | "201-500" | "500+";

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          website: string | null;
          website_domain: string | null;
          sectors: string[];
          locations: string[];
          size: CompanySize | null;
          is_verified: boolean;
          owner_id: string | null;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
          average_rating: number | null;
          review_count: number;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          website?: string | null;
          website_domain?: string | null;
          sectors?: string[];
          locations?: string[];
          size?: CompanySize | null;
          is_verified?: boolean;
          owner_id?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
          average_rating?: number | null;
          review_count?: number;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          website?: string | null;
          website_domain?: string | null;
          sectors?: string[];
          locations?: string[];
          size?: CompanySize | null;
          is_verified?: boolean;
          owner_id?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
          average_rating?: number | null;
          review_count?: number;
        };
      };
      reviews: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          rating_communication: number;
          rating_candidate_care: number;
          rating_job_quality: number;
          rating_speed: number;
          overall_rating: number;
          pros: string;
          cons: string;
          summary: string;
          reviewer_type: ReviewerType;
          status: ReviewStatus;
          helpful_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id: string;
          rating_communication: number;
          rating_candidate_care: number;
          rating_job_quality: number;
          rating_speed: number;
          overall_rating: number;
          pros: string;
          cons: string;
          summary: string;
          reviewer_type: ReviewerType;
          status?: ReviewStatus;
          helpful_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          user_id?: string;
          rating_communication?: number;
          rating_candidate_care?: number;
          rating_job_quality?: number;
          rating_speed?: number;
          overall_rating?: number;
          pros?: string;
          cons?: string;
          summary?: string;
          reviewer_type?: ReviewerType;
          status?: ReviewStatus;
          helpful_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      review_responses: {
        Row: {
          id: string;
          review_id: string;
          user_id: string;
          response_text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          user_id: string;
          response_text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          review_id?: string;
          user_id?: string;
          response_text?: string;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          email: string;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          email: string;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          email?: string;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      claim_requests: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          verification_type: VerificationType;
          email_used: string | null;
          token: string | null;
          token_expires_at: string | null;
          full_name: string | null;
          job_title: string | null;
          linkedin_url: string | null;
          proof_text: string | null;
          proof_type: ProofType | null;
          status: ClaimStatus;
          admin_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id: string;
          verification_type: VerificationType;
          email_used?: string | null;
          token?: string | null;
          token_expires_at?: string | null;
          full_name?: string | null;
          job_title?: string | null;
          linkedin_url?: string | null;
          proof_text?: string | null;
          proof_type?: ProofType | null;
          status?: ClaimStatus;
          admin_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          user_id?: string;
          verification_type?: VerificationType;
          email_used?: string | null;
          token?: string | null;
          token_expires_at?: string | null;
          full_name?: string | null;
          job_title?: string | null;
          linkedin_url?: string | null;
          proof_text?: string | null;
          proof_type?: ProofType | null;
          status?: ClaimStatus;
          admin_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
      };
      helpful_votes: {
        Row: {
          id: string;
          review_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          review_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
    };
  };
}

// Convenience types
export type Company = Database["public"]["Tables"]["companies"]["Row"];
export type CompanyInsert = Database["public"]["Tables"]["companies"]["Insert"];
export type CompanyUpdate = Database["public"]["Tables"]["companies"]["Update"];

export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
export type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];

export type ReviewResponse = Database["public"]["Tables"]["review_responses"]["Row"];
export type ReviewResponseInsert = Database["public"]["Tables"]["review_responses"]["Insert"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type ClaimRequest = Database["public"]["Tables"]["claim_requests"]["Row"];
export type ClaimRequestInsert = Database["public"]["Tables"]["claim_requests"]["Insert"];
export type ClaimRequestUpdate = Database["public"]["Tables"]["claim_requests"]["Update"];

export type HelpfulVote = Database["public"]["Tables"]["helpful_votes"]["Row"];

// Extended types with relations
export interface ReviewWithProfile extends Review {
  profiles: Pick<Profile, "display_name"> | null;
  review_responses: ReviewResponse[];
}

export interface CompanyWithReviews extends Company {
  reviews: ReviewWithProfile[];
}

export interface ClaimRequestWithDetails extends ClaimRequest {
  companies: Pick<Company, "name" | "slug">;
  profiles: Pick<Profile, "display_name" | "email">;
}
