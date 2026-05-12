import CoachCard from "../CoachCard";
import type { Coach } from "@shared/schema";

export default function CoachCardExample() {
  const sampleCoach: Coach = {
    id: "1",
    name: "Michael Thompson",
    email: "michael.thompson@email.com",
    sport: "Soccer",
    location: "Toronto",
    password: "demo",
    emailVerified: "true",
    profileImage: null,
    certification: null,
    certificationFileUrl: null,
    performanceLevel: null,
    age: null,
    gender: null,
    bio: null,
    hourlyRate: null,
    coachingOptions: null,
    yearsOfExperience: null,
    studentLevels: null,
    stripeAccountId: null,
    stripeAccountStatus: null,
    stripeOnboardingComplete: null,
    latitude: null,
    longitude: null,
    trainingLocation: null,
  };

  return (
    <div className="max-w-md p-6">
      <CoachCard coach={sampleCoach} />
    </div>
  );
}
