"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ReviewStatus, CompanyInsert } from "@/types/database";
import { generateSlug } from "@/lib/utils";

async function verifyAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", supabase: null, user: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single() as { data: { is_admin: boolean } | null };

  if (!profile?.is_admin) {
    return { error: "Unauthorized", supabase: null, user: null };
  }

  return { error: null, supabase, user };
}

export async function updateReviewStatus(
  reviewId: string,
  status: ReviewStatus
) {
  const { error: authError, supabase } = await verifyAdmin();
  if (authError || !supabase) {
    return { error: authError || "Failed to initialize" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("reviews") as any)
    .update({ status })
    .eq("id", reviewId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/reviews");
  return { success: true };
}

export async function deleteReviewAdmin(reviewId: string) {
  const { error: authError, supabase } = await verifyAdmin();
  if (authError || !supabase) {
    return { error: authError || "Failed to initialize" };
  }

  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/reviews");
  return { success: true };
}

export async function createCompanyAdmin(data: {
  name: string;
  description?: string;
  website?: string;
  sectors: string[];
  locations: string[];
  size?: string;
}) {
  const { error: authError, supabase } = await verifyAdmin();
  if (authError || !supabase) {
    return { error: authError || "Failed to initialize" };
  }

  const slug = generateSlug(data.name);

  // Check if slug exists
  const { data: existing } = await supabase
    .from("companies")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existing) {
    return { error: "A company with a similar name already exists" };
  }

  const companyData: CompanyInsert = {
    name: data.name,
    slug,
    description: data.description,
    website: data.website,
    sectors: data.sectors,
    locations: data.locations,
    size: data.size as CompanyInsert["size"],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("companies") as any).insert(companyData);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/companies");
  revalidatePath("/companies");
  return { success: true, slug };
}

export async function deleteCompanyAdmin(companyId: string) {
  const { error: authError, supabase } = await verifyAdmin();
  if (authError || !supabase) {
    return { error: authError || "Failed to initialize" };
  }

  const { error } = await supabase
    .from("companies")
    .delete()
    .eq("id", companyId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/companies");
  revalidatePath("/companies");
  return { success: true };
}
