import { Link } from "wouter";
import badgeImage from "@assets/Gemini_Generated_Image_weahysweahysweah_1771129690200.png";
import logoImage from "@assets/CoachFinders_image-removebg-preview_1771126900909.png";

interface SiteNavProps {
  children?: React.ReactNode;
}

export default function SiteNav({ children }: SiteNavProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4 px-4">
        <Link href="/">
          <button
            className="flex items-center gap-2 rounded-md px-1 py-1 hover-elevate"
            data-testid="link-home-logo"
            aria-label="Go to CoachFinders home"
          >
            <img
              src={badgeImage}
              alt=""
              className="h-9 w-9 rounded-full object-cover"
            />
            <img
              src={logoImage}
              alt="CoachFinders"
              className="h-7 w-auto hidden sm:block"
            />
          </button>
        </Link>

        {children && (
          <div className="flex items-center gap-2">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
