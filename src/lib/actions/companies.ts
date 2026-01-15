"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CompanySize } from "@/types/database";

interface UpdateCompanyData {
  name?: string;
  description?: string;
  website?: string;
  sectors?: string[];
  locations?: string[];
  size?: CompanySize;
  logo_url?: string;
}

export async function updateCompany(
  companyId: string,
  companySlug: string,
  data: UpdateCompanyData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify ownership
  const { data: company } = await supabase
    .from("companies")
    .select("owner_id")
    .eq("id", companyId)
    .single();

  if (!company || company.owner_id !== user.id) {
    return { error: "You don't have permission to edit this company" };
  }

  const { error } = await supabase
    .from("companies")
    .update(data)
    .eq("id", companyId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/companies/${companySlug}`);
  return { success: true };
}

export async function transferOwnership(
  companyId: string,
  companySlug: string,
  newOwnerEmail: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify ownership
  const { data: company } = await supabase
    .from("companies")
    .select("owner_id")
    .eq("id", companyId)
    .single();

  if (!company || company.owner_id !== user.id) {
    return { error: "You don't have permission to transfer ownership" };
  }

  // Find new owner by email
  const { data: newOwner } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", newOwnerEmail)
    .single();

  if (!newOwner) {
    return { error: "User not found with that email address" };
  }

  const { error } = await supabase
    .from("companies")
    .update({ owner_id: newOwner.id })
    .eq("id", companyId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/companies/${companySlug}`);
  return { success: true };
}
