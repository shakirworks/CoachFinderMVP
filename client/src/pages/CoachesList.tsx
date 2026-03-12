import { useQuery } from "@tanstack/react-query";
import { useAuth, WELCOME_DISMISSED_KEY, WELCOME_SHOW_KEY, WELCOME_USER_KEY } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CoachCard from "@/components/CoachCard";
import ChatWindow from "@/components/ChatWindow";
import { Search, Filter, User, MessageCircle, ChevronDown, ChevronUp, X } from "lucide-react";
import { useLocation } from "wouter";
import type { Coach, Athlete } from "@shared/schema";
import { useState, useEffect } from "react";
import athleteImage from "@assets/stock_images/tennis_player_athlet_960431b6.jpg";

const WELCOME_SPORT_KEY = "coachfinders_search_sport";
const SPORTS = ["Soccer", "Tennis", "Golf", "Pickleball", "Skiing", "Baseball", "Personal Training"];

export default function CoachesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSport, setSelectedSport] = useState<string | null>(() => {
    const stored = localStorage.getItem(WELCOME_SPORT_KEY);
    if (stored) {
      localStorage.removeItem(WELCOME_SPORT_KEY);
      return stored;
    }
    return null;
  });
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedCoachingTypes, setSelectedCoachingTypes] = useState<string[]>([]);
  const [minRate, setMinRate] = useState("");
  const [maxRate, setMaxRate] = useState("");
  const [, setLocation] = useLocation();

  // Filter hint: visible for 15s then fades out
  const [filterHintVisible, setFilterHintVisible] = useState(true);
  const [filterHintFading, setFilterHintFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFilterHintFading(true), 14000);
    const hideTimer = setTimeout(() => setFilterHintVisible(false), 15000);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  // Welcome dialog state
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [welcomeUserName, setWelcomeUserName] = useState("");
  const [selectedWelcomeSport, setSelectedWelcomeSport] = useState<string | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // On mount: check if we should show the welcome dialog
  useEffect(() => {
    const shouldShow = localStorage.getItem(WELCOME_SHOW_KEY) === "true";
    if (shouldShow) {
      localStorage.removeItem(WELCOME_SHOW_KEY);
      const userName = localStorage.getItem(WELCOME_USER_KEY) || "";
      localStorage.removeItem(WELCOME_USER_KEY);
      setWelcomeUserName(userName);
      setSelectedWelcomeSport(null);
      setDontShowAgain(false);
      setShowWelcomeDialog(true);
    }
  }, []);

  const handleFindCoach = () => {
    if (dontShowAgain) {
      localStorage.setItem(WELCOME_DISMISSED_KEY, "true");
    }
    if (selectedWelcomeSport) {
      setSelectedSport(selectedWelcomeSport);
    }
    setShowWelcomeDialog(false);
  };

  const handleCloseWelcome = () => {
    if (dontShowAgain) {
      localStorage.setItem(WELCOME_DISMISSED_KEY, "true");
    }
    setShowWelcomeDialog(false);
  };

  const { authenticated, user: authUser, role: authRole, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (authenticated && authRole === "athlete" && authUser) {
      setAthlete(authUser as Athlete);
    } else {
      const athleteData = localStorage.getItem("currentAthlete");
      if (athleteData) {
        setAthlete(JSON.parse(athleteData));
      }
    }
  }, [authLoading, authenticated, authUser, authRole]);

  const { data: coaches, isLoading } = useQuery<Coach[]>({
    queryKey: ["/api/coaches"],
  });

  const studentLevelOptions = ["Beginner", "Intermediate", "Advanced"];
  const coachingTypeOptions = ["Adults", "Kids", "Groups"];

  const toggleLevel = (level: string) => {
    setSelectedLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const toggleCoachingType = (type: string) => {
    setSelectedCoachingTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSelectedLevels([]);
    setSelectedCoachingTypes([]);
    setMinRate("");
    setMaxRate("");
    setSelectedSport(null);
  };

  const hasActiveFilters = selectedLevels.length > 0 || selectedCoachingTypes.length > 0 || minRate || maxRate || selectedSport;

  const filteredCoaches = coaches?.filter((coach) => {
    const matchesSearch = coach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coach.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = !selectedSport || coach.sport === selectedSport;
    
    const matchesLevels = selectedLevels.length === 0 || 
      (coach.studentLevels && selectedLevels.some(level => coach.studentLevels?.includes(level)));
    
    const matchesCoachingTypes = selectedCoachingTypes.length === 0 ||
      (coach.coachingOptions && selectedCoachingTypes.some(type => coach.coachingOptions?.includes(type)));
    
    const coachRate = coach.hourlyRate ? parseFloat(coach.hourlyRate) : null;
    const minRateNum = minRate ? parseFloat(minRate) : null;
    const maxRateNum = maxRate ? parseFloat(maxRate) : null;
    
    const matchesMinRate = !minRateNum || (coachRate !== null && coachRate >= minRateNum);
    const matchesMaxRate = !maxRateNum || (coachRate !== null && coachRate <= maxRateNum);
    
    return matchesSearch && matchesSport && matchesLevels && matchesCoachingTypes && matchesMinRate && matchesMaxRate;
  });

  const sports = ["Soccer", "Tennis", "Golf", "Pickleball", "Skiing", "Baseball", "Personal Training"];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading coaches...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav>
        {athlete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2"
                data-testid="button-athlete-menu"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage
                    src={athlete.profileImage || athleteImage}
                    alt={athlete.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {athlete.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium">
                  {athlete.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setLocation("/profile")}
                data-testid="menu-item-profile"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLocation("/profile?tab=messages")}
                data-testid="menu-item-messages"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Messages
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SiteNav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Find Your Coach</h1>
          <p className="text-muted-foreground">
            Browse through our network of experienced coaches
          </p>
        </div>

        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
              data-testid="input-search"
            />
          </div>

          <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <div className="flex items-center gap-3">
              <CollapsibleTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2"
                  data-testid="button-filter-toggle"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1">
                      {(selectedLevels.length + selectedCoachingTypes.length + (selectedSport ? 1 : 0) + (minRate ? 1 : 0) + (maxRate ? 1 : 0))}
                    </Badge>
                  )}
                  {isFilterOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              {filterHintVisible && (
                <span
                  className={`text-xs text-muted-foreground italic transition-opacity duration-1000 select-none pointer-events-none ${filterHintFading ? "opacity-0" : "opacity-100"}`}
                  data-testid="text-filter-hint"
                >
                  Use filters to refine your search
                </span>
              )}
              
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-1 text-muted-foreground"
                  data-testid="button-clear-filters"
                >
                  <X className="w-4 h-4" />
                  Clear all
                </Button>
              )}
            </div>

            <CollapsibleContent>
              <Card className="mt-4">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Sport</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={selectedSport === null ? "default" : "outline"}
                          onClick={() => setSelectedSport(null)}
                          size="sm"
                          data-testid="button-filter-all"
                        >
                          All
                        </Button>
                        {sports.map((sport) => (
                          <Button
                            key={sport}
                            variant={selectedSport === sport ? "default" : "outline"}
                            onClick={() => setSelectedSport(sport)}
                            size="sm"
                            data-testid={`button-filter-${sport.toLowerCase()}`}
                          >
                            {sport}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-3 block">Student Levels</Label>
                      <div className="space-y-2">
                        {studentLevelOptions.map((level) => (
                          <div key={level} className="flex items-center gap-2">
                            <Checkbox
                              id={`level-${level}`}
                              checked={selectedLevels.includes(level)}
                              onCheckedChange={() => toggleLevel(level)}
                              data-testid={`checkbox-level-${level.toLowerCase()}`}
                            />
                            <Label
                              htmlFor={`level-${level}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {level}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-3 block">Coaching Types</Label>
                      <div className="space-y-2">
                        {coachingTypeOptions.map((type) => (
                          <div key={type} className="flex items-center gap-2">
                            <Checkbox
                              id={`type-${type}`}
                              checked={selectedCoachingTypes.includes(type)}
                              onCheckedChange={() => toggleCoachingType(type)}
                              data-testid={`checkbox-type-${type.toLowerCase()}`}
                            />
                            <Label
                              htmlFor={`type-${type}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {type}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-3 block">Hourly Rate ($)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={minRate}
                          onChange={(e) => setMinRate(e.target.value)}
                          className="w-24"
                          data-testid="input-min-rate"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="number"
                          placeholder="Max"
                          value={maxRate}
                          onChange={(e) => setMaxRate(e.target.value)}
                          className="w-24"
                          data-testid="input-max-rate"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredCoaches?.length || 0} coaches
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoaches?.map((coach) => (
            <CoachCard 
              key={coach.id} 
              coach={coach}
              onMessage={(coach) => {
                setSelectedCoach(coach);
                setIsChatOpen(true);
              }}
              onViewProfile={(coach) => {
                setLocation(`/coach/${coach.id}`);
              }}
            />
          ))}
        </div>

        {filteredCoaches?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No coaches found matching your criteria</p>
          </div>
        )}
      </div>

      {athlete && selectedCoach && (
        <ChatWindow
          open={isChatOpen}
          onOpenChange={setIsChatOpen}
          coach={selectedCoach}
          athlete={athlete}
        />
      )}

      <SiteFooter />

      {/* Athlete welcome dialog */}
      <Dialog open={showWelcomeDialog} onOpenChange={(open) => { if (!open) handleCloseWelcome(); }}>
        <DialogContent className="sm:max-w-lg" data-testid="dialog-welcome">
          <DialogHeader className="space-y-2 pb-1">
            <DialogTitle className="text-2xl font-semibold" data-testid="text-welcome-title">
              Welcome{welcomeUserName ? `, ${welcomeUserName}` : ""}!
            </DialogTitle>
            <DialogDescription className="text-base" data-testid="text-welcome-description">
              Let's find the perfect coach for you. Which sport are you training for?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <div className="flex flex-wrap gap-2" data-testid="sport-selector">
              {SPORTS.map((sport) => (
                <Button
                  key={sport}
                  variant={selectedWelcomeSport === sport ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setSelectedWelcomeSport((prev) => (prev === sport ? null : sport))
                  }
                  data-testid={`button-welcome-sport-${sport.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {sport}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter className="flex-col gap-3 sm:flex-col">
            <Button
              className="w-full"
              size="lg"
              onClick={handleFindCoach}
              data-testid="button-find-coach"
            >
              Find Your Coach
            </Button>
            <div className="flex items-center gap-2 justify-center" data-testid="dont-show-again-row">
              <Checkbox
                id="dont-show-again"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                data-testid="checkbox-dont-show-again"
              />
              <Label
                htmlFor="dont-show-again"
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                Don't show this message again
              </Label>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
