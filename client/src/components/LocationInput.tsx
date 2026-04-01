import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, LocateFixed, Loader2 } from "lucide-react";
import { geocodeCity, reverseGeocode, type Coords } from "@/lib/geocoding";
import { useToast } from "@/hooks/use-toast";

interface LocationInputProps {
  value: string;
  onChange: (value: string, coords: Coords | null) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  "data-testid"?: string;
  className?: string;
}

export default function LocationInput({
  value,
  onChange,
  placeholder = "City or region",
  required,
  id,
  "data-testid": testId,
  className,
}: LocationInputProps) {
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  const handleTextChange = (text: string) => {
    onChange(text, null);
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    if (text.trim().length < 3) return;
    geocodeTimer.current = setTimeout(async () => {
      setGeocoding(true);
      const coords = await geocodeCity(text.trim());
      setGeocoding(false);
      onChange(text, coords);
    }, 800);
  };

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location access. Please type your city manually.",
        variant: "destructive",
      });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords;
          const city = await reverseGeocode(lat, lng);
          setLocating(false);
          onChange(city, { lat, lng });
          toast({
            title: "Location detected",
            description: `Set to ${city}`,
          });
        } catch {
          setLocating(false);
          toast({
            title: "Could not detect city",
            description: "Location found but city name lookup failed. Please type your city manually.",
            variant: "destructive",
          });
        }
      },
      (err) => {
        setLocating(false);
        let description = "Please type your city manually.";
        if (err.code === 1) {
          description = "Location permission was denied. Please allow location access in your browser settings, or type your city manually.";
        } else if (err.code === 2) {
          description = "Your location could not be determined. Please type your city manually.";
        } else if (err.code === 3) {
          description = "Location request timed out. Please type your city manually.";
        }
        toast({
          title: "Location access failed",
          description,
          variant: "destructive",
        });
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  const isPending = locating || geocoding;

  return (
    <div className={`relative flex items-center gap-2 ${className ?? ""}`}>
      <div className="relative flex-1">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        {isPending && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
        <Input
          id={id}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleTextChange(e.target.value)}
          className="pl-10 h-12 pr-9"
          required={required}
          data-testid={testId}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleNearMe}
        disabled={locating}
        title="Use my current location"
        data-testid="button-use-my-location"
        className="h-12 w-12 flex-shrink-0"
      >
        {locating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <LocateFixed className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
