"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { extractDomain } from "@/lib/utils";
import type { ProofType } from "@/types/database";

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
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
    .single();

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
  const { error } = await supabase.from("claim_requests").insert({
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

  // In a real implementation, you would send an email here using Resend
  // For MVP, we'll return the token (in production, remove this!)
  console.log(`Verification link: /verify/${token}`);

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
    .single();

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
  const { error } = await supabase.from("claim_requests").insert({
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
    .single();

  if (!claim) {
    return { error: "Invalid or expired verification link" };
  }

  // Check if token expired
  if (new Date(claim.token_expires_at!) < new Date()) {
    await supabase
      .from("claim_requests")
      .update({ status: "expired" })
      .eq("id", claim.id);
    return { error: "This verification link has expired" };
  }

  // Update claim status and company ownership
  const { error: claimError } = await supabase
    .from("claim_requests")
    .update({ status: "approved" })
    .eq("id", claim.id);

  if (claimError) {
    return { error: claimError.message };
  }

  const { error: companyError } = await supabase
    .from("companies")
    .update({
      is_verified: true,
      owner_id: claim.user_id,
      verified_at: new Date().toISOString(),
    })
    .eq("id", claim.company_id);

  if (companyError) {
    return { error: companyError.message };
  }

  const companySlug = (claim.companies as { slug: string }).slug;
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
    .single();

  if (!profile?.is_admin) {
    return { error: "Unauthorized" };
  }

  // Get the claim
  const { data: claim } = await supabase
    .from("claim_requests")
    .select("*, companies(slug)")
    .eq("id", claimId)
    .single();

  if (!claim) {
    return { error: "Claim not found" };
  }

  // Update claim
  const { error: claimError } = await supabase
    .from("claim_requests")
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
  const { error: companyError } = await supabase
    .from("companies")
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
    .single();

  if (!profile?.is_admin) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("claim_requests")
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
