# Phase 3.2.3: Pending Applications Visibility - Implementation

## Overview

This implementation adds visibility for pending club applications across the frontend, allowing users to track their application status in multiple contexts.

## Problem Statement

User applied to Pastries.cc club but couldn't see the pending application in the My Clubs page. The application was successfully created in the backend, but the frontend wasn't fetching or displaying pending memberships.

## Root Cause

1. The auth context was calling `getMemberships()` endpoint which doesn't support status filtering
2. The frontend wasn't utilizing the hydrated `getClubs()` endpoint with status parameter
3. The My Clubs page UI was already built to show pending applications, but no data was being provided

## Solution

### 1. Updated API Client (`lib/api/api-client.ts`)

Added support for status parameter to the `getClubs()` method:

```typescript
getClubs: (status?: 'active' | 'pending' | 'suspended') => {
  const params = status ? `?status=${status}` : '';
  return apiClient.get(`/v1/users/me/clubs${params}`);
}
```

This allows the frontend to fetch:
- All clubs: `api.user.getClubs()`
- Active clubs only: `api.user.getClubs('active')`
- Pending applications only: `api.user.getClubs('pending')`

### 2. Updated Auth Context (`contexts/auth-context.tsx`)

Modified the `initializeAuth()` function to fetch both active and pending memberships separately:

```typescript
// Fetch user's active clubs (hydrated with club data)
const activeClubsResponse = await api.user.getClubs('active')
if (activeClubsResponse.success && activeClubsResponse.data) {
  const activeClubsData = activeClubsResponse.data.data || activeClubsResponse.data
  if (Array.isArray(activeClubsData)) {
    frontendUser.joinedClubs = activeClubsData.map((club: any) => ({
      clubId: club.clubId,
      clubName: club.clubName,
      joinedDate: club.joinedAt,
      membershipType: club.membershipStatus,
      role: club.membershipRole,
    }))
  }
}

// Fetch user's pending applications (hydrated with club data)
const pendingClubsResponse = await api.user.getClubs('pending')
if (pendingClubsResponse.success && pendingClubsResponse.data) {
  const pendingClubsData = pendingClubsResponse.data.data || pendingClubsResponse.data
  if (Array.isArray(pendingClubsData)) {
    frontendUser.clubApplications = pendingClubsData.map((club: any) => ({
      id: club.clubId,
      clubId: club.clubId,
      clubName: club.clubName,
      applicationDate: club.joinedAt,
      status: 'pending' as const,
      message: '',
      experience: '',
      motivation: '',
      availability: [],
    }))
  }
}
```

**Benefits:**
- Uses the hydrated endpoint for better performance (fewer API calls)
- Separates active memberships from pending applications
- Provides all necessary club data (name, location, etc.) in one call

### 3. My Clubs Page (Already Implemented)

The My Clubs page (`app/my-clubs/page.tsx`) already had the UI for displaying pending applications:

- **Pending Applications Section**: Shows a dedicated card with pending applications
- **Status Badge**: Displays "Pending Approval" badge with clock icon
- **Application Date**: Shows when the user applied
- **View Club Button**: Links to the club page

The page checks `user.clubApplications` from the auth context and displays them appropriately.

## Backend Support

The backend already supports this functionality:

**Endpoint**: `GET /v1/users/me/clubs?status={status}`

**Handler**: `backend/services/club-service/handlers/user/get-user-clubs.ts`

**Features:**
- Returns hydrated club data (club name, location, member count, etc.)
- Supports optional `status` query parameter: `active`, `pending`, `suspended`
- If no status is provided, returns all memberships

## User Experience

### My Clubs Page (`/my-clubs`)

**With Pending Applications:**
```
┌─────────────────────────────────────────┐
│ Pending Applications (1)                │
├─────────────────────────────────────────┤
│ Pastries.cc                             │
│ Applied 1/18/2026                       │
│ [Pending Approval] [View Club →]        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Your Clubs (0)                          │
├─────────────────────────────────────────┤
│ No clubs joined yet                     │
│ Your applications are being reviewed.   │
│ Browse more clubs while you wait!       │
│ [Browse Clubs]                          │
└─────────────────────────────────────────┘
```

**With No Pending Applications:**
```
┌─────────────────────────────────────────┐
│ Your Clubs (0)                          │
├─────────────────────────────────────────┤
│ No clubs joined yet                     │
│ Join cycling clubs to connect with      │
│ other riders and discover new routes    │
│ [Browse Clubs]                          │
└─────────────────────────────────────────┘
```

