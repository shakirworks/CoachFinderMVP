import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Mail, ArrowLeft } from "lucide-react";
import type { Athlete } from "@shared/schema";
import athleteImage from "@assets/stock_images/tennis_player_athlet_960431b6.jpg";

export default function AthleteProfile() {
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const athleteData = localStorage.getItem("currentAthlete");
    if (athleteData) {
      setAthlete(JSON.parse(athleteData));
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  if (!athlete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/coaches")}
          className="mb-6"
          data-testid="button-back-to-coaches"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Coaches
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage
                  src={athlete.profileImage || athleteImage}
                  alt={athlete.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-2xl">
                  {athlete.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2" data-testid="text-athlete-name">
                  {athlete.name}
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span data-testid="text-athlete-email">{athlete.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span data-testid="text-athlete-location">{athlete.location}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Sport</h3>
              <Badge variant="secondary" data-testid="badge-athlete-sport">
                {athlete.sport}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
