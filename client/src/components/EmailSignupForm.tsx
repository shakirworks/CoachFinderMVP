import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes("@")) {
      if (isSignIn) {
        onLogin(email);
      } else {
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
              className="pl-10 h-12"
              required
              data-testid="input-email"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Button
            type="submit"
            className="w-full h-12"
            disabled={isSignIn && isLoginPending}
            data-testid={isSignIn ? "button-signin" : "button-continue"}
          >
            {isSignIn ? (isLoginPending ? "Signing in..." : "Sign In") : "Continue"}
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
