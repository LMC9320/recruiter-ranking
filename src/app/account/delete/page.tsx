"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Loader2, ArrowLeft } from "lucide-react";
import { deleteAccount } from "@/lib/actions/auth";

export default function DeleteAccountPage() {
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const CONFIRMATION_TEXT = "DELETE MY ACCOUNT";

  async function handleDelete() {
    if (confirmation !== CONFIRMATION_TEXT) {
      setError(`Please type "${CONFIRMATION_TEXT}" exactly to confirm`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await deleteAccount();

      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Sign out locally
      await supabase.auth.signOut();

      // Redirect to home with message
      router.push("/?message=Your account has been deleted");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-xl py-12 px-4">
        <Link
          href="/account"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Account
        </Link>

        <Card className="shadow-lg border-red-200">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-red-100 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-red-600">Delete Account</CardTitle>
            <CardDescription className="mt-2">
              This action is permanent and cannot be undone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg space-y-3">
              <p className="text-red-800 text-sm font-medium">
                Deleting your account will permanently remove:
              </p>
              <ul className="text-red-700 text-sm space-y-1 list-disc list-inside">
                <li>Your profile and account information</li>
                <li>All reviews you have written</li>
                <li>All your helpful votes</li>
                <li>Your company ownership claims</li>
                <li>Any pending verification requests</li>
              </ul>
              <p className="text-red-800 text-sm font-medium mt-3">
                This action cannot be reversed.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <label className="text-sm font-medium block">
                Type <span className="font-bold text-red-600">{CONFIRMATION_TEXT}</span> to confirm:
              </label>
              <Input
                type="text"
                placeholder={CONFIRMATION_TEXT}
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="border-red-200 focus:border-red-400 focus:ring-red-400"
              />
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={confirmation !== CONFIRMATION_TEXT || loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-2" />
                )}
                Permanently Delete My Account
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push("/account")}
                disabled={loading}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
