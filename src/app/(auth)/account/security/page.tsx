"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldCheck, ShieldOff, Loader2, RefreshCw } from "lucide-react";
import Image from "next/image";

type MfaFactor = {
  id: string;
  status: string;
  friendly_name?: string;
};

export default function SecurityPage() {
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [pendingFactor, setPendingFactor] = useState<MfaFactor | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    checkMfaStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkMfaStatus() {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      if (data?.totp) {
        const verifiedFactors = data.totp.filter(f => f.status === 'verified');
        const unverifiedFactors = data.totp.filter(f => (f.status as string) === 'unverified');

        setMfaEnabled(verifiedFactors.length > 0);
        setPendingFactor(unverifiedFactors.length > 0 ? unverifiedFactors[0] : null);
      }
    } catch (err: unknown) {
      console.error("Error checking MFA status:", err);
    } finally {
      setLoading(false);
    }
  }

  async function removePendingFactor() {
    if (!pendingFactor) return;

    setLoading(true);
    setError(null);
    try {
      await supabase.auth.mfa.unenroll({ factorId: pendingFactor.id });
      setPendingFactor(null);
      setSuccess("Pending 2FA setup removed. You can start fresh.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove pending factor");
    } finally {
      setLoading(false);
    }
  }

  async function startEnrollment() {
    setEnrolling(true);
    setError(null);
    setSuccess(null);
    try {
      // First, remove any unverified factors
      const { data: existingFactors } = await supabase.auth.mfa.listFactors();
      if (existingFactors?.totp) {
        for (const factor of existingFactors.totp) {
          if ((factor.status as string) === 'unverified') {
            await supabase.auth.mfa.unenroll({ factorId: factor.id });
          }
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setPendingFactor(null);
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

      setSuccess("2FA has been enabled successfully!");
      setMfaEnabled(true);
      setQrCode(null);
      setSecret(null);
      setFactorId(null);
      setVerifyCode("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid verification code");
    } finally {
      setVerifying(false);
    }
  }

  async function disableMfa() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await supabase.auth.mfa.listFactors();

      if (data?.totp) {
        for (const factor of data.totp) {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }

      setMfaEnabled(false);
      setSuccess("2FA has been disabled");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to disable 2FA");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container max-w-2xl py-12 px-4">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-2xl py-12 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Security Settings</h1>

        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Two-Factor Authentication (2FA)</CardTitle>
                <CardDescription className="mt-1">
                  Add an extra layer of security to your account
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 p-4 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Pending factor warning */}
            {pendingFactor && !qrCode && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <p className="text-amber-800 text-sm mb-3">
                  You have an incomplete 2FA setup. Would you like to start fresh or continue?
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={startEnrollment}
                    disabled={enrolling}
                  >
                    {enrolling ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Start Fresh
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={removePendingFactor}
                  >
                    Cancel Setup
                  </Button>
                </div>
              </div>
            )}

            {mfaEnabled ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <ShieldCheck className="h-6 w-6 text-green-600" />
                  <div>
                    <span className="font-medium text-green-800">2FA is enabled</span>
                    <p className="text-sm text-green-700 mt-0.5">
                      Your account is protected with two-factor authentication.
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  onClick={disableMfa}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Disable 2FA
                </Button>
              </div>
            ) : qrCode ? (
              <div className="space-y-6">
                <p className="text-muted-foreground">
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
                  <label className="text-sm font-medium block">
                    Enter the 6-digit code from your app
                  </label>
                  <Input
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={verifyAndEnable}
                    disabled={verifyCode.length !== 6 || verifying}
                    className="flex-1"
                    size="lg"
                  >
                    {verifying ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 mr-2" />
                    )}
                    Verify & Enable
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setQrCode(null);
                      setSecret(null);
                      setFactorId(null);
                      setVerifyCode("");
                      checkMfaStatus();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : !pendingFactor ? (
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  Two-factor authentication adds an extra layer of security by requiring a code from your phone in addition to your password.
                </p>
                <Button onClick={startEnrollment} disabled={enrolling} size="lg">
                  {enrolling ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  Enable 2FA
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
