import { Card } from "@/components/ui/card";
import { Dumbbell, ClipboardList } from "lucide-react";

interface RoleSelectionCardProps {
  role: "athlete" | "coach";
  onSelect: (role: "athlete" | "coach") => void;
}

export default function RoleSelectionCard({ role, onSelect }: RoleSelectionCardProps) {
  const isAthlete = role === "athlete";
  
  return (
    <Card
      className="p-8 cursor-pointer hover-elevate active-elevate-2 transition-transform flex flex-col items-center gap-4 min-h-[200px] justify-center"
      onClick={() => onSelect(role)}
      data-testid={`card-role-${role}`}
    >
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        {isAthlete ? (
          <Dumbbell className="w-10 h-10 text-primary" />
        ) : (
          <ClipboardList className="w-10 h-10 text-primary" />
        )}
      </div>
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2 capitalize">{role}</h3>
        <p className="text-sm text-muted-foreground">
          {isAthlete
            ? "Find expert coaches to elevate your performance"
            : "Connect with motivated athletes and share your expertise"}
        </p>
      </div>
    </Card>
  );
}
