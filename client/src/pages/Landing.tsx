import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import RoleSelectionCard from "@/components/RoleSelectionCard";
import EmailSignupForm from "@/components/EmailSignupForm";
import ProgressIndicator from "@/components/ProgressIndicator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft } from "lucide-react";
import type { Athlete, Coach } from "@shared/schema";
import logoImage from "@assets/CoachFinders_image-removebg-preview_1771126900909.png";

export default function Landing() {
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const isSignInMode = urlParams.get("mode") === "signin";
  const roleFromUrl = urlParams.get("role") as "athlete" | "coach" | null;

  const [step, setStep] = useState<1 | 2 | 3>(() =>
    isSignInMode && (roleFromUrl === "athlete" || roleFromUrl === "coach") ? 2 : 1
  );
  const [role, setRole] = useState<"athlete" | "coach" | null>(() =>
    isSignInMode && (roleFromUrl === "athlete" || roleFromUrl === "coach") ? roleFromUrl : null
  );
  const [email, setEmail] = useState("");
  const [loginStep, setLoginStep] = useState<"credentials" | "verification">("credentials");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupEmailSent, setSignupEmailSent] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setUserLocally } = useAuth();

  const sendVerificationMutation = useMutation({
    mutationFn: async ({ email: signupEmail, password: signupPassword, role: signupRole }: { email: string; password: string; role: string }) => {
      const res = await apiRequest("POST", "/api/signup/send-verification", {
        email: signupEmail,
        password: signupPassword,
        role: signupRole,
      });
      return await res.json();
    },
    onSuccess: () => {
      setSignupEmailSent(true);
      setStep(3);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email: loginEmail, password: loginPassword }: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/login", { email: loginEmail, password: loginPassword });
      return await res.json();
    },
    onSuccess: () => {
      setLoginError(null);
      setLoginStep("verification");
      toast({
        title: "Code sent",
        description: "Check your email for the verification code.",
      });
    },
    onError: (error: Error) => {
      const msg = error.message;
      if (msg.includes("404")) {
        setLoginError("No account found with this email.");
      } else if (msg.includes("401")) {
        setLoginError("Incorrect password. Please try again.");
      } else {
        setLoginError(msg);
      }
    },
  });

  const coachLoginMutation = useMutation({
    mutationFn: async ({ email: loginEmail, password: loginPassword }: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/login/coach", { email: loginEmail, password: loginPassword });
      return await res.json();
    },
    onSuccess: () => {
      setLoginError(null);
      setLoginStep("verification");
      toast({
        title: "Code sent",
        description: "Check your email for the verification code.",
      });
    },
    onError: (error: Error) => {
      const msg = error.message;
      if (msg.includes("404")) {
        setLoginError("No coach account found with this email.");
      } else if (msg.includes("401")) {
        setLoginError("Incorrect password. Please try again.");
      } else {
        setLoginError(msg);
      }
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async ({ email: verifyEmail, code }: { email: string; code: string }) => {
      const endpoint = role === "athlete" ? "/api/login/verify" : "/api/login/coach/verify";
      const res = await apiRequest("POST", endpoint, { email: verifyEmail, code });
      return await res.json();
    },
    onSuccess: (data: Athlete | Coach) => {
      if (role === "athlete") {
        setUserLocally(data, "athlete");
        // Navigation is handled by the welcome dialog (or directly in setUserLocally if dismissed)
      } else {
        setUserLocally(data, "coach");
        toast({
          title: "Welcome back!",
          description: "Redirecting you to your profile...",
        });
        setLocation("/coach-profile");
      }
    },
    onError: (error: Error) => {
      const msg = error.message;
      if (msg.includes("401")) {
        setLoginError("Invalid or expired verification code.");
      } else {
        setLoginError(msg);
      }
    },
  });

  const handleRoleSelect = (selectedRole: "athlete" | "coach") => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleEmailSubmit = (submittedEmail: string, submittedPassword: string) => {
    setEmail(submittedEmail);
    if (role) {
      sendVerificationMutation.mutate({ email: submittedEmail, password: submittedPassword, role });
    }
  };

  const handleBackFromEmail = () => {
    if (loginStep === "verification") {
      setLoginStep("credentials");
      setLoginError(null);
      return;
    }
    setStep(1);
    setRole(null);
    setLoginStep("credentials");
    setLoginError(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          {step === 1 && (
            <div className="mb-8">
              <ProgressIndicator currentStep={step} totalSteps={3} />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-8">
              <div className="text-center mb-12">
                <div className="flex justify-center mb-6">
                  <img
                    src={logoImage}
                    alt="CoachFinders"
                    className="h-12 md:h-16 w-auto"
                    data-testid="img-logo"
                  />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-landing-title">
                  {isSignInMode ? (
                    <>
                      <span className="text-brand-green">Sign</span>{" "}
                      <span className="text-brand-gold">In</span>
                    </>
                  ) : (
                    <>
                      <span className="text-brand-green">Find Your</span>{" "}
                      <span className="text-brand-gold">Perfect Coach</span>
                    </>
                  )}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {isSignInMode ? "Select your role to continue" : "Join as an athlete or coach to get started"}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RoleSelectionCard role="athlete" onSelect={handleRoleSelect} />
                <RoleSelectionCard role="coach" onSelect={handleRoleSelect} />
              </div>
            </div>
          )}

          {step === 2 && role && (
            <EmailSignupForm
              role={role}
              onSubmit={handleEmailSubmit}
              onBack={handleBackFromEmail}
              onLogin={(loginEmail, loginPassword) => {
                setEmail(loginEmail);
                setLoginError(null);
                if (role === "athlete") {
                  loginMutation.mutate({ email: loginEmail, password: loginPassword });
                } else {
                  coachLoginMutation.mutate({ email: loginEmail, password: loginPassword });
                }
              }}
              onVerifyCode={(verifyEmail, code) => {
                setLoginError(null);
                verifyCodeMutation.mutate({ email: verifyEmail, code });
              }}
              isLoginPending={role === "athlete" ? loginMutation.isPending : coachLoginMutation.isPending}
              isVerifyPending={verifyCodeMutation.isPending}
              loginStep={loginStep}
              loginError={loginError}
              initialIsSignIn={isSignInMode}
              isSignupPending={sendVerificationMutation.isPending}
            />
          )}

          {step === 3 && signupEmailSent && (
            <div className="flex items-center justify-center">
              <Card className="w-full max-w-md">
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="space-y-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold" data-testid="text-check-email-title">
                        Check Your Email
                      </h2>
                      <p className="text-muted-foreground">
                        We've sent a welcome message with a verification link to:
                      </p>
                      <p className="font-medium" data-testid="text-sent-email">{email}</p>
                    </div>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>Click the link in the email to verify your address and continue setting up your profile.</p>
                      <p>The link expires in 24 hours. Check your spam folder if you don't see it.</p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setStep(1);
                        setRole(null);
                        setSignupEmailSent(false);
                        setEmail("");
                      }}
                      data-testid="button-back-to-start"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Start
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
