import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import ChatWindow from "@/components/ChatWindow";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Mail, LogOut, MessageCircle, DollarSign, Edit, User, ChevronDown } from "lucide-react";
import type { Coach, Athlete, Message } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import coachImage from "@assets/stock_images/coach_mentor_trainer_f4712e56.jpg";
import athleteImage from "@assets/stock_images/tennis_player_athlet_960431b6.jpg";

export default function CoachOwnProfile() {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedLocation, setEditedLocation] = useState("");
  const [editedSport, setEditedSport] = useState("");
  const [editedBio, setEditedBio] = useState("");
  const [editedHourlyRate, setEditedHourlyRate] = useState("");
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('availability');
  const { toast } = useToast();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'messages') {
      setActiveTab('messages');
    } else if (tabParam === 'edit') {
      setActiveTab('edit');
    } else {
      setActiveTab('availability');
    }
  }, []);

  useEffect(() => {
    const coachData = localStorage.getItem("currentCoach");
    if (coachData) {
      const parsedCoach = JSON.parse(coachData);
      setCoach(parsedCoach);
      setEditedName(parsedCoach.name || "");
      setEditedLocation(parsedCoach.location || "");
      setEditedSport(parsedCoach.sport || "");
      setEditedBio(parsedCoach.bio || "");
      setEditedHourlyRate(parsedCoach.hourlyRate?.toString() || "");
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  const updateMutation = useMutation({
    mutationFn: async (updates: { name: string; location: string; sport: string; bio?: string; hourlyRate?: number }) => {
      const res = await apiRequest("PATCH", `/api/coaches/${coach!.id}`, updates);
      return await res.json();
    },
    onSuccess: (updatedCoach: Coach) => {
      setCoach(updatedCoach);
      localStorage.setItem("currentCoach", JSON.stringify(updatedCoach));
      setIsEditing(false);
      setActiveTab('availability');
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
    localStorage.removeItem("currentCoach");
    setLocation("/");
  };

  const handleSave = () => {
    if (!editedName.trim() || !editedLocation.trim() || !editedSport) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    updateMutation.mutate({
      name: editedName.trim(),
      location: editedLocation.trim(),
      sport: editedSport,
      bio: editedBio.trim() || undefined,
      hourlyRate: editedHourlyRate ? parseInt(editedHourlyRate) : undefined,
    });
  };

  const sports = [
    "Basketball",
    "Soccer",
    "Tennis",
    "Golf",
    "Swimming",
    "Running",
    "Yoga",
    "CrossFit",
    "Boxing",
    "Other"
  ];

  if (!coach) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-xl font-semibold">Coach Dashboard</h1>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2" data-testid="button-profile-menu">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={coach.profileImage || coachImage}
                    alt={coach.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {coach.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline-block">{coach.name}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={() => setActiveTab('edit')}
                data-testid="menu-edit-profile"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                data-testid="menu-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="availability" data-testid="tab-availability">Availability</TabsTrigger>
            <TabsTrigger value="messages" data-testid="tab-messages">Messages</TabsTrigger>
            <TabsTrigger value="edit" data-testid="tab-edit">Edit Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="availability">
            <AvailabilityCalendar coachId={coach.id} isEditable={true} />
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">My Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No messages yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Athletes will be able to message you about coaching opportunities
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="edit">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Edit Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 pb-6 border-b">
                  <Avatar className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                    <AvatarImage
                      src={coach.profileImage || coachImage}
                      alt={coach.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl sm:text-2xl">
                      {coach.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-semibold">{coach.name}</h2>
                    <p className="text-sm text-muted-foreground">{coach.email}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      placeholder="Your name"
                      data-testid="input-edit-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={editedLocation}
                      onChange={(e) => setEditedLocation(e.target.value)}
                      placeholder="City, State"
                      data-testid="input-edit-location"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sport">Sport *</Label>
                    <Select value={editedSport} onValueChange={setEditedSport}>
                      <SelectTrigger data-testid="select-edit-sport">
                        <SelectValue placeholder="Select sport" />
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
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={editedHourlyRate}
                      onChange={(e) => setEditedHourlyRate(e.target.value)}
                      placeholder="e.g. 75"
                      data-testid="input-edit-rate"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value)}
                    placeholder="Tell athletes about yourself and your coaching style..."
                    className="min-h-[100px]"
                    data-testid="input-edit-bio"
                  />
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
                    onClick={() => {
                      setEditedName(coach.name);
                      setEditedLocation(coach.location);
                      setEditedSport(coach.sport);
                      setEditedBio(coach.bio || "");
                      setEditedHourlyRate(coach.hourlyRate?.toString() || "");
                    }}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
