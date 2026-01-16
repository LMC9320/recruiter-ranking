"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { submitEmailClaim, submitManualClaim } from "@/lib/actions/claims";
import { createClient } from "@/lib/supabase/client";
import type { Company, ProofType } from "@/types/database";

export default function ClaimCompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [slug, setSlug] = useState<string>("");
  const [activeTab, setActiveTab] = useState("email");

  // Email verification state
  const [email, setEmail] = useState("");

  // Manual verification state
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [proofType, setProofType] = useState<ProofType>("companies_house");
  const [proofText, setProofText] = useState("");

  useEffect(() => {
    async function fetchCompany() {
      const { slug: paramSlug } = await params;
      setSlug(paramSlug);

      const supabase = createClient();

      // Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/login?redirect=/companies/${paramSlug}/claim`);
        return;
      }

      const { data } = await supabase
        .from("companies")
        .select("*")
        .eq("slug", paramSlug)
        .single() as { data: Company | null };

      if (!data) {
        router.push("/companies");
        return;
      }

      if (data.is_verified) {
        router.push(`/companies/${paramSlug}`);
        return;
      }

      setCompany(data);
      setLoading(false);
    }
    fetchCompany();
  }, [params, router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const result = await submitEmailClaim({
      companyId: company!.id,
      companySlug: slug,
      email,
    });

    if (result.error) {
      if (result.requiresManualVerification) {
        setError(result.error);
        setActiveTab("manual");
      } else {
        setError(result.error);
      }
    } else if (result.success) {
      setSuccess(result.message!);
    }

    setSubmitting(false);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!fullName || !jobTitle || !linkedinUrl || !proofText) {
      setError("Please fill in all required fields");
      setSubmitting(false);
      return;
    }

    const result = await submitManualClaim({
      companyId: company!.id,
      companySlug: slug,
      fullName,
      jobTitle,
      linkedinUrl,
      proofType,
      proofText,
    });

    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setSuccess(result.message!);
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="container py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!company) return null;

  if (success) {
    return (
      <div className="container py-8 max-w-lg">
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Request Submitted</h2>
            <p className="text-muted-foreground mb-6">{success}</p>
            <Link href={`/companies/${slug}`}>
              <Button>Back to Company</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl">
      <Link
        href={`/companies/${slug}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to {company.name}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Claim {company.name}</CardTitle>
          <CardDescription>
            Verify that you own or represent this company to manage its profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-md">
              {error}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" className="gap-2">
                <Mail className="h-4 w-4" />
                Email Verification
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-2">
                <FileText className="h-4 w-4" />
                Manual Verification
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Enter your work email address that matches the company&apos;s
                domain ({company.website_domain || "company domain"}). We&apos;ll
                send you a verification link.
              </p>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Work Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={`you@${company.website_domain || "company.com"}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Send Verification Email
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                If you don&apos;t have access to a company email, you can submit
                a manual verification request. This will be reviewed by our team.
              </p>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="John Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Input
                    id="jobTitle"
                    placeholder="Managing Director"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn Profile URL *</Label>
                  <Input
                    id="linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proofType">Proof Type *</Label>
                  <Select
                    value={proofType}
                    onValueChange={(value) => setProofType(value as ProofType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="companies_house">
                        Companies House Listing
                      </SelectItem>
                      <SelectItem value="official_documentation">
                        Official Documentation
                      </SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proofText">
                    Additional Information / Proof *
                  </Label>
                  <Textarea
                    id="proofText"
                    placeholder="Provide details about how you can prove your ownership or association with this company..."
                    value={proofText}
                    onChange={(e) => setProofText(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit Verification Request
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
