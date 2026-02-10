import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, AlertCircle, Loader2, Lock, ShieldCheck, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface EmailSignupFormProps {
  role: "athlete" | "coach";
  onSubmit: (email: string, password: string) => void;
  onBack: () => void;
  onLogin: (email: string, password: string) => void;
  onVerifyCode: (email: string, code: string) => void;
  isLoginPending: boolean;
  isVerifyPending: boolean;
  isSignupPending?: boolean;
  loginStep: "credentials" | "verification";
  loginError: string | null;
  initialIsSignIn?: boolean;
}

export default function EmailSignupForm({
  role,
  onSubmit,
  onBack,
  onLogin,
  onVerifyCode,
  isLoginPending,
  isVerifyPending,
  isSignupPending = false,
  loginStep,
  loginError,
  initialIsSignIn = false,
}: EmailSignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignIn, setIsSignIn] = useState(initialIsSignIn);
  const [debouncedEmail, setDebouncedEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", ""]);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (email && email.includes("@")) {
        setDebouncedEmail(email);
      } else {
        setDebouncedEmail("");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [email]);

  const { data: emailCheckResult, isLoading: isCheckingEmail } = useQuery<{
    exists: boolean;
    role: "athlete" | "coach" | null;
  }>({
    queryKey: ["users-exists", debouncedEmail],
    queryFn: async () => {
      const res = await fetch(
        `/api/users/exists?email=${encodeURIComponent(debouncedEmail)}`
      );
      if (!res.ok) throw new Error("Failed to check email");
      return res.json();
    },
    enabled: !!debouncedEmail && !isSignIn,
  });

  const emailExists = emailCheckResult?.exists && !isSignIn;
  const existingRole = emailCheckResult?.role;

  const passwordsMatch = !confirmPassword || password === confirmPassword;
  const passwordValid = password.length >= 6;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    if (isSignIn) {
      if (!password) return;
      onLogin(email, password);
    } else {
      if (emailExists) return;
      if (!passwordValid || !passwordsMatch) return;
      onSubmit(email, password);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value.slice(-1);
    setVerificationCode(newCode);

    if (value && index < 4) {
      codeInputRefs.current[index + 1]?.focus();
    }

    const fullCode = newCode.join("");
    if (fullCode.length === 5) {
      onVerifyCode(email, fullCode);
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 5);
    const newCode = [...verificationCode];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setVerificationCode(newCode);
    if (pasted.length === 5) {
      onVerifyCode(email, pasted);
    } else {
      codeInputRefs.current[pasted.length]?.focus();
    }
  };

  if (isSignIn && loginStep === "verification") {
    return (
      <div className="w-full max-w-md mx-auto p-6">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-2" data-testid="text-verify-title">
            Verify Your Identity
          </h2>
          <p className="text-muted-foreground">
            We sent a 5-digit code to
          </p>
          <p className="font-medium mt-1" data-testid="text-verify-email">{email}</p>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center gap-3" onPaste={handleCodePaste}>
            {verificationCode.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { codeInputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(index, e)}
                className="w-14 h-14 text-center text-2xl font-bold"
                data-testid={`input-code-${index}`}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {loginError && (
            <div
              className="flex items-center gap-2 text-destructive text-sm justify-center"
              data-testid="text-verify-error"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p>{loginError}</p>
            </div>
          )}

          {isVerifyPending && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Verifying...</span>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            The code expires in 10 minutes. Check your spam folder if you don't see it.
          </p>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onBack}
            data-testid="button-back-from-verify"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="mb-8 text-center">
        <Badge className="mb-4 capitalize" data-testid={`badge-role-${role}`}>
          {role}
        </Badge>
        <h2 className="text-3xl font-bold mb-2">
          {isSignIn ? "Sign In" : "Create Your Account"}
        </h2>
        <p className="text-muted-foreground">
          {isSignIn
            ? "Enter your credentials to sign in"
            : "Enter your email and create a password"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`pl-10 h-12 ${emailExists ? "border-destructive focus-visible:ring-destructive" : ""}`}
              required
              data-testid="input-email"
            />
            {isCheckingEmail && debouncedEmail && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
            )}
          </div>
          {emailExists && (
            <div
              className="flex items-start gap-2 text-destructive text-sm mt-2"
              data-testid="email-exists-error"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p>
                  An account with this email already exists as{" "}
                  {existingRole === "athlete" ? "an athlete" : "a coach"}.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  className="p-0 h-auto text-sm text-primary underline"
                  onClick={() => setIsSignIn(true)}
                  data-testid="button-switch-to-signin"
                >
                  Sign in instead
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder={isSignIn ? "Enter your password" : "Create a password (min 6 characters)"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
              minLength={6}
              data-testid="input-password"
            />
          </div>
          {!isSignIn && password && !passwordValid && (
            <p className="text-sm text-destructive" data-testid="text-password-error">
              Password must be at least 6 characters
            </p>
          )}
        </div>

        {!isSignIn && (
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`pl-10 h-12 ${confirmPassword && !passwordsMatch ? "border-destructive focus-visible:ring-destructive" : ""}`}
                required
                data-testid="input-confirm-password"
              />
            </div>
            {confirmPassword && !passwordsMatch && (
              <p
                className="text-sm text-destructive"
                data-testid="text-password-mismatch"
              >
                Passwords do not match
              </p>
            )}
          </div>
        )}

        {loginError && isSignIn && (
          <div
            className="flex items-center gap-2 text-destructive text-sm"
            data-testid="text-login-error"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{loginError}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            type="submit"
            className="w-full h-12"
            disabled={
              (isSignIn && (isLoginPending || !password)) ||
              (!isSignIn && (emailExists || isCheckingEmail || !passwordValid || !passwordsMatch || isSignupPending)) ||
              false
            }
            data-testid={isSignIn ? "button-signin" : "button-continue"}
          >
            {isSignIn
              ? isLoginPending
                ? "Signing in..."
                : "Sign In"
              : isSignupPending
                ? "Sending verification..."
                : isCheckingEmail && debouncedEmail
                  ? "Checking..."
                  : "Continue"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onBack}
            data-testid="button-back"
          >
            Back
          </Button>
        </div>

        <div className="text-center pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">
            {isSignIn ? "Don't have an account?" : "Already have an account?"}
          </p>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setIsSignIn(!isSignIn);
              setPassword("");
              setConfirmPassword("");
            }}
            data-testid={isSignIn ? "button-show-signup" : "button-show-signin"}
          >
            {isSignIn ? "Create an account" : "Sign in"}
          </Button>
        </div>
      </form>
    </div>
  );
}
