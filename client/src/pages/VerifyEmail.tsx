import { useState, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Loader2, ArrowRight } from "lucide-react";

export default function VerifyEmail() {
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  const token = new URLSearchParams(searchString).get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token found. Please check your email for the correct link.");
      return;
    }

    fetch(`/api/verify-email/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Verification failed");
        }
        setEmail(data.email);
        setRole(data.role);
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        setErrorMessage(err.message);
      });
  }, [token]);

  const handleContinue = () => {
    setLocation(`/profile-setup?token=${token}&email=${encodeURIComponent(email)}&role=${role}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center">
          {status === "loading" && (
            <div className="space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-muted-foreground" />
              <h2 className="text-xl font-semibold" data-testid="text-verify-loading">
                Verifying your email...
              </h2>
              <p className="text-muted-foreground">Please wait while we confirm your email address.</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold" data-testid="text-verify-success">
                  Email Verified!
                </h2>
                <p className="text-muted-foreground">
                  Your email <strong data-testid="text-verified-email">{email}</strong> has been successfully verified.
                </p>
                <p className="text-muted-foreground">
                  You're almost done! Continue to set up your {role} profile.
                </p>
              </div>
              <Button
                className="w-full"
                onClick={handleContinue}
                data-testid="button-continue-profile"
              >
                Continue to Profile Setup
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold" data-testid="text-verify-error">
                  Verification Failed
                </h2>
                <p className="text-muted-foreground" data-testid="text-error-message">
                  {errorMessage}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/signup")}
                data-testid="button-try-again"
              >
                Back to Sign Up
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
