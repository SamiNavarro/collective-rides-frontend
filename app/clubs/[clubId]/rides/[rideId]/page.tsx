/**
 * Ride Detail Page - Phase 3.3.2
 * 
 * Displays full ride information with join/leave functionality.
 * Route: /clubs/[clubId]/rides/[rideId]
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Calendar, MapPin, Users, ArrowLeft, ExternalLink, Edit, XCircle } from 'lucide-react';
import { useRide, useJoinRide, useLeaveRide, usePublishRide, useCancelRide } from '@/hooks/use-rides';
import { useAuth } from '@/contexts/auth-context';
import { useMyClubs } from '@/hooks/use-clubs';
import { RideStatus, RideDifficulty, RideType } from '@/lib/types/rides';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// Helper function to convert URLs in text to clickable links
function linkifyText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-1"
        >
          {part}
          <ExternalLink className="h-3 w-3 inline" />
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export default function RideDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  const clubId = params.clubId as string;
  const rideId = params.rideId as string;

  const { data: ride, isLoading, error, refetch } = useRide(clubId, rideId);
  const { data: myClubs } = useMyClubs();
  const joinRide = useJoinRide();
  const leaveRide = useLeaveRide();
  const publishRide = usePublishRide();
  const cancelRide = useCancelRide();

  // Refetch ride data when user authentication state changes
  useEffect(() => {
    if (user !== undefined) {
      refetch();
    }
  }, [user, refetch]);

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  // Format duration (expects minutes)
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    }
    return `${mins}m`;
  };

  // Format distance
  const formatDistance = (meters?: number) => {
    if (!meters) return null;
    const km = meters / 1000;
    return `${km.toFixed(1)} km`;
  };

  // Get status badge color
  const getStatusColor = (status: RideStatus) => {
    switch (status) {
      case RideStatus.PUBLISHED:
        return 'bg-green-100 text-green-800 border-green-200';
      case RideStatus.DRAFT:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case RideStatus.COMPLETED:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case RideStatus.CANCELLED:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get difficulty badge color
  const getDifficultyColor = (difficulty: RideDifficulty) => {
    switch (difficulty) {
      case RideDifficulty.BEGINNER:
        return 'bg-green-100 text-green-800';
      case RideDifficulty.INTERMEDIATE:
        return 'bg-yellow-100 text-yellow-800';
      case RideDifficulty.ADVANCED:
        return 'bg-orange-100 text-orange-800';
      case RideDifficulty.EXPERT:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get ride type label
  const getRideTypeLabel = (type: RideType) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading ride details...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !ride) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-20">
              <h2 className="text-2xl font-semibold mb-4">Ride Not Found</h2>
              <p className="text-muted-foreground mb-6">
                {error instanceof Error ? error.message : 'This ride could not be found.'}
              </p>
              <Button onClick={() => router.push('/rides')}>
                Back to Rides
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { date, time } = formatDateTime(ride.startDateTime);
  const hasCapacity = !ride.maxParticipants || ride.currentParticipants < ride.maxParticipants;
  const isPublished = ride.status === RideStatus.PUBLISHED;
  const isDraft = ride.status === RideStatus.DRAFT;
  const hasJoined = !!ride.viewerParticipation;

  // Check if user can publish (leadership roles)
  // Note: This is a simplified check. In production, you'd want to verify against club membership
  const canPublish = user && isDraft;

  // Find user's membership in this club (Phase 3.3.4)
  const membership = myClubs?.find(c => c.clubId === clubId);

  // Check if user can edit this ride (Phase 3.3.4)
  const canEdit = user && ride && membership && 
    new Date(ride.startDateTime) > new Date() &&
    ![RideStatus.COMPLETED, RideStatus.CANCELLED, RideStatus.ACTIVE].includes(ride.status) &&
    (ride.createdBy === user.id || 
     ['owner', 'admin', 'ride_captain', 'ride_leader'].includes(membership.membershipRole));

  // Check if user can cancel this ride (Phase 3.3.4)
  const canCancel = user && ride && membership &&
    [RideStatus.DRAFT, RideStatus.PUBLISHED].includes(ride.status) &&
    (ride.createdBy === user.id || 
     ['owner', 'admin', 'ride_captain', 'ride_leader'].includes(membership.membershipRole));

  // Handle join ride
  const handleJoinRide = () => {
    joinRide.mutate({ clubId, rideId });
  };

  // Handle leave ride
  const handleLeaveRide = () => {
    leaveRide.mutate({
      clubId,
      rideId,
    });
    setShowLeaveDialog(false);
  };

  // Handle publish ride
  const handlePublishRide = () => {
    publishRide.mutate({ clubId, rideId });
    setShowPublishDialog(false);
  };

  // Handle cancel ride (Phase 3.3.4)
  const handleCancelRide = async () => {
    try {
      await cancelRide.mutateAsync({
        clubId,
        rideId,
        reason: cancelReason || undefined,
      });
      setShowCancelDialog(false);
      setCancelReason(''); // Reset reason
    } catch (error) {
      console.error('Failed to cancel ride:', error);
    }
  };
  // Render CTA based on user state and ride status
  const renderCTA = () => {
    // Cancelled ride - no actions available (Phase 3.3.4)
    if (ride.status === RideStatus.CANCELLED) {
      return null;
    }

    // Draft ride - show publish button for authorized users
    if (isDraft && canPublish) {
      return (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4">
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                Draft
              </Badge>
              <p className="text-muted-foreground text-center">
                This ride is not yet visible to club members
              </p>
              <Button
                size="lg"
                onClick={() => setShowPublishDialog(true)}
                disabled={publishRide.isPending}
                className="min-w-[200px]"
              >
                {publishRide.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  'Publish Ride'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Not logged in
    if (!user) {
      return (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Sign in to join this ride
            </p>
            <Button 
              size="lg"
              onClick={() => router.push(`/auth/login?redirect=/clubs/${clubId}/rides/${rideId}`)}
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      );
    }

    // Ride not published
    if (!isPublished) {
      return (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              This ride is not yet published
            </p>
          </CardContent>
        </Card>
      );
    }

    // Already joined - show leave button
    if (hasJoined) {
      return (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-green-700">
                <Users className="h-5 w-5" />
                <p className="font-medium">You're participating in this ride</p>
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowLeaveDialog(true)}
                disabled={leaveRide.isPending}
                className="min-w-[200px]"
              >
                {leaveRide.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Leaving...
                  </>
                ) : (
                  'Leave Ride'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Ride full
    if (!hasCapacity) {
      return (
        <Card>
          <CardContent className="py-8 text-center">
            <Badge variant="secondary" className="mb-4 bg-orange-100 text-orange-800 border-orange-200">
              Ride Full
            </Badge>
            <p className="text-muted-foreground">
              This ride has reached maximum capacity
            </p>
          </CardContent>
        </Card>
      );
    }

    // Can join
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Button
            onClick={handleJoinRide}
            disabled={joinRide.isPending}
            size="lg"
            className="min-w-[200px]"
          >
            {joinRide.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Ride'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Back button */}
          <Button
            variant="ghost"
            className="mb-2"
            onClick={() => router.push('/rides')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Rides
          </Button>

          {/* Ride Header Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-3xl mb-3">{ride.title}</CardTitle>
                  <Link 
                    href={`/clubs/${clubId}`}
                    className="text-primary hover:underline flex items-center gap-1 text-sm"
                  >
                    {ride.clubId}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className={getStatusColor(ride.status)}>
                    {ride.status}
                  </Badge>
                  {!hasCapacity && ride.status !== RideStatus.CANCELLED && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                      Ride Full
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className={getDifficultyColor(ride.difficulty)}>
                  {ride.difficulty}
                </Badge>
                <Badge variant="outline">
                  {getRideTypeLabel(ride.rideType)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Cancelled Ride Alert (Phase 3.3.4) */}
          {ride.status === RideStatus.CANCELLED && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Ride Cancelled
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ride.cancellationReason && (
                  <p className="text-muted-foreground mb-2">{ride.cancellationReason}</p>
                )}
                {ride.cancelledBy && ride.cancelledAt && (
                  <p className="text-sm text-muted-foreground">
                    Cancelled on {new Date(ride.cancelledAt).toLocaleDateString('en-AU', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Edit/Cancel Actions (Phase 3.3.4) */}
          {ride.status !== RideStatus.CANCELLED && (canEdit || canCancel) && (
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-wrap gap-3 justify-end">
                  {canEdit && (
                    <Link href={`/clubs/${clubId}/rides/${rideId}/edit`}>
                      <Button variant="outline" size="lg">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Ride
                      </Button>
                    </Link>
                  )}
                  {canCancel && (
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => setShowCancelDialog(true)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Ride
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date & Time */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Date & Time</p>
                    <p className="font-semibold">{date}</p>
                    <p className="text-sm text-muted-foreground">{time}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Duration: {formatDuration(ride.estimatedDuration)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Participants */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Participants</p>
                    <p className="font-semibold text-lg">
                      {ride.currentParticipants}
                      {ride.maxParticipants && ` / ${ride.maxParticipants}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ride.maxParticipants ? 'riders' : 'going'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meeting Point */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Meeting Point</p>
                    <p className="font-semibold text-sm">{ride.meetingPoint.name}</p>
                    {ride.meetingPoint.coordinates && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${ride.meetingPoint.coordinates.latitude},${ride.meetingPoint.coordinates.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-xs inline-flex items-center gap-1 mt-1"
                      >
                        Open in Maps
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Meeting Point Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Location Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-2">{ride.meetingPoint.address}</p>
              {ride.meetingPoint.instructions && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium mb-1">Instructions</p>
                  <p className="text-sm text-muted-foreground">
                    {ride.meetingPoint.instructions}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Route Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Route (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              {ride.route && (ride.route.name || ride.route.distance || ride.route.difficulty || ride.route.notes) ? (
                <>
                  {ride.route.name && <p className="font-semibold mb-3">{ride.route.name}</p>}
                  {(ride.route.distance || ride.route.difficulty) && (
                    <div className="flex flex-wrap gap-4 text-sm mb-3">
                      {ride.route.distance && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Distance:</span>
                          <span className="font-medium">{formatDistance(ride.route.distance)}</span>
                        </div>
                      )}
                      {ride.route.difficulty && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Difficulty:</span>
                          <Badge variant="outline" className={getDifficultyColor(ride.route.difficulty)}>
                            {ride.route.difficulty}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                  {ride.route.notes && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {linkifyText(ride.route.notes)}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-sm italic">Route not attached</p>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {ride.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About This Ride</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {ride.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Participant List (Member-only) */}
          {user && ride.participants && ride.participants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Participants ({ride.participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ride.participants.map((participant) => (
                    <div
                      key={participant.userId}
                      className="flex items-center justify-between py-3 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{participant.displayName}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(participant.joinedAt).toLocaleDateString('en-AU', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {participant.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty participant state */}
          {user && ride.participants && ride.participants.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No participants yet. Be the first to join!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CTA Area */}
          {renderCTA()}
        </div>
      </main>

      <Footer />

      {/* Leave Ride Confirmation Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this ride?</AlertDialogTitle>
            <AlertDialogDescription>
              You can rejoin later if spots are available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveRide}>
              Leave Ride
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Ride Confirmation Dialog */}
      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish this ride?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make the ride visible to all club members and they can start joining.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublishRide}>
              Publish Ride
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Ride Confirmation Dialog (Phase 3.3.4) */}
      <AlertDialog open={showCancelDialog} onOpenChange={(open) => {
        setShowCancelDialog(open);
        if (!open) setCancelReason(''); // Reset reason on close
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this ride?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the ride and mark it as cancelled. Members will see the updated status. The ride will remain visible for historical reference.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="cancelReason">Reason (optional)</Label>
            <Textarea
              id="cancelReason"
              placeholder="e.g., Weather conditions unsafe, Not enough participants..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Ride</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelRide}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Ride
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
