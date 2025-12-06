import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, AlertCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface EmailSignupFormProps {
  role: "athlete" | "coach";
  onSubmit: (email: string) => void;
  onBack: () => void;
  onLogin: (email: string) => void;
  isLoginPending: boolean;
}

export default function EmailSignupForm({ role, onSubmit, onBack, onLogin, isLoginPending }: EmailSignupFormProps) {
  const [email, setEmail] = useState("");
  const [isSignIn, setIsSignIn] = useState(false);
  const [debouncedEmail, setDebouncedEmail] = useState("");

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

  const { data: emailCheckResult, isLoading: isCheckingEmail } = useQuery<{ exists: boolean; role: "athlete" | "coach" | null }>({
    queryKey: ['users-exists', debouncedEmail],
    queryFn: async () => {
      const res = await fetch(`/api/users/exists?email=${encodeURIComponent(debouncedEmail)}`);
      if (!res.ok) throw new Error('Failed to check email');
      return res.json();
    },
    enabled: !!debouncedEmail && !isSignIn,
  });

  const emailExists = emailCheckResult?.exists && !isSignIn;
  const existingRole = emailCheckResult?.role;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes("@")) {
      if (isSignIn) {
        onLogin(email);
      } else {
        if (emailExists) {
          return;
        }
        onSubmit(email);
      }
    }
  };

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
          {isSignIn ? "Enter your email to sign in" : "Enter your email to get started"}
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
              className={`pl-10 h-12 ${emailExists ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              required
              data-testid="input-email"
            />
            {isCheckingEmail && debouncedEmail && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
            )}
          </div>
          {emailExists && (
            <div className="flex items-start gap-2 text-destructive text-sm mt-2" data-testid="email-exists-error">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p>An account with this email already exists as {existingRole === "athlete" ? "an athlete" : "a coach"}.</p>
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

        <div className="space-y-3">
          <Button
            type="submit"
            className="w-full h-12"
            disabled={(isSignIn && isLoginPending) || (!isSignIn && emailExists) || isCheckingEmail}
            data-testid={isSignIn ? "button-signin" : "button-continue"}
          >
            {isSignIn ? (isLoginPending ? "Signing in..." : "Sign In") : (isCheckingEmail && debouncedEmail ? "Checking..." : "Continue")}
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
            onClick={() => setIsSignIn(!isSignIn)}
            data-testid={isSignIn ? "button-show-signup" : "button-show-signin"}
          >
            {isSignIn ? "Create an account" : "Sign in"}
          </Button>
        </div>
      </form>
    </div>
  );
}
