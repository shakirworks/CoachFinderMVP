import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ChatWindow from "@/components/ChatWindow";
import { AvailabilityCalendar, type SelectedSlot } from "@/components/AvailabilityCalendar";
import { BookingSummaryCard } from "@/components/BookingSummaryCard";
import { MapPin, Mail, ArrowLeft, MessageCircle, DollarSign } from "lucide-react";
import type { Coach, Athlete } from "@shared/schema";
import coachImage from "@assets/stock_images/coach_mentor_trainer_f4712e56.jpg";
import SiteFooter from "@/components/SiteFooter";

export default function CoachProfile() {
  const [, params] = useRoute("/coach/:id");
  const [, setLocation] = useLocation();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);

  useEffect(() => {
    const athleteData = localStorage.getItem("currentAthlete");
    if (athleteData) {
      setAthlete(JSON.parse(athleteData));
    }
  }, []);

  const { data: coach, isLoading } = useQuery<Coach>({
    queryKey: ["/api/coaches", params?.id],
    enabled: !!params?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading coach profile...</p>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Coach not found</p>
          <Button onClick={() => setLocation("/coaches")} data-testid="button-back-to-coaches">
            Back to Coaches
          </Button>
        </div>
      </div>
    );
  }

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

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 space-y-0 pb-4">
            <CardTitle className="text-xl sm:text-2xl">Coach Profile</CardTitle>
            {athlete && (
              <Button
                onClick={() => setIsChatOpen(true)}
                data-testid="button-message-coach"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <Avatar className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
                <AvatarImage
                  src={coach.profileImage || coachImage}
                  alt={coach.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-2xl sm:text-4xl">
                  {coach.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 w-full text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold mb-3" data-testid="text-coach-name">
                  {coach.name}
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground">
                    <Mail className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate" data-testid="text-coach-email">{coach.email}</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground">
                    <MapPin className="w-5 h-5 flex-shrink-0" />
                    <span data-testid="text-coach-location">{coach.location}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Specialization</h3>
                    <Badge variant="secondary" className="text-base px-4 py-1" data-testid="badge-coach-sport">
                      {coach.sport}
                    </Badge>
                  </div>

                  {coach.hourlyRate && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Hourly Rate</h3>
                      <Badge variant="default" className="gap-1 text-base px-4 py-1" data-testid="badge-coach-rate">
                        <DollarSign className="w-4 h-4" />
                        {coach.hourlyRate}/hr
                      </Badge>
                    </div>
                  )}

                  {coach.yearsOfExperience && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Experience</h3>
                      <Badge variant="outline" className="text-base px-4 py-1" data-testid="badge-coach-experience">
                        {coach.yearsOfExperience} years
                      </Badge>
                    </div>
                  )}

                  {coach.coachingOptions && coach.coachingOptions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Coaching</h3>
                      <div className="flex flex-wrap gap-2">
                        {coach.coachingOptions.map((option) => (
                          <Badge key={option} variant="outline" className="text-base px-4 py-1" data-testid={`badge-coaching-${option}`}>
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
                          <Badge key={level} variant="outline" className="text-base px-4 py-1" data-testid={`badge-level-${level}`}>
                            {level}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {(coach.certification || coach.performanceLevel || coach.age || coach.gender || coach.bio) && (
              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-semibold">Additional Information</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {coach.certification && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Certification</h4>
                      <p className="text-base" data-testid="text-coach-certification">{coach.certification}</p>
                    </div>
                  )}
                  
                  {coach.performanceLevel && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Performance Level</h4>
                      <Badge variant="outline" data-testid="badge-coach-performance-level">
                        {coach.performanceLevel}
                      </Badge>
                    </div>
                  )}
                  
                  {coach.age && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Age</h4>
                      <p className="text-base" data-testid="text-coach-age">{coach.age}</p>
                    </div>
                  )}
                  
                  {coach.gender && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Gender</h4>
                      <p className="text-base" data-testid="text-coach-gender">{coach.gender}</p>
                    </div>
                  )}
                </div>

                {coach.bio && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">About</h4>
                    <p className="text-base leading-relaxed" data-testid="text-coach-bio">{coach.bio}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            {athlete ? "Book a Session" : "Availability"}
          </h2>
          {athlete && (
            <p className="text-sm text-muted-foreground mb-4" data-testid="text-booking-instructions">
              Select a date, then click on time slots to add them to your booking.
            </p>
          )}
          
          {/* Responsive layout: stack on mobile/tablet, side-by-side on xl screens */}
          <div className="flex flex-col xl:flex-row gap-4">
            {/* Calendar section - takes full width or flexible width */}
            <div className="w-full xl:flex-1 xl:max-w-md">
              <AvailabilityCalendar 
                coachId={coach.id} 
                isEditable={false}
                isSelectable={!!athlete}
                selectedSlots={selectedSlots}
                onSlotsChange={setSelectedSlots}
              />
            </div>
            
            {/* Booking summary - appears below on smaller screens, beside on xl */}
            {athlete && selectedSlots.length > 0 && (
              <div className="w-full xl:w-80 xl:flex-shrink-0">
                <BookingSummaryCard
                  coachId={coach.id}
                  coachName={coach.name}
                  hourlyRate={parseFloat(coach.hourlyRate || "50")}
                  selectedSlots={selectedSlots}
                  onRemoveSlot={(slotId) => setSelectedSlots(slots => slots.filter(s => s.slotId !== slotId))}
                  onClearAll={() => setSelectedSlots([])}
                  athleteId={athlete.id}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {athlete && (
        <ChatWindow
          open={isChatOpen}
          onOpenChange={setIsChatOpen}
          coach={coach}
          athlete={athlete}
        />
      )}

      <SiteFooter />
    </div>
  );
}
