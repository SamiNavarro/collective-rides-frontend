# Phase 3.3 Backend Enhancement: viewerParticipation

**Date**: January 20, 2026  
**Status**: ✅ Complete  
**Type**: Contract Enhancement (Non-Breaking)

## Overview

Added `viewerParticipation` field to ride detail response to support Phase 3.3 frontend implementation. This provides the viewer's participation context (including `participationId`) needed for leave ride functionality.

## Problem Statement

**Frontend Requirement**: Leave ride action requires `participationId`

**Original Backend Response**:
```typescript
{
  ...rideData,
  participants: [
    { userId, role, status, joinedAt }
    // No participationId exposed
  ]
}
```

**Issue**: Frontend cannot call `DELETE /v1/participations/{participationId}` without the ID

## Solution Options Considered

### Option 1: Add participationId to all participants ❌
```typescript
participants: [
  { userId, participationId, role, status, joinedAt }
]
```

**Drawbacks**:
- Exposes internal IDs for all participants
- Privacy concerns (easier to scrape/correlate records)
- Increases payload size
- Creates future migration pressure

### Option 2: Add participationId only for viewer ⚠️
```typescript
participants: [
  { 
    userId, 
    participationId: userId === viewerId ? participationId : undefined,
    role, 
    status, 
    joinedAt 
  }
]
```

