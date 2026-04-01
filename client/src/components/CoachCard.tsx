import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, MessageCircle, User, DollarSign, Award, Navigation } from "lucide-react";
import type { Coach } from "@shared/schema";
import coachImage from "@assets/stock_images/coach_mentor_trainer_f4712e56.jpg";

interface CoachCardProps {
  coach: Coach;
  onMessage?: (coach: Coach) => void;
  onViewProfile?: (coach: Coach) => void;
}

export default function CoachCard({ coach, onMessage, onViewProfile }: CoachCardProps) {
  return (
    <Card className="p-6 hover-elevate transition-all" data-testid={`card-coach-${coach.id}`}>
      <div className="flex items-start gap-4 mb-4">
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
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" data-testid="badge-coach-sport">
              {coach.sport}
            </Badge>
            {coach.performanceLevel && (
              <Badge variant="outline" className="text-xs" data-testid="badge-coach-performance">
                {coach.performanceLevel}
              </Badge>
            )}
            {coach.hourlyRate && (
              <Badge variant="default" className="text-xs" data-testid="badge-coach-rate">
                <DollarSign className="w-3 h-3 mr-1" />
                {coach.hourlyRate}/hr
              </Badge>
            )}
          </div>
          {coach.certification && (
            <div className="flex items-center gap-1 mt-2" data-testid="badge-coach-certification">
              <Award className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-500 line-clamp-1">
                {coach.certification}
              </span>
            </div>
          )}
        </div>
      </div>

      {coach.trainingLocation && (
        <div className="flex items-center gap-1.5 mb-3 -mt-1" data-testid="text-coach-training-location">
          <Navigation className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground line-clamp-1">{coach.trainingLocation}</span>
        </div>
      )}

      {(coach.coachingOptions || coach.studentLevels) && (
        <div className="mb-4 space-y-2">
          {coach.coachingOptions && coach.coachingOptions.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground font-medium min-w-fit">Coaching:</span>
              <div className="flex flex-wrap gap-1">
                {coach.coachingOptions.map((option) => (
                  <Badge 
                    key={option} 
                    variant="outline" 
                    className="text-xs"
                    data-testid={`badge-coaching-option-${option.toLowerCase()}`}
                  >
                    {option}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {coach.studentLevels && coach.studentLevels.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground font-medium min-w-fit">Levels:</span>
              <div className="flex flex-wrap gap-1">
                {coach.studentLevels.map((level) => (
                  <Badge 
                    key={level} 
                    variant="outline" 
                    className="text-xs"
                    data-testid={`badge-student-level-${level.toLowerCase()}`}
                  >
                    {level}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="flex gap-2">
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={() => onMessage?.(coach)}
          data-testid={`button-message-${coach.id}`}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Message
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onViewProfile?.(coach)}
          data-testid={`button-view-profile-${coach.id}`}
        >
          <User className="w-4 h-4 mr-2" />
          View Profile
        </Button>
      </div>
    </Card>
  );
}
