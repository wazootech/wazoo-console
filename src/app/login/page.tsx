"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Mail, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "https://api.wazoo.dev";

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error("Failed to send code");
      setStep("otp");
    } catch {
      setError("Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!otp.trim() || otp.trim().length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/v1/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error?.message || "Invalid verification code.";
        setError(msg);
        return;
      }
      if (!data.token) {
        setError("Could not sign in. Please try again.");
        return;
      }
      const err = await login(data.token);
      if (err) {
        setError(err);
      } else {
        router.push("/worlds");
      }
    } catch {
      setError("Failed to verify code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    setStep("email");
    setOtp("");
    setError(null);
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Wazoo Console</CardTitle>
          {step === "email" ? (
            <CardDescription>Enter your email to sign in.</CardDescription>
          ) : (
            <CardDescription className="space-y-1">
              <span>Enter the 6-digit code sent to</span>
              <br />
              <span className="font-medium text-foreground">{email}</span>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Mail className="size-4" />
                )}
                Send code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  disabled={loading}
                  autoComplete="one-time-code"
                  autoFocus
                  className="text-center text-2xl tracking-[0.25em]"
                />
              </div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShieldCheck className="size-4" />
                )}
                Verify
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleBack}
                disabled={loading}
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
