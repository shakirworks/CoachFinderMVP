import { useEffect, useState } from "react";
import { useSearch, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Globe, Loader2 } from "lucide-react";

export default function MobileVerify() {
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(searchString);
  const token = params.get("token");

  const [countdown, setCountdown] = useState(3);
  const [attempted, setAttempted] = useState(false);

  const encodedToken = token ? encodeURIComponent(token) : null;
  const deepLink = encodedToken ? `coachfinders://(auth)/verify-email?token=${encodedToken}` : null;
  const deepLinkFlat = encodedToken ? `coachfinders://verify-email?token=${encodedToken}` : null;
  const webLink = token ? `/verify-email?token=${token}` : "/verify-email";

  useEffect(() => {
    if (!token || attempted) return;

    if (deepLink) {
      window.location.href = deepLink;
      setAttempted(true);
    }
  }, [token, deepLink, attempted]);

  useEffect(() => {
    if (!token) return;

    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [token]);

  const openInApp = () => {
    if (deepLink) {
      window.location.href = deepLink;
      setTimeout(() => {
        if (deepLinkFlat) window.location.href = deepLinkFlat;
      }, 1500);
    }
  };

  const continueInBrowser = () => {
    setLocation(webLink);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <p className="text-muted-foreground">No verification token found. Please check your email for the correct link.</p>
            <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-go-home">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="space-y-2">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Smartphone className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold" data-testid="text-mobile-verify-heading">
              Open in App
            </h2>
            <p className="text-muted-foreground">
              Opening the CoachFinders app to verify your email...
            </p>
          </div>

          {countdown > 0 ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span data-testid="text-countdown">Redirecting in {countdown}s</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground" data-testid="text-redirect-done">
              If the app did not open, use one of the options below.
            </p>
          )}

          <div className="flex flex-col gap-3">
            <Button
              onClick={openInApp}
              className="w-full"
              data-testid="button-open-in-app"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Open in CoachFinders App
            </Button>
            <Button
              variant="outline"
              onClick={continueInBrowser}
              className="w-full"
              data-testid="button-continue-browser"
            >
              <Globe className="w-4 h-4 mr-2" />
              Continue in Browser
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Don't have the app?{" "}
            <button
              className="underline hover:text-foreground transition-colors"
              onClick={continueInBrowser}
              data-testid="link-verify-browser"
            >
              Verify in browser instead
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
