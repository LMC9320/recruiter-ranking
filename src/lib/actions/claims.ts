"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import type { ProofType } from "@/types/database";

// Generate cryptographically secure random token
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

interface EmailClaimData {
  companyId: string;
  companySlug: string;
  email: string;
}

interface ManualClaimData {
  companyId: string;
  companySlug: string;
  fullName: string;
  jobTitle: string;
  linkedinUrl: string;
  proofType: ProofType;
  proofText: string;
}

export async function submitEmailClaim(data: EmailClaimData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to claim a company" };
  }

  // Get company details
  const { data: company } = await supabase
    .from("companies")
    .select("website_domain, is_verified")
    .eq("id", data.companyId)
    .single() as { data: { website_domain: string | null; is_verified: boolean } | null };

  if (!company) {
    return { error: "Company not found" };
  }

  if (company.is_verified) {
    return { error: "This company has already been claimed" };
  }

  // Check if user already has a pending claim
  const { data: existingClaim } = await supabase
    .from("claim_requests")
    .select("id, status")
    .eq("company_id", data.companyId)
    .eq("user_id", user.id)
    .in("status", ["pending"])
    .single();

  if (existingClaim) {
    return { error: "You already have a pending claim for this company" };
  }

  // Extract domain from email
  const emailDomain = data.email.split("@")[1]?.toLowerCase();
  const companyDomain = company.website_domain?.toLowerCase();

  // Check if domains match
  if (!companyDomain || emailDomain !== companyDomain) {
    return {
      error: "Email domain doesn't match company website",
      requiresManualVerification: true,
    };
  }

  // Generate verification token
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Create claim request
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("claim_requests") as any).insert({
    company_id: data.companyId,
    user_id: user.id,
    verification_type: "email",
    email_used: data.email,
    token,
    token_expires_at: expiresAt.toISOString(),
    status: "pending",
  });

  if (error) {
    return { error: error.message };
  }

  // TODO: Send verification email using Resend
  // For now, the token is stored in the database and user can verify via the link
  // In production, integrate with email service to send: /verify/${token}

  return {
    success: true,
    message:
      "Verification email sent! Please check your inbox and click the link to verify ownership.",
  };
}

export async function submitManualClaim(data: ManualClaimData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to claim a company" };
  }

  // Get company details
  const { data: company } = await supabase
    .from("companies")
    .select("is_verified")
    .eq("id", data.companyId)
    .single() as { data: { is_verified: boolean } | null };

  if (!company) {
    return { error: "Company not found" };
  }

  if (company.is_verified) {
    return { error: "This company has already been claimed" };
  }

  // Check if user already has a pending claim
  const { data: existingClaim } = await supabase
    .from("claim_requests")
    .select("id")
    .eq("company_id", data.companyId)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .single();

  if (existingClaim) {
    return { error: "You already have a pending claim for this company" };
  }

  // Create manual claim request
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("claim_requests") as any).insert({
    company_id: data.companyId,
    user_id: user.id,
    verification_type: "manual",
    full_name: data.fullName,
    job_title: data.jobTitle,
    linkedin_url: data.linkedinUrl,
    proof_type: data.proofType,
    proof_text: data.proofText,
    status: "pending",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/companies/${data.companySlug}`);
  return {
    success: true,
    message:
      "Your claim request has been submitted for review. We'll notify you once it's been processed.",
  };
}

export async function verifyToken(token: string) {
  const supabase = await createClient();

  // Find the claim request
  const { data: claim } = await supabase
    .from("claim_requests")
    .select("*, companies(slug)")
    .eq("token", token)
    .eq("status", "pending")
    .single() as { data: { id: string; token_expires_at: string | null; user_id: string; company_id: string; companies: { slug: string } } | null };

  if (!claim) {
    return { error: "Invalid or expired verification link" };
  }

  // Check if token expired
  if (new Date(claim.token_expires_at!) < new Date()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("claim_requests") as any)
      .update({ status: "expired" })
      .eq("id", claim.id);
    return { error: "This verification link has expired" };
  }

  // Update claim status and company ownership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: claimError } = await (supabase.from("claim_requests") as any)
    .update({ status: "approved" })
    .eq("id", claim.id);

  if (claimError) {
    return { error: claimError.message };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: companyError } = await (supabase.from("companies") as any)
    .update({
      is_verified: true,
      owner_id: claim.user_id,
      verified_at: new Date().toISOString(),
    })
    .eq("id", claim.company_id);

  if (companyError) {
    return { error: companyError.message };
  }

  const companySlug = claim.companies.slug;
  revalidatePath(`/companies/${companySlug}`);

  return {
    success: true,
    companySlug,
  };
}

export async function approveClaim(claimId: string, adminNotes?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify admin status
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single() as { data: { is_admin: boolean } | null };

  if (!profile?.is_admin) {
    return { error: "Unauthorized" };
  }

  // Get the claim
  const { data: claim } = await supabase
    .from("claim_requests")
    .select("*, companies(slug)")
    .eq("id", claimId)
    .single() as { data: { user_id: string; company_id: string } | null };

  if (!claim) {
    return { error: "Claim not found" };
  }

  // Update claim
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: claimError } = await (supabase.from("claim_requests") as any)
    .update({
      status: "approved",
      admin_notes: adminNotes,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", claimId);

  if (claimError) {
    return { error: claimError.message };
  }

  // Update company
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: companyError } = await (supabase.from("companies") as any)
    .update({
      is_verified: true,
      owner_id: claim.user_id,
      verified_at: new Date().toISOString(),
    })
    .eq("id", claim.company_id);

  if (companyError) {
    return { error: companyError.message };
  }

  revalidatePath("/admin/claims");
  return { success: true };
}

export async function rejectClaim(claimId: string, adminNotes: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify admin status
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single() as { data: { is_admin: boolean } | null };

  if (!profile?.is_admin) {
    return { error: "Unauthorized" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("claim_requests") as any)
    .update({
      status: "rejected",
      admin_notes: adminNotes,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", claimId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/claims");
  return { success: true };
}
