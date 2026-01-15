"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { approveClaim, rejectClaim } from "@/lib/actions/claims";
import { formatDate } from "@/lib/utils";
import type { ClaimRequestWithDetails } from "@/types/database";

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<ClaimRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] =
    useState<ClaimRequestWithDetails | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchClaims();
  }, []);

  async function fetchClaims() {
    const supabase = createClient();
    const { data } = await supabase
      .from("claim_requests")
      .select(
        `
        *,
        companies (name, slug),
        profiles (display_name, email)
      `
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setClaims((data as ClaimRequestWithDetails[]) || []);
    setLoading(false);
  }

  async function handleAction() {
    if (!selectedClaim || !action) return;

    setProcessing(true);
    const result =
      action === "approve"
        ? await approveClaim(selectedClaim.id, adminNotes)
        : await rejectClaim(selectedClaim.id, adminNotes);

    if (!result.error) {
      setClaims((prev) => prev.filter((c) => c.id !== selectedClaim.id));
    }

    setProcessing(false);
    setSelectedClaim(null);
    setAction(null);
    setAdminNotes("");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Verification Claims</h2>

      {claims.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No pending verification claims
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <Card key={claim.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {claim.companies.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Requested by {claim.profiles.display_name || "Unknown"} (
                      {claim.profiles.email})
                    </p>
                  </div>
                  <Badge
                    variant={
                      claim.verification_type === "email"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {claim.verification_type === "email"
                      ? "Email Verification"
                      : "Manual Review"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Submitted</span>
                    <span>{formatDate(claim.created_at)}</span>
                  </div>
                  {claim.verification_type === "manual" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Full Name</span>
                        <span>{claim.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Job Title</span>
                        <span>{claim.job_title}</span>
                      </div>
                      {claim.linkedin_url && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            LinkedIn
                          </span>
                          <a
                            href={claim.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            View Profile
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Proof Type
                        </span>
                        <span className="capitalize">
                          {claim.proof_type?.replace(/_/g, " ")}
                        </span>
                      </div>
                      {claim.proof_text && (
                        <div className="pt-2">
                          <span className="text-muted-foreground block mb-1">
                            Additional Information
                          </span>
                          <p className="bg-muted p-2 rounded text-sm">
                            {claim.proof_text}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedClaim(claim);
                      setAction("approve");
                    }}
                    className="gap-1"
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setSelectedClaim(claim);
                      setAction("reject");
                    }}
                    className="gap-1"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!selectedClaim && !!action}
        onOpenChange={() => {
          setSelectedClaim(null);
          setAction(null);
          setAdminNotes("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Approve" : "Reject"} Claim
            </DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? "This will verify the company and grant ownership to the user."
                : "This will reject the claim request."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Admin Notes {action === "reject" && "(required)"}
              </label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  action === "reject"
                    ? "Explain why the claim is being rejected..."
                    : "Optional notes..."
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedClaim(null);
                setAction(null);
                setAdminNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing || (action === "reject" && !adminNotes)}
              variant={action === "reject" ? "destructive" : "default"}
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
