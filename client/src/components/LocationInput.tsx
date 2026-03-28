import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, LocateFixed, Loader2 } from "lucide-react";
import { geocodeCity, reverseGeocode, type Coords } from "@/lib/geocoding";

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
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const city = await reverseGeocode(lat, lng);
        setLocating(false);
        onChange(city, { lat, lng });
      },
      () => {
        setLocating(false);
      },
      { timeout: 8000 }
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
