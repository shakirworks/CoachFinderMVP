import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SportsChip from "./SportsChip";
import { Camera, MapPin, User } from "lucide-react";
import athleteImage from "@assets/stock_images/tennis_player_athlet_960431b6.jpg";
import coachImage from "@assets/stock_images/coach_mentor_trainer_f4712e56.jpg";

interface ProfileSetupFormProps {
  role: "athlete" | "coach";
  email: string;
  onSubmit: (profile: {
    name: string;
    location: string;
    sports: string[];
    profileImage?: string;
  }) => void;
  onBack: () => void;
}

const SPORTS_OPTIONS = [
  "Soccer",
  "Tennis",
  "Golf",
];

export default function ProfileSetupForm({
  role,
  email,
  onSubmit,
  onBack,
}: ProfileSetupFormProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [selectedSports, setSelectedSports] = useState<string[]>([]);

  const handleSportToggle = (sport: string) => {
    setSelectedSports((prev) =>
      prev.includes(sport)
        ? prev.filter((s) => s !== sport)
        : [...prev, sport]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && location && selectedSports.length > 0) {
      onSubmit({ name, location, sports: selectedSports });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2">Complete Your Profile</h2>
        <p className="text-muted-foreground">
          Tell us about yourself to get started
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Avatar className="w-32 h-32">
            <AvatarImage
              src={role === "athlete" ? athleteImage : coachImage}
              alt={`${role} profile`}
              className="object-cover"
            />
            <AvatarFallback className="bg-muted">
              <Camera className="w-12 h-12 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="button-upload-photo"
          >
            <Camera className="w-4 h-4 mr-2" />
            Upload Photo
          </Button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 h-12"
                required
                data-testid="input-name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="location"
                type="text"
                placeholder="City, Country"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10 h-12"
                required
                data-testid="input-location"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Your Sports</Label>
            <p className="text-sm text-muted-foreground">
              Select all sports you're interested in
            </p>
            <div className="flex flex-wrap gap-3">
              {SPORTS_OPTIONS.map((sport) => (
                <SportsChip
                  key={sport}
                  sport={sport}
                  selected={selectedSports.includes(sport)}
                  onToggle={handleSportToggle}
                />
              ))}
            </div>
            {selectedSports.length === 0 && (
              <p className="text-sm text-destructive">
                Please select at least one sport
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            type="submit"
            className="w-full h-12"
            disabled={!name || !location || selectedSports.length === 0}
            data-testid="button-complete-profile"
          >
            Complete Profile
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
