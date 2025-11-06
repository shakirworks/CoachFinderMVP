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
}

export default function EmailSignupForm({ role, onSubmit, onBack }: EmailSignupFormProps) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes("@")) {
      onSubmit(email);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="mb-8 text-center">
        <Badge className="mb-4 capitalize" data-testid={`badge-role-${role}`}>
          {role}
        </Badge>
        <h2 className="text-3xl font-bold mb-2">Create Your Account</h2>
        <p className="text-muted-foreground">
          Enter your email to get started
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
            data-testid="button-continue"
          >
            Continue
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
      </form>
    </div>
  );
}
