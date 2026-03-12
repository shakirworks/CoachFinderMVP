import { Link } from "wouter";
import { Mail } from "lucide-react";
import logoImage from "@assets/CoachFinders_image-removebg-preview_1771126900909.png";

export default function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30 py-12">
      <div className="container px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <img src={logoImage} alt="CoachFinders" className="h-7 w-auto" data-testid="img-footer-logo" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The leading platform connecting athletes with expert coaches across all sports.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-muted-foreground" data-testid="link-footer-home">
                Home
              </Link>
              <Link href="/#about" className="text-sm text-muted-foreground" data-testid="link-footer-about">
                About Us
              </Link>
              <Link href="/signup" className="text-sm text-muted-foreground" data-testid="link-footer-signup">
                Get Started
              </Link>
            </nav>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Contact Us</h4>
            <a
              href="mailto:support@coachfinders.ca"
              className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap"
              data-testid="link-footer-email"
            >
              <Mail className="h-4 w-4" />
              support@coachfinders.ca
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground" data-testid="text-copyright">
            &copy; {new Date().getFullYear()} CoachFinders. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
