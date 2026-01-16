"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldCheck, Loader2, AlertTriangle } from "lucide-react";
import Image from "next/image";

export default function MandatoryMfaSetupPage() {
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkMfaStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkMfaStatus() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase.auth.mfa.listFactors();

      if (data?.totp) {
        const verifiedFactors = data.totp.filter(f => f.status === 'verified');
        if (verifiedFactors.length > 0) {
          // MFA already enabled, redirect to home
          router.push("/");
          return;
        }
      }
    } catch (err) {
      console.error("Error checking MFA status:", err);
    } finally {
      setLoading(false);
    }
  }

  async function startEnrollment() {
    setEnrolling(true);
    setError(null);
    try {
      // Remove any unverified factors first
      const { data: existingFactors } = await supabase.auth.mfa.listFactors();
      if (existingFactors?.totp) {
        for (const factor of existingFactors.totp) {
          if (factor.status !== 'verified') {
            await supabase.auth.mfa.unenroll({ factorId: factor.id });
          }
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });

      if (error?.message?.includes('already exists')) {
        const { data: retryData, error: retryError } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: `Authenticator-${Date.now()}`
        });
        if (retryError) throw retryError;
        setQrCode(retryData.totp.qr_code);
        setSecret(retryData.totp.secret);
        setFactorId(retryData.id);
        return;
      }

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start enrollment");
    } finally {
      setEnrolling(false);
    }
  }

  async function verifyAndEnable() {
    if (!factorId || !verifyCode) return;

    setVerifying(true);
    setError(null);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode
      });

      if (verifyError) throw verifyError;

      // Success - redirect to home
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid verification code");
    } finally {
      setVerifying(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-amber-100 rounded-full">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Two-Factor Authentication Required</CardTitle>
          <CardDescription className="mt-2">
            For your security, you must enable 2FA to continue using RecruiterRank
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          {qrCode ? (
            <div className="space-y-6">
              <p className="text-muted-foreground text-center">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>

              <div className="flex justify-center p-6 bg-white border rounded-lg">
                <Image
                  src={qrCode}
                  alt="QR Code for 2FA"
                  width={200}
                  height={200}
                  unoptimized
                />
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Or enter this code manually:</p>
                <code className="text-sm bg-white px-3 py-2 rounded border font-mono break-all">
                  {secret}
                </code>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium block text-center">
                  Enter the 6-digit code from your app
                </label>
                <Input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                  autoFocus
                />
              </div>

              <Button
                onClick={verifyAndEnable}
                disabled={verifyCode.length !== 6 || verifying}
                className="w-full"
                size="lg"
              >
                {verifying ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ShieldCheck className="h-4 w-4 mr-2" />
                )}
                Verify & Continue
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-blue-800 text-sm">
                  Two-factor authentication protects your account by requiring a code from your phone
                  in addition to your password. This is mandatory for all RecruiterRank accounts.
                </p>
              </div>

              <Button
                onClick={startEnrollment}
                disabled={enrolling}
                size="lg"
                className="w-full"
              >
                {enrolling ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Set Up 2FA Now
              </Button>
            </div>
          )}

          <div className="border-t pt-4">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full text-muted-foreground"
            >
              Sign out and use a different account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
