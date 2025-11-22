import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Calendar, MessageSquare, TrendingUp, Users, Award } from "lucide-react";
import heroImage from "@assets/stock_images/professional_sports__e977efaa.jpg";
import coachingImage from "@assets/stock_images/athletic_training_se_3c4360fd.jpg";
import athleteImage from "@assets/stock_images/sports_fitness_coach_7b57567b.jpg";

export default function Home() {
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById("features");
    featuresSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">CoachFinders</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/signup">
              <Button variant="ghost" data-testid="button-signin">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button data-testid="button-getstarted-header">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Professional sports coaching" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        </div>
        
        <div className="relative z-10 container text-center text-white px-6">
          <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-6 leading-tight">
            Find Your Perfect
            <br />
            <span className="font-medium">Sports Coach</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Connect with certified professionals, book personalized training sessions,
            and elevate your athletic performance to the next level.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button 
                size="lg" 
                className="rounded-full backdrop-blur-sm bg-white text-black border-white"
                data-testid="button-getstarted-hero"
              >
                Get Started
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="rounded-full backdrop-blur-sm bg-white/10 border-white/30 text-white"
              onClick={scrollToFeatures}
              data-testid="button-learnmore"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 md:py-24 bg-muted/30">
        <div className="container px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4">
              Why Choose CoachFinders
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The premier platform connecting athletes with expert coaches
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-none shadow-sm hover-elevate">
              <CardContent className="p-8">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-3">Certified Coaches</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Browse profiles of experienced sports professionals with verified credentials and proven track records.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm hover-elevate">
              <CardContent className="p-8">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-3">Easy Scheduling</h3>
                <p className="text-muted-foreground leading-relaxed">
                  View real-time availability and book sessions instantly with our intuitive calendar system.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm hover-elevate">
              <CardContent className="p-8">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-3">Direct Messaging</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Communicate directly with coaches to discuss goals, techniques, and training plans.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="container px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <img 
                src={coachingImage} 
                alt="Sports coaching session" 
                className="w-full h-[400px] object-cover rounded-lg shadow-lg"
              />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-6">
                For Athletes
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Whether you're a beginner looking to learn the fundamentals or an experienced athlete 
                aiming to refine your technique, find the perfect coach to match your goals.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Track Your Progress</h4>
                    <p className="text-sm text-muted-foreground">Monitor your improvement with detailed session notes and feedback.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Personalized Training</h4>
                    <p className="text-sm text-muted-foreground">Get customized coaching plans tailored to your skill level and objectives.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24 bg-muted/30">
        <div className="container px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="order-2 md:order-1">
              <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-6">
                For Coaches
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Expand your coaching business, manage your schedule efficiently, and connect 
                with motivated athletes ready to improve their game.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Manage Availability</h4>
                    <p className="text-sm text-muted-foreground">Set your schedule with flexible time slots and automated booking.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Award className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Showcase Expertise</h4>
                    <p className="text-sm text-muted-foreground">Build your professional profile and attract the right athletes.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <img 
                src={athleteImage} 
                alt="Athletic training" 
                className="w-full h-[400px] object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32 bg-primary text-primary-foreground">
        <div className="container px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-light tracking-tight mb-6">
            Ready to Elevate Your Performance?
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of athletes and coaches already using CoachFinders
          </p>
          <Link href="/signup">
            <Button 
              size="lg" 
              variant="secondary"
              className="rounded-full"
              data-testid="button-getstarted-footer"
            >
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t py-12">
        <div className="container px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="font-semibold">CoachFinders</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 CoachFinders. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
