import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface SportsChipProps {
  sport: string;
  selected: boolean;
  onToggle: (sport: string) => void;
}

export default function SportsChip({ sport, selected, onToggle }: SportsChipProps) {
  return (
    <Badge
      variant={selected ? "default" : "outline"}
      className="cursor-pointer px-4 py-2 text-sm font-medium hover-elevate active-elevate-2 flex items-center gap-2 transition-all"
      onClick={() => onToggle(sport)}
      data-testid={`chip-sport-${sport.toLowerCase().replace(/\s+/g, "-")}`}
    >
      {selected && <Check className="w-3 h-3" />}
      {sport}
    </Badge>
  );
}
