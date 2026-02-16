import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import ChatWindow from "@/components/ChatWindow";
import MessageNotificationListener from "@/components/MessageNotificationListener";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Mail, LogOut, MessageCircle, DollarSign, Edit, User, ChevronDown, Trash2, CreditCard, CheckCircle, AlertCircle, Loader2, ExternalLink, FileText, Download, Bell, Calendar } from "lucide-react";
import type { Coach, Athlete, Message, Invoice, Notification } from "@shared/schema";
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
    } else if (tabParam === 'payments') {
      setActiveTab('payments');
    } else {
      setActiveTab('availability');
    }
  }, []);

  const { authenticated, user: authUser, role: authRole, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (authenticated && authRole === "coach" && authUser) {
      const coachUser = authUser as Coach;
      setCoach(coachUser);
      setEditedName(coachUser.name || "");
      setEditedLocation(coachUser.location || "");
      setEditedSport(coachUser.sport || "");
      setEditedBio(coachUser.bio || "");
      setEditedHourlyRate(coachUser.hourlyRate?.toString() || "");
    } else {
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
    }
  }, [authLoading, authenticated, authUser, authRole, setLocation]);

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

  const stripeOnboardingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/coaches/${coach!.id}/stripe/connect`, {});
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
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
      await apiRequest("DELETE", `/api/coaches/${coach!.id}`);
    },
    onSuccess: () => {
      localStorage.removeItem("currentCoach");
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

  // Fetch coach's invoices (bookings they received)
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/coaches', coach?.id, 'invoices'],
    queryFn: async () => {
      if (!coach?.id) return [];
      const res = await fetch(`/api/coaches/${coach.id}/invoices`);
      return res.json();
    },
    enabled: !!coach?.id,
  });

  // Fetch coach's notifications
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ['/api/coaches', coach?.id, 'notifications'],
    queryFn: async () => {
      if (!coach?.id) return [];
      const res = await fetch(`/api/coaches/${coach.id}/notifications`);
      return res.json();
    },
    enabled: !!coach?.id,
    refetchInterval: 10000,
  });

  // Fetch coach's message threads
  const { data: messageThreads = [], isLoading: messagesLoading } = useQuery<Array<{ athlete: Athlete; lastMessage: Message; unreadCount: number }>>({
    queryKey: ['/api/coaches', coach?.id, 'messages'],
    queryFn: async () => {
      if (!coach?.id) return [];
      const res = await fetch(`/api/coaches/${coach.id}/messages`);
      return res.json();
    },
    enabled: !!coach?.id,
    refetchInterval: 10000,
  });

  const unreadMessageCount = messageThreads.reduce((sum, t) => sum + t.unreadCount, 0);

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
    "Pickleball",
    "Skiing",
    "Baseball",
    "Personal Training",
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

      {coach && <MessageNotificationListener recipientId={coach.id} recipientType="coach" />}

      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="availability" data-testid="tab-availability">Availability</TabsTrigger>
            <TabsTrigger value="messages" data-testid="tab-messages" className="relative">
              Messages
              {unreadMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1" data-testid="badge-unread-messages">
                  {unreadMessageCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">Payments</TabsTrigger>
            <TabsTrigger value="edit" data-testid="tab-edit">Edit</TabsTrigger>
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
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : messageThreads.length > 0 ? (
                  <div className="space-y-2">
                    {messageThreads.map((thread) => (
                      <div
                        key={thread.athlete.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer"
                        onClick={() => {
                          setSelectedAthlete(thread.athlete);
                          setIsChatOpen(true);
                        }}
                        data-testid={`message-thread-${thread.athlete.id}`}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage
                            src={thread.athlete.profileImage || athleteImage}
                            alt={thread.athlete.name}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {thread.athlete.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium truncate">{thread.athlete.name}</p>
                            <p className="text-xs text-muted-foreground flex-shrink-0">
                              {formatDistanceToNow(new Date(thread.lastMessage.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {thread.lastMessage.senderType === "coach" ? "You: " : ""}{thread.lastMessage.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No messages yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Athletes will be able to message you about coaching opportunities
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedAthlete && coach && (
              <ChatWindow
                open={isChatOpen}
                onOpenChange={setIsChatOpen}
                coach={coach}
                athlete={selectedAthlete}
                senderType="coach"
              />
            )}
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                  <CreditCard className="h-6 w-6" />
                  Payment Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Stripe Connect</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect your Stripe account to receive payments directly from athletes. 
                    A 7% platform service fee applies to each booking.
                  </p>
                  
                  {coach.stripeOnboardingComplete === "true" ? (
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-300" data-testid="text-stripe-connected">Account Connected</p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Your Stripe account is set up and ready to receive payments directly.
                        </p>
                      </div>
                    </div>
                  ) : coach.stripeAccountId ? (
                    <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-yellow-700 dark:text-yellow-300">Onboarding Incomplete</p>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                          Please complete your Stripe account setup to receive payments.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => stripeOnboardingMutation.mutate()}
                        disabled={stripeOnboardingMutation.isPending}
                        data-testid="button-continue-onboarding"
                      >
                        {stripeOnboardingMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4 mr-2" />
                        )}
                        Continue Setup
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">Not Connected</p>
                        <p className="text-sm text-muted-foreground">
                          Set up your Stripe account to start accepting payments for coaching sessions.
                        </p>
                      </div>
                      <Button
                        onClick={() => stripeOnboardingMutation.mutate()}
                        disabled={stripeOnboardingMutation.isPending}
                        data-testid="button-connect-stripe"
                      >
                        {stripeOnboardingMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CreditCard className="h-4 w-4 mr-2" />
                        )}
                        {stripeOnboardingMutation.isPending ? "Connecting..." : "Connect with Stripe"}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t space-y-4">
                  <h3 className="font-medium">Payment Information</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Hourly Rate</p>
                      <p className="text-xl font-semibold" data-testid="text-hourly-rate">CA${coach.hourlyRate || 0}/hr</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Platform Fee</p>
                      <p className="text-xl font-semibold">7%</p>
                      <p className="text-xs text-muted-foreground">CoachFinders service fee</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">You Receive</p>
                      <p className="text-xl font-semibold" data-testid="text-coach-earnings">CA${((Number(coach.hourlyRate) || 0) * 0.93).toFixed(2)}/hr</p>
                      <p className="text-xs text-muted-foreground">After 7% service fee</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications Section */}
            {notifications.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                    <Bell className="h-6 w-6" />
                    Recent Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-4 rounded-lg border ${notification.read === 'false' ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-muted'}`}
                        data-testid={`notification-${notification.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`h-2 w-2 rounded-full mt-2 ${notification.read === 'false' ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                          <div className="flex-1">
                            <p className="font-medium">{notification.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bookings History Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  Booking History
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
                      When athletes book sessions with you, they'll appear here
                    </p>
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
                      
                      return (
                        <div 
                          key={invoice.id}
                          className="p-4 rounded-lg border bg-card"
                          data-testid={`invoice-${invoice.id}`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {invoice.invoiceNumber}
                                </Badge>
                                <Badge className="text-xs bg-green-600">Paid</Badge>
                              </div>
                              <p className="font-medium">{invoice.athleteName}</p>
                              <p className="text-sm text-muted-foreground">{invoice.athleteEmail}</p>
                              <div className="mt-2 text-sm">
                                <span className="text-muted-foreground">{sessionDetails.length} session{sessionDetails.length > 1 ? 's' : ''}</span>
                                {sessionDetails.length > 0 && (
                                  <span className="text-muted-foreground ml-2">
                                    ({sessionDetails.map(s => s.date).join(', ')})
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">You receive</p>
                                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                                  ${(invoice.subtotal / 100).toFixed(2)}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/api/invoices/${invoice.id}/receipt`, '_blank')}
                                data-testid={`button-view-receipt-${invoice.id}`}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Receipt
                              </Button>
                            </div>
                          </div>
                          {invoice.issuedAt && (
                            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                              Booked {formatDistanceToNow(new Date(invoice.issuedAt), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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

                <div className="flex flex-wrap gap-2 pt-4">
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
                          and remove all your data including your availability slots and messages.
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
