/**
 * Rides Listing Page - Phase 3.3.1
 * 
 * Displays upcoming rides across user's clubs with filters.
 * Implements canonical ride card model and empty state handling.
 * 
 * Updated: 2026-02-05 - Trigger fresh Vercel deployment after CORS fix
 */

'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { RideCard } from '@/components/rides/ride-card';
import { RideFiltersComponent } from '@/components/rides/ride-filters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, AlertCircle } from 'lucide-react';
import { useMyClubs } from '@/hooks/use-clubs';
import { useRides } from '@/hooks/use-rides';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { RideFilters } from '@/lib/types/rides';

export default function RidesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: clubs, isLoading: clubsLoading } = useMyClubs();
  
  // Default filters: past 7 days + next 30 days (to catch test rides)
  const [filters, setFilters] = useState<RideFilters>({
    datePreset: 'next-30-days',
    startDate: (() => {
      const start = new Date();
      start.setDate(start.getDate() - 7); // Include rides from past 7 days
      return start.toISOString();
    })(),
    endDate: (() => {
      const end = new Date();
      end.setDate(end.getDate() + 30);
      return end.toISOString();
    })(),
  });

  // Get active club IDs
  const activeClubIds = useMemo(() => {
    if (!clubs) return [];
    return clubs
      .filter(c => c.membershipStatus === 'active')
      .map(c => c.clubId);
  }, [clubs]);

  // Filter by specific club if selected
  const clubIdsToFetch = useMemo(() => {
    if (filters.clubId) {
      return [filters.clubId];
    }
    return activeClubIds;
  }, [filters.clubId, activeClubIds]);

  // Fetch rides
  const { data: rides, isLoading: ridesLoading, error } = useRides(clubIdsToFetch, filters);

  // Client-side search filter
  const filteredRides = useMemo(() => {
    if (!rides) return [];
    if (!filters.search) return rides;
    
    const searchLower = filters.search.toLowerCase();
    return rides.filter(ride => 
      ride.title.toLowerCase().includes(searchLower)
    );
  }, [rides, filters.search]);

  // Get club name for ride card
  const getClubName = (clubId: string) => {
    return clubs?.find(c => c.clubId === clubId)?.clubName;
  };

  // Loading state
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center py-20">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-4">Sign in to View Rides</h2>
            <p className="text-muted-foreground mb-6">
              Join clubs and discover upcoming rides in your area.
            </p>
            <Button onClick={() => router.push('/auth/login?redirect=/rides')}>
              Sign In
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (clubsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your clubs...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Empty state: No active memberships
  const activeClubs = clubs?.filter(c => c.membershipStatus === 'active') || [];
  const pendingClubs = clubs?.filter(c => c.membershipStatus === 'pending') || [];

  if (activeClubs.length === 0) {
    if (pendingClubs.length > 0) {
      // Pending applications only
      return (
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto text-center py-20">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-4">Applications Pending Approval</h2>
              <p className="text-muted-foreground mb-6">
                You have {pendingClubs.length} pending club {pendingClubs.length === 1 ? 'application' : 'applications'}. 
                Rides will appear once your membership is approved.
              </p>
              <Button onClick={() => router.push('/my-clubs')}>
                View My Applications
              </Button>
            </div>
          </main>
          <Footer />
        </div>
      );
    }

    // No clubs at all
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center py-20">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-4">No Clubs Yet</h2>
            <p className="text-muted-foreground mb-6">
              Browse clubs and join to see upcoming rides.
            </p>
            <Button onClick={() => router.push('/clubs')}>
              Browse Clubs
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Upcoming Rides</h1>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">
                Rides from your clubs
              </p>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                My clubs only
              </Badge>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <RideFiltersComponent
              clubs={clubs || []}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>

          {/* Loading State */}
          {ridesLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading rides...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="font-semibold text-lg mb-2">Unable to Load Rides</h3>
              <p className="text-muted-foreground text-center mb-6">
                {error instanceof Error ? error.message : 'Please try again later.'}
              </p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          )}

          {/* Rides List */}
          {!ridesLoading && !error && filteredRides.length > 0 && (
            <div className="space-y-3">
              {filteredRides.map((ride) => (
                <RideCard
                  key={ride.rideId}
                  ride={ride}
                  clubName={getClubName(ride.clubId)}
                />
              ))}
            </div>
          )}

          {/* Empty State: No Rides */}
          {!ridesLoading && !error && filteredRides.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Upcoming Rides</h3>
              <p className="text-muted-foreground mb-6">
                {filters.search 
                  ? `No rides match "${filters.search}"`
                  : filters.clubId
                  ? 'No upcoming rides scheduled for this club.'
                  : 'No upcoming rides scheduled in your clubs.'}
              </p>
              {filters.search || filters.clubId ? (
                <Button 
                  variant="outline" 
                  onClick={() => setFilters({ datePreset: 'next-30-days' })}
                >
                  Clear Filters
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
