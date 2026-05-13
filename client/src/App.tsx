import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import PageTransition from "@/components/PageTransition";
import Home from "@/pages/Home";
import Landing from "@/pages/Landing";
import CoachesList from "@/pages/CoachesList";
import AthleteProfile from "@/pages/AthleteProfile";
import CoachProfile from "@/pages/CoachProfile";
import CoachOwnProfile from "@/pages/CoachOwnProfile";
import BookingSuccess from "@/pages/BookingSuccess";
import VerifyEmail from "@/pages/VerifyEmail";
import ProfileSetup from "@/pages/ProfileSetup";
import ResetPassword from "@/pages/ResetPassword";
import MobileVerify from "@/pages/MobileVerify";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  
  return (
    <PageTransition>
      <Switch location={location}>
        <Route path="/" component={Home} />
        <Route path="/signup" component={Landing} />
        <Route path="/coaches" component={CoachesList} />
        <Route path="/profile" component={AthleteProfile} />
        <Route path="/coach-profile" component={CoachOwnProfile} />
        <Route path="/coach/:id" component={CoachProfile} />
        <Route path="/booking/success" component={BookingSuccess} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/mobile-verify" component={MobileVerify} />
        <Route path="/profile-setup" component={ProfileSetup} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route component={NotFound} />
      </Switch>
    </PageTransition>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
