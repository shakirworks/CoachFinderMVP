import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Mail, ArrowLeft, LogOut, Edit } from "lucide-react";
import type { Athlete } from "@shared/schema";
import athleteImage from "@assets/stock_images/tennis_player_athlet_960431b6.jpg";

export default function AthleteProfile() {
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedLocation, setEditedLocation] = useState("");
  const [editedSport, setEditedSport] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const athleteData = localStorage.getItem("currentAthlete");
    if (athleteData) {
      const parsedAthlete = JSON.parse(athleteData);
      setAthlete(parsedAthlete);
      setEditedName(parsedAthlete.name);
      setEditedLocation(parsedAthlete.location);
      setEditedSport(parsedAthlete.sport);
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  const updateMutation = useMutation({
    mutationFn: async (updates: { name: string; location: string; sport: string }) => {
      const res = await apiRequest("PATCH", `/api/athletes/${athlete!.id}`, updates);
      return await res.json();
    },
    onSuccess: (updatedAthlete: Athlete) => {
      setAthlete(updatedAthlete);
      localStorage.setItem("currentAthlete", JSON.stringify(updatedAthlete));
      setIsEditing(false);
      toast({
        title: "Profile updated!",
        description: "Your changes have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("currentAthlete");
    setLocation("/");
  };

  const handleSave = () => {
    if (!editedName.trim() || !editedLocation.trim() || !editedSport) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    updateMutation.mutate({
      name: editedName,
      location: editedLocation,
      sport: editedSport,
    });
  };

  const handleCancel = () => {
    if (athlete) {
      setEditedName(athlete.name);
      setEditedLocation(athlete.location);
      setEditedSport(athlete.sport);
    }
    setIsEditing(false);
  };

  if (!athlete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const sports = ["Soccer", "Tennis", "Golf"];

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
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <CardTitle>My Profile</CardTitle>
            <div className="flex gap-2">
              {!isEditing && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    data-testid="button-edit-profile"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    data-testid="button-logout"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </Button>
                </>
              )}
            </div>
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

              <div className="flex-1 space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        data-testid="input-edit-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={athlete.email}
                        disabled
                        className="bg-muted"
                        data-testid="input-edit-email"
                      />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={editedLocation}
                        onChange={(e) => setEditedLocation(e.target.value)}
                        data-testid="input-edit-location"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sport">Preferred Sport</Label>
                      <Select value={editedSport} onValueChange={setEditedSport}>
                        <SelectTrigger data-testid="select-edit-sport">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sports.map((sport) => (
                            <SelectItem key={sport} value={sport}>
                              {sport}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        data-testid="button-save-profile"
                      >
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={updateMutation.isPending}
                        data-testid="button-cancel-edit"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
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

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Sport</h3>
                      <Badge variant="secondary" data-testid="badge-athlete-sport">
                        {athlete.sport}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
