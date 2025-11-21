import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import ChatWindow from "@/components/ChatWindow";
import { MapPin, Mail, LogOut, MessageCircle, DollarSign } from "lucide-react";
import type { Coach, Athlete, Message } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import coachImage from "@assets/stock_images/coach_mentor_trainer_f4712e56.jpg";
import athleteImage from "@assets/stock_images/tennis_player_athlet_960431b6.jpg";

export default function CoachOwnProfile() {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'messages') {
      setActiveTab('messages');
    } else if (tabParam === 'availability') {
      setActiveTab('availability');
    } else {
      setActiveTab('profile');
    }
  }, []);

  useEffect(() => {
    const coachData = localStorage.getItem("currentCoach");
    if (coachData) {
      setCoach(JSON.parse(coachData));
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("currentCoach");
    setLocation("/");
  };

  if (!coach) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Coach Dashboard</h1>
          <Button
            variant="outline"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
            <TabsTrigger value="messages" data-testid="tab-messages">Messages</TabsTrigger>
            <TabsTrigger value="availability" data-testid="tab-availability">Availability</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">My Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
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

                  <div className="flex-1 w-full space-y-4">
                    <div className="text-center sm:text-left">
                      <h2 className="text-xl sm:text-2xl font-bold mb-2" data-testid="text-coach-name">
                        {coach.name}
                      </h2>
                      <div className="space-y-2">
                        <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground text-sm sm:text-base">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate" data-testid="text-coach-email">{coach.email}</span>
                        </div>
                        <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground text-sm sm:text-base">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span data-testid="text-coach-location">{coach.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Sport</h3>
                        <Badge variant="secondary" data-testid="badge-coach-sport">
                          {coach.sport}
                        </Badge>
                      </div>

                      {coach.hourlyRate && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Hourly Rate</h3>
                          <Badge variant="default" className="gap-1" data-testid="badge-coach-rate">
                            <DollarSign className="w-3 h-3" />
                            {coach.hourlyRate}/hr
                          </Badge>
                        </div>
                      )}

                      {coach.yearsOfExperience && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Experience</h3>
                          <Badge variant="outline" data-testid="badge-coach-experience">
                            {coach.yearsOfExperience} years
                          </Badge>
                        </div>
                      )}

                      {coach.coachingOptions && coach.coachingOptions.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Coaching</h3>
                          <div className="flex flex-wrap gap-2">
                            {coach.coachingOptions.map((option) => (
                              <Badge key={option} variant="outline" data-testid={`badge-coaching-${option}`}>
                                {option}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {coach.studentLevels && coach.studentLevels.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Student Levels</h3>
                          <div className="flex flex-wrap gap-2">
                            {coach.studentLevels.map((level) => (
                              <Badge key={level} variant="outline" data-testid={`badge-level-${level}`}>
                                {level}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {coach.certification && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Certification</h3>
                          <p className="text-sm" data-testid="text-coach-certification">{coach.certification}</p>
                        </div>
                      )}

                      {coach.bio && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Bio</h3>
                          <p className="text-sm" data-testid="text-coach-bio">{coach.bio}</p>
                        </div>
                      )}
                    </div>
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

          <TabsContent value="availability">
            <AvailabilityCalendar coachId={coach.id} isEditable={true} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
