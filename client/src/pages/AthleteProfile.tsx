import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatWindow from "@/components/ChatWindow";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Mail, ArrowLeft, LogOut, Edit, MessageCircle } from "lucide-react";
import type { Athlete, Coach, Message } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import athleteImage from "@assets/stock_images/tennis_player_athlet_960431b6.jpg";
import coachImage from "@assets/stock_images/coach_mentor_trainer_f4712e56.jpg";

export default function AthleteProfile() {
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedLocation, setEditedLocation] = useState("");
  const [editedSport, setEditedSport] = useState("");
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: messageThreads } = useQuery<Array<{ coach: Coach; lastMessage: Message; unreadCount: number }>>({
    queryKey: [`/api/athletes/${athlete?.id}/messages`],
    enabled: !!athlete?.id,
  });

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
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/coaches")}
          className="mb-4 sm:mb-6"
          data-testid="button-back-to-coaches"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Coaches
        </Button>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
            <TabsTrigger value="messages" data-testid="tab-messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 space-y-0 pb-4">
            <CardTitle className="text-xl sm:text-2xl">My Profile</CardTitle>
            <div className="flex flex-wrap gap-2">
              {!isEditing && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    data-testid="button-edit-profile"
                    className="flex-1 sm:flex-none"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    data-testid="button-logout"
                    className="flex-1 sm:flex-none"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </Button>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                <AvatarImage
                  src={athlete.profileImage || athleteImage}
                  alt={athlete.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl sm:text-2xl">
                  {athlete.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 w-full space-y-4">
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

                    <div className="flex flex-wrap gap-2 pt-4">
                      <Button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        data-testid="button-save-profile"
                        className="flex-1 sm:flex-none"
                      >
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={updateMutation.isPending}
                        data-testid="button-cancel-edit"
                        className="flex-1 sm:flex-none"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center sm:text-left">
                      <h2 className="text-xl sm:text-2xl font-bold mb-2" data-testid="text-athlete-name">
                        {athlete.name}
                      </h2>
                      <div className="space-y-2">
                        <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground text-sm sm:text-base">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate" data-testid="text-athlete-email">{athlete.email}</span>
                        </div>
                        <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground text-sm sm:text-base">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span data-testid="text-athlete-location">{athlete.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-center sm:text-left">
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
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">My Messages</CardTitle>
              </CardHeader>
              <CardContent>
                {!messageThreads || messageThreads.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No messages yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Start a conversation with a coach from the coaches list
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messageThreads.map(({ coach, lastMessage }) => (
                      <Card
                        key={coach.id}
                        className="p-4 hover-elevate cursor-pointer transition-all"
                        onClick={() => {
                          setSelectedCoach(coach);
                          setIsChatOpen(true);
                        }}
                        data-testid={`thread-${coach.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-12 h-12 flex-shrink-0">
                            <AvatarImage
                              src={coach.profileImage || coachImage}
                              alt={coach.name}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {coach.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-semibold text-base">{coach.name}</h3>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {lastMessage.senderType === "athlete" ? "You: " : ""}{lastMessage.message}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {athlete && selectedCoach && (
          <ChatWindow
            open={isChatOpen}
            onOpenChange={setIsChatOpen}
            coach={selectedCoach}
            athlete={athlete}
          />
        )}
      </div>
    </div>
  );
}
