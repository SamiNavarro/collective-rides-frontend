# Phase 3.2.3 - Removed Clubs Filter Fix

## Issue
Clubs with `membershipStatus: 'removed'` were still showing in the My Clubs page after leaving. The club card would show "removed" status but wouldn't disappear from the list.

## Root Cause
Two issues were identified:

1. **TypeScript Type Missing 'removed' Status**: The `MyClubMembership` interface only included `'active' | 'pending' | 'suspended'` but not `'removed'`. This meant TypeScript wasn't properly handling the removed status.

2. **React Query Stale Time**: The `useMyClubs` hook had `staleTime: 2 * 60 * 1000` (2 minutes), which prevented React Query from refetching data immediately after invalidation. Even though the leave club mutation was calling `invalidateQueries`, the cache was considered "fresh" and wouldn't refetch.

## Fixes Applied

### 1. Updated TypeScript Types (`lib/types/clubs.ts`)
Added `'removed'` to all membership status types:

```typescript
export interface MyClubMembership {
  // ...
  membershipStatus: 'active' | 'pending' | 'suspended' | 'removed';
  // ...
}

export interface ClubDiscovery {
  // ...
  userMembership?: {
    role: 'member' | 'admin' | 'owner';
    status: 'active' | 'pending' | 'suspended' | 'removed';
  };
}

export interface ClubDetail {
  // ...
  userMembership?: {
    membershipId: string;
    role: 'member' | 'admin' | 'owner';
    status: 'active' | 'pending' | 'suspended' | 'removed';
    joinedAt: string;
  };
}

export interface ClubMember {
  // ...
  status: 'active' | 'pending' | 'suspended' | 'removed';
  // ...
}
```

### 2. Reduced React Query Stale Time (`hooks/use-clubs.ts`)
Changed from 2 minutes to 0 for immediate refetch:

```typescript
export const useMyClubs = () => {
  return useQuery({
    queryKey: ['users', 'me', 'clubs'],
    queryFn: async (): Promise<MyClubMembership[]> => {
      // ... query function
    },
    staleTime: 0, // Always refetch on invalidation (important for leave/join actions)
    retry: 2,
  });
};
```

### 3. Existing Filter Logic (Already in Place)
The filter in `app/my-clubs/page.tsx` was already correct:

```typescript
// Filter out removed clubs (only show active, pending, or suspended)
const activeClubs = clubs?.filter(club => 
  club.membershipStatus !== 'removed'
) || [];
```

## Testing

### Manual Test on Localhost
1. Navigate to http://localhost:3000/my-clubs
2. Note the number of clubs displayed
3. Click "Leave Club" on any club
4. Confirm the leave action in the dialog
5. **Expected**: Club should disappear from the list within 1-2 seconds
6. **Verify**: The club count should decrease by 1

### Console Logs to Watch
The browser console will show:
```
📊 Filtered clubs: { total: X, active: Y, removed: Z }
```

After leaving a club:
- `removed` count should increase
- `active` count should decrease
- Total clubs displayed should match `active` count

### What Should Happen
1. User clicks "Leave Club"
2. Dialog appears for confirmation
3. User confirms
4. Backend processes the leave (sets status to 'removed')
5. React Query invalidates the cache
6. Because `staleTime: 0`, React Query immediately refetches
7. Backend returns clubs including the one with 'removed' status
8. Frontend filter removes clubs with 'removed' status
9. UI updates to show fewer clubs

## Files Modified
- `lib/types/clubs.ts` - Added 'removed' to all status types
- `hooks/use-clubs.ts` - Changed staleTime from 2 minutes to 0

## Next Steps
After verifying this fix works on localhost:
1. Commit and push changes to GitHub
2. Vercel will auto-deploy
3. Test on production URL
4. Then test join club functionality with an available club

## Join Club Testing Note
The user is currently a member of all clubs, so join club will fail with `ConditionalCheckFailed`. To test join club:
1. Leave a club first (now this works correctly)
2. Then try joining it again
3. Should appear immediately in My Clubs with 'active' status
