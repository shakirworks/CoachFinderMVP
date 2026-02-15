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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatWindow from "@/components/ChatWindow";
import MessageNotificationListener from "@/components/MessageNotificationListener";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Mail, ArrowLeft, LogOut, Edit, MessageCircle, Trash2, Calendar, Clock, Download, CreditCard, Loader2 } from "lucide-react";
import type { Athlete, Coach, Message, Invoice } from "@shared/schema";
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
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'messages') {
      setActiveTab('messages');
    } else if (tabParam === 'bookings') {
      setActiveTab('bookings');
    } else {
      setActiveTab('profile');
    }
  }, [location]);

  const { data: messageThreads } = useQuery<Array<{ coach: Coach; lastMessage: Message; unreadCount: number }>>({
    queryKey: [`/api/athletes/${athlete?.id}/messages`],
    enabled: !!athlete?.id,
  });

  // Fetch athlete's booked sessions (invoices)
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/athletes', athlete?.id, 'invoices'],
    queryFn: async () => {
      if (!athlete?.id) return [];
      const res = await fetch(`/api/athletes/${athlete.id}/invoices`);
      return res.json();
    },
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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/athletes/${athlete!.id}`);
    },
    onSuccess: () => {
      localStorage.removeItem("currentAthlete");
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      setLocation("/");
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

  const sports = ["Soccer", "Tennis", "Golf", "Pickleball", "Skiing", "Baseball", "Personal Training"];

  return (
    <div className="min-h-screen bg-background">
      <MessageNotificationListener recipientId={athlete.id} recipientType="athlete" />
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
            <TabsTrigger value="bookings" data-testid="tab-bookings">Bookings</TabsTrigger>
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

                    <div className="pt-8 border-t mt-8">
                      <h3 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            data-testid="button-delete-account"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Account
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your account
                              and remove all your data including your messages.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate()}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              data-testid="button-confirm-delete"
                            >
                              {deleteMutation.isPending ? "Deleting..." : "Yes, delete my account"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  My Booked Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Loading bookings...</p>
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No bookings yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Book sessions with coaches to see them here
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => setLocation("/coaches")}
                      data-testid="button-browse-coaches-booking"
                    >
                      Browse Coaches
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((invoice) => {
                      const sessionDetails = invoice.sessionDetails as Array<{
                        slotId: string;
                        date: string;
                        startTime: string;
                        endTime: string;
                      }>;

                      const formatTime = (time: string) => {
                        const [hours, minutes] = time.split(":");
                        let h = parseInt(hours);
                        const period = h >= 12 ? "PM" : "AM";
                        if (h > 12) h -= 12;
                        if (h === 0) h = 12;
                        return `${h}:${minutes} ${period}`;
                      };

                      return (
                        <div 
                          key={invoice.id}
                          className="p-4 rounded-lg border bg-card"
                          data-testid={`booking-${invoice.id}`}
                        >
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    {invoice.invoiceNumber}
                                  </Badge>
                                  <Badge className="text-xs bg-green-600">Paid</Badge>
                                </div>
                                <p className="font-semibold text-lg">{invoice.coachName}</p>
                                <p className="text-sm text-muted-foreground">{invoice.coachEmail}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">Total Paid</p>
                                  <p className="text-lg font-semibold">
                                    ${(invoice.totalAmount / 100).toFixed(2)}
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`/api/invoices/${invoice.id}/receipt`, '_blank')}
                                  data-testid={`button-receipt-${invoice.id}`}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Receipt
                                </Button>
                              </div>
                            </div>

                            <div className="pt-3 border-t">
                              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {sessionDetails.length} Session{sessionDetails.length > 1 ? 's' : ''} Booked
                              </p>
                              <div className="grid gap-2">
                                {sessionDetails.map((session, idx) => (
                                  <div 
                                    key={idx}
                                    className="flex items-center gap-3 p-2 bg-muted/50 rounded text-sm"
                                  >
                                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="font-medium">{session.date}</span>
                                    <span className="text-muted-foreground">
                                      {formatTime(session.startTime)} - {formatTime(session.endTime)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {invoice.issuedAt && (
                              <p className="text-xs text-muted-foreground">
                                Booked {formatDistanceToNow(new Date(invoice.issuedAt), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                  <CreditCard className="h-6 w-6 opacity-50" />
                  Payment Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-muted-foreground">Stripe Connect</p>
                      <p className="text-sm text-muted-foreground">
                        Payment processing is only available for coaches
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-3 opacity-50 cursor-not-allowed"
                    disabled
                    data-testid="button-stripe-disabled"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Connect with Stripe
                  </Button>
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
