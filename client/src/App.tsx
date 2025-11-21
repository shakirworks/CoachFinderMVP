import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PageTransition from "@/components/PageTransition";
import Landing from "@/pages/Landing";
import CoachesList from "@/pages/CoachesList";
import AthleteProfile from "@/pages/AthleteProfile";
import CoachProfile from "@/pages/CoachProfile";
import CoachOwnProfile from "@/pages/CoachOwnProfile";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  
  return (
    <PageTransition>
      <Switch location={location}>
        <Route path="/" component={Landing} />
        <Route path="/coaches" component={CoachesList} />
        <Route path="/profile" component={AthleteProfile} />
        <Route path="/coach-profile" component={CoachOwnProfile} />
        <Route path="/coach/:id" component={CoachProfile} />
        <Route component={NotFound} />
      </Switch>
    </PageTransition>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
