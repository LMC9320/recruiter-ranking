"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("displayName") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/login?message=Check your email to confirm your account. You'll need to set up 2FA after signing in.");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function deleteAccount() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    // Use admin client to delete user data and auth record
    const adminClient = createAdminClient();

    // First, manually delete data that might not cascade properly
    // Remove company ownership (set to null instead of deleting companies)
    await adminClient
      .from("companies")
      .update({ owner_id: null })
      .eq("owner_id", user.id);

    // Delete review responses by this user
    await adminClient
      .from("review_responses")
      .delete()
      .eq("user_id", user.id);

    // Delete helpful votes by this user
    await adminClient
      .from("helpful_votes")
      .delete()
      .eq("user_id", user.id);

    // Delete claim requests by this user
    await adminClient
      .from("claim_requests")
      .delete()
      .eq("user_id", user.id);

    // Delete reviews by this user
    await adminClient
      .from("reviews")
      .delete()
      .eq("user_id", user.id);

    // Delete profile (should cascade from auth.users, but do it explicitly)
    await adminClient
      .from("profiles")
      .delete()
      .eq("id", user.id);

    // Finally, delete the user from Supabase Auth
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Error deleting user from auth:", deleteError);
      return { error: "Failed to delete account. Please try again." };
    }

    // Sign out locally
    await supabase.auth.signOut();

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { error: "An error occurred while deleting your account" };
  }
}
