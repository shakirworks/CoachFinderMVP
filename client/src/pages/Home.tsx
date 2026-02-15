import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MessageSquare, TrendingUp, Users, Award, Mail, Heart, Shield, Globe, Crosshair } from "lucide-react";
import heroImage from "@assets/photo-1634840542403-1a9b1067aaa0_1771127392745.avif";
import coachingImage from "@assets/stock_images/athletic_training_se_3c4360fd.jpg";
import athleteImage from "@assets/stock_images/sports_fitness_coach_7b57567b.jpg";
import logoImage from "@assets/CoachFinders_image-removebg-preview_1771126900909.png";
import SiteFooter from "@/components/SiteFooter";

export default function Home() {
  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <img src={logoImage} alt="CoachFinders" className="h-8 w-auto" data-testid="img-header-logo" />
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Button variant="ghost" onClick={() => scrollToSection("about")} data-testid="button-about-nav">
              About Us
            </Button>
            <Button variant="ghost" onClick={() => scrollToSection("feedback")} data-testid="button-feedback-nav">
              Feedback
            </Button>
            <Link href="/signup?mode=signin">
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
          <div className="flex justify-center mb-4">
            <img src={logoImage} alt="CoachFinders" className="h-14 md:h-20 w-auto drop-shadow-lg" data-testid="img-hero-logo" />
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-6 leading-tight" data-testid="text-hero-title">
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
              onClick={() => scrollToSection("features")}
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
                    <Crosshair className="h-4 w-4 text-primary" />
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

      <section id="about" className="py-20 md:py-24">
        <div className="container px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4" data-testid="heading-about">
              About Us
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We believe every athlete deserves access to world-class coaching
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            <p className="text-lg text-muted-foreground leading-relaxed text-center" data-testid="text-about-intro">
              CoachFinders was built with a simple mission: to break down the barriers between athletes and the coaches
              who can help them reach their full potential. Whether you're picking up a sport for the first time or training
              for elite competition, the right coach makes all the difference.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <Card className="border-none shadow-sm">
                <CardContent className="p-8 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6 mx-auto">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-3">Our Mission</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    To make quality sports coaching accessible to everyone, everywhere. We connect passionate athletes
                    with experienced coaches who share their dedication.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardContent className="p-8 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6 mx-auto">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-3">Trust & Safety</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Every coach on our platform is verified. We prioritize a safe, professional environment
                    with secure payments and transparent profiles.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardContent className="p-8 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6 mx-auto">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-3">Growing Community</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We're building a thriving community of athletes and coaches across multiple sports,
                    from tennis and soccer to swimming and track.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section id="feedback" className="py-20 md:py-24 bg-muted/30">
        <div className="container px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4" data-testid="heading-feedback">
              Send Us Feedback
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              We're always looking to improve. Your feedback helps us build a better platform for athletes and coaches alike.
            </p>

            <Card className="shadow-sm">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-4">
                    Have a suggestion, question, or just want to say hello? We'd love to hear from you.
                    Reach out to our support team and we'll get back to you as soon as possible.
                  </p>
                  <a
                    href="mailto:support@coachfinders.ca"
                    data-testid="link-feedback-email"
                  >
                    <Button size="lg" className="rounded-full">
                      <Mail className="h-4 w-4 mr-2" />
                      support@coachfinders.ca
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
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

      <SiteFooter />
    </div>
  );
}
