import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import type { Coach } from "@shared/schema";
import coachImage from "@assets/stock_images/coach_mentor_trainer_f4712e56.jpg";

interface CoachCardProps {
  coach: Coach;
}

export default function CoachCard({ coach }: CoachCardProps) {
  return (
    <Card className="p-6 hover-elevate transition-all" data-testid={`card-coach-${coach.id}`}>
      <div className="flex items-start gap-4">
        <Avatar className="w-16 h-16">
          <AvatarImage
            src={coach.profileImage || coachImage}
            alt={coach.name}
            className="object-cover"
          />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {coach.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg mb-1" data-testid="text-coach-name">
            {coach.name}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground" data-testid="text-coach-location">
              {coach.location}
            </span>
          </div>
          <Badge variant="secondary" data-testid="badge-coach-sport">
            {coach.sport}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
