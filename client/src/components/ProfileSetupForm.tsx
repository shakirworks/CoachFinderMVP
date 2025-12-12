import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SportsChip from "./SportsChip";
import { Camera, MapPin, User, DollarSign } from "lucide-react";
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
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [availableForCoachRequests, setAvailableForCoachRequests] = useState(false);
  
  const [certification, setCertification] = useState("");
  const [performanceLevel, setPerformanceLevel] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [coachingOptions, setCoachingOptions] = useState<string[]>([]);
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [studentLevels, setStudentLevels] = useState<string[]>([]);

  const handleSportToggle = (sport: string) => {
    setSelectedSport(sport);
  };

  const handleCoachingOptionToggle = (option: string) => {
    setCoachingOptions(prev =>
      prev.includes(option)
        ? prev.filter(o => o !== option)
        : [...prev, option]
    );
  };

  const handleStudentLevelToggle = (level: string) => {
    setStudentLevels(prev =>
      prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && location && selectedSport) {
      const profile: any = { name, location, sports: [selectedSport] };
      
      if (role === "athlete") {
        profile.availableForCoachRequests = availableForCoachRequests;
      }
      
      if (role === "coach") {
        profile.certification = certification;
        profile.performanceLevel = performanceLevel;
        profile.age = age;
        profile.gender = gender;
        profile.bio = bio;
        profile.hourlyRate = hourlyRate;
        profile.coachingOptions = coachingOptions.length > 0 ? coachingOptions : undefined;
        profile.yearsOfExperience = yearsOfExperience;
        profile.studentLevels = studentLevels.length > 0 ? studentLevels : undefined;
      }
      
      onSubmit(profile);
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
            <Label>Your Sport</Label>
            <p className="text-sm text-muted-foreground">
              Select your primary sport
            </p>
            <div className="flex flex-wrap gap-3">
              {SPORTS_OPTIONS.map((sport) => (
                <SportsChip
                  key={sport}
                  sport={sport}
                  selected={selectedSport === sport}
                  onToggle={handleSportToggle}
                />
              ))}
            </div>
            {!selectedSport && (
              <p className="text-sm text-destructive">
                Please select a sport
              </p>
            )}
          </div>

          {role === "athlete" && (
            <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
              <Checkbox
                id="availableForCoachRequests"
                checked={availableForCoachRequests}
                onCheckedChange={(checked) => setAvailableForCoachRequests(checked === true)}
                data-testid="checkbox-coach-requests"
              />
              <div className="space-y-1">
                <Label 
                  htmlFor="availableForCoachRequests" 
                  className="text-sm font-medium cursor-pointer"
                >
                  Available for inbound requests from coaches
                </Label>
                <p className="text-xs text-muted-foreground">
                  Allow coaches to reach out to you with training opportunities and offers
                </p>
              </div>
            </div>
          )}

          {role === "coach" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="certification">Certification</Label>
                <Input
                  id="certification"
                  type="text"
                  placeholder="e.g., USSF A License, PTR Certified"
                  value={certification}
                  onChange={(e) => setCertification(e.target.value)}
                  className="h-12"
                  data-testid="input-certification"
                />
                <p className="text-xs text-muted-foreground">Optional</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="performanceLevel">Performance Level</Label>
                <Select value={performanceLevel} onValueChange={setPerformanceLevel}>
                  <SelectTrigger className="h-12" data-testid="select-performance-level">
                    <SelectValue placeholder="Select your level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Elite">Elite</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Optional</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="text"
                    placeholder="e.g., 35"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="h-12"
                    data-testid="input-age"
                  />
                  <p className="text-xs text-muted-foreground">Optional</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="h-12" data-testid="select-gender">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Non-binary">Non-binary</SelectItem>
                      <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Optional</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">About You</Label>
                <Textarea
                  id="bio"
                  placeholder="Share a bit about your coaching experience and philosophy..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="min-h-24 resize-none"
                  data-testid="input-bio"
                />
                <p className="text-xs text-muted-foreground">Optional - Tell athletes about your experience</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="hourlyRate"
                      type="number"
                      placeholder="e.g., 75"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      className="pl-10 h-12"
                      data-testid="input-hourly-rate"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Optional</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                  <Input
                    id="yearsOfExperience"
                    type="number"
                    placeholder="e.g., 5"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    className="h-12"
                    data-testid="input-years-of-experience"
                  />
                  <p className="text-xs text-muted-foreground">Optional</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Coaching Options</Label>
                <p className="text-sm text-muted-foreground">Who do you coach?</p>
                <div className="space-y-3">
                  {["Adults", "Kids", "Groups"].map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`coaching-${option}`}
                        checked={coachingOptions.includes(option)}
                        onCheckedChange={() => handleCoachingOptionToggle(option)}
                        data-testid={`checkbox-coaching-${option.toLowerCase()}`}
                      />
                      <label
                        htmlFor={`coaching-${option}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Optional - Select one or more</p>
              </div>

              <div className="space-y-3">
                <Label>Student Levels</Label>
                <p className="text-sm text-muted-foreground">What levels do you teach?</p>
                <div className="space-y-3">
                  {["Beginner", "Intermediate", "Advanced"].map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={`level-${level}`}
                        checked={studentLevels.includes(level)}
                        onCheckedChange={() => handleStudentLevelToggle(level)}
                        data-testid={`checkbox-level-${level.toLowerCase()}`}
                      />
                      <label
                        htmlFor={`level-${level}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {level}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Optional - Select one or more</p>
              </div>
            </>
          )}
        </div>

        <div className="space-y-3 pt-4">
          <Button
            type="submit"
            className="w-full h-12"
            disabled={!name || !location || !selectedSport}
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