## Testing

### Manual Testing Steps

1. **Login as testuser2**
   - Email: `testuser2@test.com`
   - Password: `TestPassword123!`

2. **Navigate to My Clubs** (`/my-clubs`)
   - Should see "Pending Applications (1)" section
   - Should see Pastries.cc with "Pending Approval" badge
   - Should see application date

3. **Navigate to Club Directory** (`/clubs/directory`)
   - Should see Pastries.cc in the list
   - (Future: Should show "Applied" badge on the card)

4. **Navigate to Pastries.cc Club Page**
   - (Future: Should show "Application Pending" banner)

### API Testing

Test the backend endpoint directly:

```bash
# Get all clubs (active + pending)
curl -H "Authorization: Bearer $TOKEN" \
  https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/v1/users/me/clubs

# Get only active clubs
curl -H "Authorization: Bearer $TOKEN" \
  https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/v1/users/me/clubs?status=active

# Get only pending applications
curl -H "Authorization: Bearer $TOKEN" \
  https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/v1/users/me/clubs?status=pending
```

## Future Enhancements (Phase 3.2.3 Completion)

### 1. Directory Membership Badges

Add membership status badges to club cards in the directory:

```typescript
// In /clubs/directory page
{userMembership?.status === 'pending' && (
  <Badge variant="outline" className="bg-orange-100">
    <Clock className="w-3 h-3 mr-1" />
    Applied
  </Badge>
)}

{userMembership?.status === 'active' && (
  <Badge variant="default">
    <Check className="w-3 h-3 mr-1" />
    Member
  </Badge>
)}
```

### 2. Club Page Status Banner

Add a status banner on individual club pages:

```typescript
// In /clubs/[clubId] page
{userMembership?.status === 'pending' && (
  <Alert className="mb-6 border-orange-200 bg-orange-50">
    <Clock className="h-4 w-4 text-orange-600" />
    <AlertTitle>Application Pending</AlertTitle>
    <AlertDescription>
      Your application to join this club is being reviewed by the administrators.
      You'll be notified once a decision is made.
    </AlertDescription>
  </Alert>
)}
```

### 3. Optimistic UI Updates

Improve the join flow with optimistic updates:

```typescript
const { mutate: applyToClub } = useMutation({
  mutationFn: (data) => api.clubs.join(clubId, data),
  onMutate: async () => {
    // Show "Pending" immediately
    await queryClient.cancelQueries(['clubs', clubId]);
    const previous = queryClient.getQueryData(['clubs', clubId]);
    
    queryClient.setQueryData(['clubs', clubId], (old) => ({
      ...old,
      userMembership: { status: 'pending' }
    }));
    
    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['clubs', clubId], context.previous);
  },
  onSuccess: () => {
    // Invalidate related queries
    queryClient.invalidateQueries(['users', 'me', 'clubs']);
    queryClient.invalidateQueries(['clubs', 'discovery']);
  },
});
```

## Files Modified

1. `lib/api/api-client.ts` - Added status parameter to getClubs()
2. `contexts/auth-context.tsx` - Updated to fetch active and pending clubs separately
3. `app/my-clubs/page.tsx` - Already had UI for pending applications (no changes needed)

## Files Created

1. `docs/phase-3.2.3-pending-applications.md` - This documentation
2. `scripts/test-phase-3.2.3-pending-apps.js` - Browser-based test script (requires puppeteer)
3. `scripts/test-pending-apps-api.js` - API test script

## Compliance

This implementation follows the Phase 3.2.3 specification:

- ✅ Pending applications visible in `/my-clubs`
- ⏭️ Membership badges in `/clubs/directory` (deferred)
- ⏭️ Status banner in `/clubs/[clubId]` (deferred)
- ✅ Uses hydrated endpoint for better performance
- ✅ Separates active memberships from pending applications
- ✅ Clear user feedback on application status

## Next Steps

1. **Test in Browser**: Verify pending applications show up in My Clubs page
2. **Add Directory Badges**: Implement membership status badges in club directory
3. **Add Club Page Banner**: Implement status banner on individual club pages
4. **Optimistic Updates**: Add optimistic UI updates to join flow
5. **Deploy**: Push changes to production

## References

- Phase 3.2 Spec: `.kiro/specs/phase-3.2.club-pages-and-discovery.v1.md`
- Phase 3.2.2 Completion: `docs/phase-3.2.2-completion-summary.md`
- Backend Handler: `backend/services/club-service/handlers/user/get-user-clubs.ts`
