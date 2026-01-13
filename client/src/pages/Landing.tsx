import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import RoleSelectionCard from "@/components/RoleSelectionCard";
import EmailSignupForm from "@/components/EmailSignupForm";
import ProfileSetupForm from "@/components/ProfileSetupForm";
import ProgressIndicator from "@/components/ProgressIndicator";
import type { Athlete, Coach } from "@shared/schema";

export default function Landing() {
  const searchString = useSearch();
  const isSignInMode = new URLSearchParams(searchString).get("mode") === "signin";
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [role, setRole] = useState<"athlete" | "coach" | null>(null);
  const [email, setEmail] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const createAthleteMutation = useMutation({
    mutationFn: async (data: { name: string; sport: string; location: string; email: string; profileImage?: string; availableForCoachRequests?: boolean; gender?: string; age?: string; skillLevel?: string; preferredCoachGender?: string }) => {
      const res = await apiRequest("POST", "/api/athletes", {
        ...data,
        availableForCoachRequests: data.availableForCoachRequests ? "true" : "false",
      });
      return await res.json();
    },
    onSuccess: (athlete: Athlete) => {
      localStorage.setItem("currentAthlete", JSON.stringify(athlete));
      toast({
        title: "Profile created!",
        description: "Welcome! Browse our coaches below.",
      });
      setLocation("/coaches");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCoachMutation = useMutation({
    mutationFn: async (data: { 
      name: string; 
      sport: string; 
      location: string; 
      email: string; 
      profileImage?: string;
      certification?: string;
      performanceLevel?: string;
      age?: string;
      gender?: string;
      bio?: string;
      hourlyRate?: string;
      coachingOptions?: string[];
      yearsOfExperience?: string;
      studentLevels?: string[];
    }) => {
      const res = await apiRequest("POST", "/api/coaches", data);
      return await res.json();
    },
    onSuccess: (coach: Coach) => {
      localStorage.setItem("currentCoach", JSON.stringify(coach));
      toast({
        title: "Profile created!",
        description: "Your coach profile is now live.",
      });
      setLocation("/coach-profile");
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
    mutationFn: async (loginEmail: string) => {
      const res = await apiRequest("POST", "/api/login", { email: loginEmail });
      return await res.json();
    },
    onSuccess: (athlete: Athlete) => {
      localStorage.setItem("currentAthlete", JSON.stringify(athlete));
      toast({
        title: "Welcome back!",
        description: "Redirecting you to coaches list...",
      });
      setLocation("/coaches");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message === "404: User not found" ? "User not found" : error.message,
        variant: "destructive",
      });
    },
  });

  const coachLoginMutation = useMutation({
    mutationFn: async (loginEmail: string) => {
      const res = await apiRequest("POST", "/api/login/coach", { email: loginEmail });
      return await res.json();
    },
    onSuccess: (coach: Coach) => {
      localStorage.setItem("currentCoach", JSON.stringify(coach));
      toast({
        title: "Welcome back!",
        description: "Redirecting you to your profile...",
      });
      setLocation("/coach-profile");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message === "404: Coach not found" ? "Coach not found" : error.message,
        variant: "destructive",
      });
    },
  });

  const handleRoleSelect = (selectedRole: "athlete" | "coach") => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleEmailSubmit = (submittedEmail: string) => {
    setEmail(submittedEmail);
    setStep(3);
  };

  const handleProfileSubmit = (profile: {
    name: string;
    location: string;
    sports: string[];
    profileImage?: string;
    certification?: string;
    performanceLevel?: string;
    age?: string;
    gender?: string;
    bio?: string;
    hourlyRate?: string;
    coachingOptions?: string[];
    yearsOfExperience?: string;
    studentLevels?: string[];
    availableForCoachRequests?: boolean;
    skillLevel?: string;
    preferredCoachGender?: string;
  }) => {
    const data: any = {
      name: profile.name,
      sport: profile.sports[0],
      location: profile.location,
      email: email,
      profileImage: profile.profileImage,
    };

    if (role === "athlete") {
      data.availableForCoachRequests = profile.availableForCoachRequests;
      data.gender = profile.gender;
      data.age = profile.age;
      data.skillLevel = profile.skillLevel;
      data.preferredCoachGender = profile.preferredCoachGender;
    }

    if (role === "coach") {
      data.certification = profile.certification;
      data.performanceLevel = profile.performanceLevel;
      data.age = profile.age;
      data.gender = profile.gender;
      data.bio = profile.bio;
      data.hourlyRate = profile.hourlyRate;
      data.coachingOptions = profile.coachingOptions;
      data.yearsOfExperience = profile.yearsOfExperience;
      data.studentLevels = profile.studentLevels;
    }

    if (role === "athlete") {
      createAthleteMutation.mutate(data);
    } else if (role === "coach") {
      createCoachMutation.mutate(data);
    }
  };

  const handleBackFromEmail = () => {
    setStep(1);
    setRole(null);
  };

  const handleBackFromProfile = () => {
    setStep(2);
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
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {isSignInMode ? "Sign In" : "Join as an Athlete or Coach"}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {isSignInMode ? "Select your role to continue" : "Choose how you want to get started"}
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
              onLogin={(email) => {
                if (role === "athlete") {
                  loginMutation.mutate(email);
                } else {
                  coachLoginMutation.mutate(email);
                }
              }}
              isLoginPending={role === "athlete" ? loginMutation.isPending : coachLoginMutation.isPending}
              initialIsSignIn={isSignInMode}
            />
          )}

          {step === 3 && role && email && (
            <ProfileSetupForm
              role={role}
              email={email}
              onSubmit={handleProfileSubmit}
              onBack={handleBackFromProfile}
            />
          )}
        </div>
      </div>
    </div>
  );
}
