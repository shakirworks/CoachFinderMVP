import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CoachCard from "@/components/CoachCard";
import { Search, Filter, User } from "lucide-react";
import { useLocation } from "wouter";
import type { Coach, Athlete } from "@shared/schema";
import { useState, useEffect } from "react";
import athleteImage from "@assets/stock_images/tennis_player_athlet_960431b6.jpg";

export default function CoachesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const athleteData = localStorage.getItem("currentAthlete");
    if (athleteData) {
      setAthlete(JSON.parse(athleteData));
    }
  }, []);

  const { data: coaches, isLoading } = useQuery<Coach[]>({
    queryKey: ["/api/coaches"],
  });

  const filteredCoaches = coaches?.filter((coach) => {
    const matchesSearch = coach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coach.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = !selectedSport || coach.sport === selectedSport;
    return matchesSearch && matchesSport;
  });

  const sports = ["Soccer", "Tennis", "Golf"];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading coaches...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Find Your Coach</h1>
            <p className="text-muted-foreground">
              Browse through our network of experienced coaches
            </p>
          </div>
          
          {athlete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex flex-col items-center gap-2 h-auto py-2 px-3 hover-elevate"
                  data-testid="button-athlete-menu"
                >
                  <Avatar className="w-10 h-10 md:w-24 md:h-24">
                    <AvatarImage
                      src={athlete.profileImage || athleteImage}
                      alt={athlete.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-base md:text-3xl">
                      {athlete.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium text-foreground">
                    {athlete.name.split(' ')[0]}
                  </span>
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
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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

          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <Button
              variant={selectedSport === null ? "default" : "outline"}
              onClick={() => setSelectedSport(null)}
              size="sm"
              data-testid="button-filter-all"
            >
              All Sports
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

        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredCoaches?.length || 0} coaches
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoaches?.map((coach) => (
            <CoachCard key={coach.id} coach={coach} />
          ))}
        </div>

        {filteredCoaches?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No coaches found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
