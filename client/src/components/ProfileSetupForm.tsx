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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import SportsChip from "./SportsChip";
import { Camera, MapPin, User, DollarSign, FileText } from "lucide-react";
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
    skillLevel?: string;
    preferredCoachGender?: string;
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
  
  const [athleteGender, setAthleteGender] = useState("");
  const [athleteAge, setAthleteAge] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [preferredCoachGender, setPreferredCoachGender] = useState("");
  
  const [certification, setCertification] = useState("");
  const [performanceLevel, setPerformanceLevel] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [coachingOptions, setCoachingOptions] = useState<string[]>([]);
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [studentLevels, setStudentLevels] = useState<string[]>([]);
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [waiverDialogOpen, setWaiverDialogOpen] = useState(false);

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
        profile.gender = athleteGender || undefined;
        profile.age = athleteAge || undefined;
        profile.skillLevel = skillLevel || undefined;
        profile.preferredCoachGender = preferredCoachGender || undefined;
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
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="athleteGender">Gender</Label>
                  <Select value={athleteGender} onValueChange={setAthleteGender}>
                    <SelectTrigger className="h-12" data-testid="select-athlete-gender">
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

                <div className="space-y-2">
                  <Label htmlFor="athleteAge">Age</Label>
                  <Input
                    id="athleteAge"
                    type="number"
                    placeholder="e.g., 25"
                    value={athleteAge}
                    onChange={(e) => setAthleteAge(e.target.value)}
                    className="h-12"
                    data-testid="input-athlete-age"
                  />
                  <p className="text-xs text-muted-foreground">Optional</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="skillLevel">Skill Level</Label>
                  <Select value={skillLevel} onValueChange={setSkillLevel}>
                    <SelectTrigger className="h-12" data-testid="select-skill-level">
                      <SelectValue placeholder="Select your level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Optional</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredCoachGender">Preferred Coach Gender</Label>
                  <Select value={preferredCoachGender} onValueChange={setPreferredCoachGender}>
                    <SelectTrigger className="h-12" data-testid="select-preferred-coach-gender">
                      <SelectValue placeholder="Select preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="No Preference">No Preference</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Optional</p>
                </div>
              </div>

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
            </>
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

        {role === "coach" && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="waiver"
                checked={waiverAccepted}
                onCheckedChange={(checked) => setWaiverAccepted(checked === true)}
                data-testid="checkbox-waiver"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="waiver"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I agree to the{" "}
                  <Dialog open={waiverDialogOpen} onOpenChange={setWaiverDialogOpen}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-primary underline font-medium inline-flex items-center hover:opacity-80"
                        data-testid="button-view-waiver"
                      >
                        <FileText className="w-3 h-3 mr-1 inline" />
                        Liability Waiver
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle className="text-xl">CoachFinders Liability Waiver & Release Agreement</DialogTitle>
                        <DialogDescription>
                          Please read this agreement carefully before proceeding
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="h-[50vh] pr-4">
                        <div className="space-y-4 text-sm text-muted-foreground">
                          <p className="font-semibold text-foreground">COACH LIABILITY WAIVER AND RELEASE OF CLAIMS</p>
                          
                          <p>This Liability Waiver and Release Agreement ("Agreement") is entered into by and between CoachFinders ("Platform") and the undersigned Coach ("Coach") as of the date of electronic acceptance.</p>
                          
                          <p className="font-semibold text-foreground">1. ACKNOWLEDGMENT OF INDEPENDENT CONTRACTOR STATUS</p>
                          <p>Coach acknowledges and agrees that they are an independent contractor and not an employee, agent, or representative of CoachFinders. Coach is solely responsible for their own actions, conduct, and the services they provide to clients obtained through the Platform.</p>
                          
                          <p className="font-semibold text-foreground">2. RELEASE OF LIABILITY</p>
                          <p>Coach hereby releases, waives, discharges, and covenants not to sue CoachFinders, its officers, directors, employees, agents, and affiliates from any and all liability, claims, demands, actions, and causes of action arising out of or related to:</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>Any coaching services provided by Coach to clients</li>
                            <li>Any disputes, conflicts, or disagreements between Coach and clients</li>
                            <li>Any injuries, damages, or losses sustained by clients during coaching sessions</li>
                            <li>Any allegations of misconduct, negligence, or malpractice against Coach</li>
                            <li>Any financial disputes or payment issues between Coach and clients</li>
                          </ul>
                          
                          <p className="font-semibold text-foreground">3. INDEMNIFICATION</p>
                          <p>Coach agrees to indemnify, defend, and hold harmless CoachFinders from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or in connection with Coach's use of the Platform, Coach's coaching services, or any breach of this Agreement.</p>
                          
                          <p className="font-semibold text-foreground">4. ASSUMPTION OF RISK</p>
                          <p>Coach acknowledges that athletic coaching involves inherent risks and assumes full responsibility for ensuring safe practices, proper instruction, and appropriate safety measures during all coaching activities.</p>
                          
                          <p className="font-semibold text-foreground">5. PROFESSIONAL STANDARDS</p>
                          <p>Coach agrees to maintain appropriate professional certifications, insurance coverage, and conduct all coaching activities in accordance with applicable laws, regulations, and industry standards.</p>
                          
                          <p className="font-semibold text-foreground">6. NO WARRANTY BY PLATFORM</p>
                          <p>CoachFinders makes no representations or warranties regarding the suitability, qualifications, or background of any clients. Coach is solely responsible for vetting clients and determining the appropriateness of any coaching relationship.</p>
                          
                          <p className="font-semibold text-foreground">7. DISPUTE RESOLUTION</p>
                          <p>Any disputes between Coach and clients shall be resolved directly between those parties. CoachFinders is not responsible for mediating, arbitrating, or resolving any such disputes.</p>
                          
                          <p className="font-semibold text-foreground">8. SEVERABILITY</p>
                          <p>If any provision of this Agreement is found to be unenforceable, the remaining provisions shall continue in full force and effect.</p>
                          
                          <p className="font-semibold text-foreground">9. ELECTRONIC ACCEPTANCE</p>
                          <p>By checking the agreement box and completing your profile, you acknowledge that you have read, understood, and agree to be bound by all terms and conditions of this Agreement. This electronic acceptance shall have the same legal effect as a handwritten signature.</p>
                          
                          <p className="mt-4 text-xs">Last Updated: January 2026</p>
                        </div>
                      </ScrollArea>
                      <div className="flex justify-end pt-4 border-t">
                        <Button 
                          onClick={() => setWaiverDialogOpen(false)}
                          data-testid="button-close-waiver"
                        >
                          Close
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </label>
                <p className="text-xs text-muted-foreground">
                  You must accept the liability waiver to create your coach profile
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 pt-4">
          <Button
            type="submit"
            className="w-full h-12"
            disabled={!name || !location || !selectedSport || (role === "coach" && !waiverAccepted)}
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
