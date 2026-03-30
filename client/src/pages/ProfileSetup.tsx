import { useMutation } from "@tanstack/react-query";
import { useSearch, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import ProfileSetupForm from "@/components/ProfileSetupForm";
import type { Athlete, Coach } from "@shared/schema";

export default function ProfileSetup() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token") || "";
  const email = params.get("email") || "";
  const role = (params.get("role") || "athlete") as "athlete" | "coach";

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setUserLocally } = useAuth();

  const createAthleteMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/athletes", data);
      return await res.json();
    },
    onSuccess: (athlete: Athlete) => {
      setUserLocally(athlete, "athlete");
      // Navigation is handled by the welcome dialog (or directly in setUserLocally if dismissed)
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
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/coaches", data);
      return await res.json();
    },
    onSuccess: (coach: Coach) => {
      setUserLocally(coach, "coach");
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

  const handleProfileSubmit = (profile: {
    name: string;
    location: string;
    latitude?: number;
    longitude?: number;
    sports: string[];
    profileImage?: string;
    certification?: string;
    certificationFileUrl?: string;
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
    const data: Record<string, unknown> = {
      name: profile.name,
      sport: profile.sports[0],
      location: profile.location,
      latitude: profile.latitude,
      longitude: profile.longitude,
      email,
      password: "placeholder",
      verificationToken: token,
      profileImage: profile.profileImage,
    };

    if (role === "athlete") {
      data.availableForCoachRequests = profile.availableForCoachRequests ? "true" : "false";
      data.gender = profile.gender;
      data.age = profile.age;
      data.skillLevel = profile.skillLevel;
      data.preferredCoachGender = profile.preferredCoachGender;
    }

    if (role === "coach") {
      data.certification = profile.certification;
      data.certificationFileUrl = profile.certificationFileUrl;
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
    } else {
      createCoachMutation.mutate(data);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Invalid Link</h2>
          <p className="text-muted-foreground">This profile setup link is invalid. Please verify your email first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <ProfileSetupForm
            role={role}
            email={email}
            onSubmit={handleProfileSubmit}
            onBack={() => setLocation("/signup")}
          />
        </div>
      </div>
    </div>
  );
}
