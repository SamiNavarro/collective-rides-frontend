/**
 * Ride Card Component - Phase 3.3.1
 * 
 * Displays ride summary in list views using canonical model:
 * - Always show: title, club, date/time, participants, status
 * - Show route stats only if present
 * - Clean fallback for missing route data
 */

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, MapPin, TrendingUp, ArrowRight } from 'lucide-react';
import { RideSummary, RideDifficulty } from '@/lib/types/rides';

interface RideCardProps {
  ride: RideSummary;
  clubName?: string;
}

// Helper: Format difficulty badge color
function getDifficultyColor(difficulty: RideDifficulty): string {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'intermediate':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'advanced':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'expert':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

// Helper: Format distance
function formatDistance(meters?: number): string {
  if (!meters) return '';
  const km = meters / 1000;
  return `${km.toFixed(1)}km`;
}

// Helper: Format capacity
function formatCapacity(current: number, max?: number): string {
  if (max) {
    return `${current}/${max}`;
  }
  return `${current} going`;
}

export function RideCard({ ride, clubName }: RideCardProps) {
  const startDate = new Date(ride.startDateTime);
  const hasRoute = !!ride.route;
  const hasRouteStats = hasRoute && ride.route && (ride.route.distance !== undefined);
  
  return (
    <Link href={`/clubs/${ride.clubId}/rides/${ride.rideId}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className="font-semibold text-lg mb-2 truncate">
                {ride.title}
              </h3>
              
              {/* Club Name (if provided) */}
              {clubName && (
                <p className="text-sm text-muted-foreground mb-3">
                  {clubName}
                </p>
              )}
              
              {/* Date/Time Row */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {startDate.toLocaleDateString('en-AU', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {startDate.toLocaleTimeString('en-AU', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
              
              {/* Meeting Point */}
              <div className="flex items-start gap-1 text-sm text-muted-foreground mb-3">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="truncate">{ride.meetingPoint.name}</span>
              </div>
              
              {/* Route Stats (only if present) */}
              {hasRouteStats && ride.route ? (
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                  {ride.route.distance && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>{formatDistance(ride.route.distance)}</span>
                    </div>
                  )}
                  {ride.route.difficulty && (
                    <Badge variant="outline" className={getDifficultyColor(ride.route.difficulty)}>
                      {ride.route.difficulty}
                    </Badge>
                  )}
                </div>
              ) : hasRoute ? (
                <p className="text-sm text-muted-foreground italic mb-3">
                  Route details TBD
                </p>
              ) : null}
              
              {/* Participants */}
              <div className="flex items-center gap-1 text-sm">
                <Users className="h-4 w-4" />
                <span>{formatCapacity(ride.currentParticipants, ride.maxParticipants)}</span>
                {ride.maxParticipants && ride.currentParticipants >= ride.maxParticipants && (
                  <Badge variant="outline" className="ml-2 bg-red-100 text-red-800 border-red-200">
                    Full
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Arrow Icon */}
            <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
