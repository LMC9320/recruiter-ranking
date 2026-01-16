"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldCheck, ShieldOff, Loader2 } from "lucide-react";
import Image from "next/image";

export default function SecurityPage() {
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
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

      const verifiedFactors = data.totp.filter(f => f.status === 'verified');
      setMfaEnabled(verifiedFactors.length > 0);
    } catch (err: unknown) {
      console.error("Error checking MFA status:", err);
    } finally {
      setLoading(false);
    }
  }

  async function startEnrollment() {
    setEnrolling(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });

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
      <div className="container max-w-2xl py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-12">
      <h1 className="text-3xl font-bold mb-8">Security Settings</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-purple-600" />
            <div>
              <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {mfaEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <ShieldCheck className="h-5 w-5" />
                <span className="font-medium">2FA is enabled</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your account is protected with two-factor authentication.
              </p>
              <Button
                variant="destructive"
                onClick={disableMfa}
                disabled={loading}
              >
                <ShieldOff className="h-4 w-4 mr-2" />
                Disable 2FA
              </Button>
            </div>
          ) : qrCode ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>

              <div className="flex justify-center p-4 bg-white rounded-lg">
                <Image
                  src={qrCode}
                  alt="QR Code for 2FA"
                  width={200}
                  height={200}
                  unoptimized
                />
              </div>

              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Or enter this code manually:</p>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">{secret}</code>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Enter the 6-digit code from your app
                </label>
                <Input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={verifyAndEnable}
                  disabled={verifyCode.length !== 6 || verifying}
                  className="flex-1"
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
                  onClick={() => {
                    setQrCode(null);
                    setSecret(null);
                    setFactorId(null);
                    setVerifyCode("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Two-factor authentication adds an extra layer of security by requiring a code from your phone in addition to your password.
              </p>
              <Button onClick={startEnrollment} disabled={enrolling}>
                {enrolling ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Enable 2FA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