**Drawbacks**:
- Still leaky (exposes viewer's ID in participants array)
- Inconsistent data structure (some have ID, some don't)
- Harder to maintain

### Option 3: Add viewerParticipation at top level ✅ **CHOSEN**
```typescript
{
  ...rideData,
  participants: [...],
  viewerParticipation?: {
    participationId: string;
    role: RideRole;
    status: ParticipationStatus;
    joinedAt: string;
  }
}
```

**Benefits**:
- Privacy-friendly: Only viewer's participation exposed
- Clean contract: Top-level field, clear intent
- Efficient: No need to search participants array
- Follows common API patterns ("viewer context")
- Non-breaking: Optional field, existing clients unaffected

## Implementation

### File Modified
- `backend/services/ride-service/handlers/ride/get-ride.ts`

### Changes

**Before**:
```typescript
// Get participants
const participants = await participationService.getRideParticipants(rideId);

// Transform participants data
const participantsData = participants
  .filter(p => p.status === ParticipationStatus.CONFIRMED)
  .map(p => {
    const pData = p.toJSON();
    return {
      userId: pData.userId,
      displayName: 'Unknown',
      role: pData.role,
      status: pData.status,
      joinedAt: pData.joinedAt
    };
  });

return createResponse(200, {
  success: true,
  data: {
    ...rideData,
    participants: participantsData,
    waitlist: waitlistData
  },
  timestamp: new Date().toISOString()
});
```

**After**:
```typescript
// Get participants
const participants = await participationService.getRideParticipants(rideId);

// Find viewer's participation (if any)
const viewerParticipation = participants.find(p => p.userId === authContext.userId);

// Transform participants data (unchanged)
const participantsData = participants
  .filter(p => p.status === ParticipationStatus.CONFIRMED)
  .map(p => {
    const pData = p.toJSON();
    return {
      userId: pData.userId,
      displayName: 'Unknown',
      role: pData.role,
      status: pData.status,
      joinedAt: pData.joinedAt
    };
  });

return createResponse(200, {
  success: true,
  data: {
    ...rideData,
    participants: participantsData,
    waitlist: waitlistData,
    // Viewer-specific participation context (Phase 3.3)
    viewerParticipation: viewerParticipation ? {
      participationId: viewerParticipation.participationId,
      role: viewerParticipation.role,
      status: viewerParticipation.status,
      joinedAt: viewerParticipation.joinedAt
    } : undefined
  },
  timestamp: new Date().toISOString()
});
```

### Logic

1. Fetch all participants (existing logic)
2. Find viewer's participation by matching `authContext.userId`
3. If found, include `viewerParticipation` in response
4. If not found (viewer not a participant), field is `undefined`

### Performance Impact

**Minimal**: 
- Single array find operation (O(n) where n = participant count)
- Typical rides have <50 participants, so negligible overhead
- No additional database queries

## Response Contract

### Endpoint
`GET /v1/clubs/{clubId}/rides/{rideId}`

### Response Structure
```typescript
{
  success: true,
  data: {
    // Existing ride fields
    rideId: string;
    clubId: string;
    title: string;
    // ... all other ride fields
    
    // Existing participants array (unchanged)
    participants: [
      {
        userId: string;
        displayName: string;
        role: RideRole;
        status: ParticipationStatus;
        joinedAt: string;
      }
    ],
    
    // Existing waitlist array (unchanged)
    waitlist: [...],
    
    // NEW: Viewer-specific participation context
    viewerParticipation?: {
      participationId: string;
      role: RideRole;
      status: ParticipationStatus;
      joinedAt: string;
    }
  },
  timestamp: string
}
```

### Field Behavior

**viewerParticipation**:
- **Present**: When authenticated user is a participant (any status)
- **Absent**: When user is not a participant OR request is unauthenticated
- **Type**: Optional object

**participationId**:
- Used for leave ride action: `DELETE /v1/participations/{participationId}`
- Unique identifier for the participation record

**status**:
- `confirmed`: Active participant
- `waitlisted`: On waitlist
- `withdrawn`: Left the ride
- `removed`: Removed by leader

## Frontend Usage

### Leave Ride Flow

```typescript
// In ride detail page
const { data: ride } = useRide(clubId, rideId);
const leaveRide = useLeaveRide();

const handleLeave = async () => {
  if (!ride.viewerParticipation) {
    // User is not a participant
    return;
  }
  
  await leaveRide.mutateAsync({
    participationId: ride.viewerParticipation.participationId,
    clubId,
    rideId
  });
};
```

### CTA Button Logic

```typescript
const getCtaState = () => {
  if (!ride.viewerParticipation) {
    return 'join'; // Show "Join Ride" button
  }
  
  if (ride.viewerParticipation.status === 'confirmed') {
    return 'leave'; // Show "Leave Ride" button
  }
  
  if (ride.viewerParticipation.status === 'waitlisted') {
    return 'waitlisted'; // Show "On Waitlist" badge
  }
  
  return 'withdrawn'; // Show "Rejoin" button
};
```

## Testing

### Manual Testing

```bash
# Get test tokens
cd backend
./scripts/get-test-tokens.sh

# Test ride detail as participant
curl -H "Authorization: Bearer $MEMBER_TOKEN" \
  $API_URL/v1/clubs/sydney-cycling-club/rides/test-ride-1 | jq '.data.viewerParticipation'

# Expected: { participationId, role, status, joinedAt }

# Test ride detail as non-participant
curl -H "Authorization: Bearer $NON_MEMBER_TOKEN" \
  $API_URL/v1/clubs/sydney-cycling-club/rides/test-ride-1 | jq '.data.viewerParticipation'

# Expected: null
```

### Automated Testing

Add to `backend/scripts/test-phase-3.3.sh`:

```bash
# Test viewerParticipation field
echo "Testing viewerParticipation field..."

# Join ride
PARTICIPATION=$(curl -s -X POST \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  "$API_URL/v1/clubs/$CLUB_ID/rides/$RIDE_ID/participants" | jq -r '.data.participationId')

# Get ride detail
VIEWER_PARTICIPATION=$(curl -s \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  "$API_URL/v1/clubs/$CLUB_ID/rides/$RIDE_ID" | jq '.data.viewerParticipation')

# Verify participationId matches
if [ "$VIEWER_PARTICIPATION.participationId" == "$PARTICIPATION" ]; then
  echo "✅ viewerParticipation.participationId matches join response"
else
  echo "❌ participationId mismatch"
  exit 1
fi
```

## Deployment

### Deployment Type
**Non-Breaking Change**: Existing clients unaffected

### Rollout Strategy
1. Deploy backend enhancement
2. Verify with manual testing
3. Deploy frontend Phase 3.3.2 (uses new field)

### Rollback Plan
If issues arise:
1. Revert backend deployment (removes field)
2. Frontend gracefully handles missing field (optional type)

## Impact

### Privacy
✅ **Improved**: Only viewer's participation exposed, not all participants

### Performance
✅ **Minimal**: Single array find operation, no additional queries

### Security
✅ **Neutral**: No new attack vectors, follows existing auth patterns

### Maintainability
✅ **Improved**: Clean contract, clear intent, follows API best practices

## Future Enhancements

### Phase 3.4+
- Add user name enrichment to participants array
- Add `viewerCanLeave` boolean (business rule check)
- Add `viewerCanPromote` boolean (for leaders)

### Phase 4+
- Add `viewerPermissions` array (fine-grained capabilities)
- Add `viewerNotifications` (ride-specific notification settings)

## Related Documents

- `docs/phase-3.3-plan.md` - Frontend implementation plan
- `docs/phase-3.3-refinements.md` - Pre-implementation refinements
- `.kiro/specs/phase-2.3.ride-management.v1.md` - Original ride service spec

---

**Status**: ✅ Complete - Ready for Phase 3.3.2 frontend implementation
