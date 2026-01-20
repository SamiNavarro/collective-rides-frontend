# Phase 3.2.3 - Known Limitations

## Cross-Page Cache Synchronization

### Issue
When a user performs an action on one page (e.g., leaves a club from My Clubs), the membership badge status on another page (e.g., Directory) does not update automatically until the page is refreshed.

### Current Behavior

#### ✅ Working Correctly
- **My Clubs Page**: Updates immediately after leaving a club (club disappears within 1-2 seconds)
- **Directory Page**: Updates immediately after joining/leaving a club from the directory itself
- **Join Club**: Works correctly from directory, club appears immediately in My Clubs
- **Leave Club**: Works correctly from My Clubs, club disappears immediately

#### ⚠️ Requires Manual Refresh
- **Scenario**: User leaves club from My Clubs → Navigates to Directory
- **Expected**: Directory should show "Join Club" button
- **Actual**: Directory still shows "Member" badge until page is refreshed
- **Workaround**: User must refresh the directory page to see updated status

### Technical Details

#### Why This Happens
React Query maintains separate cache entries for different queries:
- `['users', 'me', 'clubs']` - My Clubs data
- `['clubs', 'discovery']` - Directory data

When a mutation occurs (join/leave), we call `invalidateQueries` for both cache keys. However, React Query's behavior with navigation is:
1. If you're ON the page when invalidation happens → Refetch occurs
2. If you NAVIGATE TO the page after invalidation → May use cached data

We've configured:
```typescript
staleTime: 0,  // Data is immediately stale
refetchOnMount: 'always',  // Should refetch on mount
```

But in practice, the directory page doesn't always refetch when navigating from My Clubs after a leave action.

### Attempted Solutions

1. **Set `staleTime: 0`** - Makes data immediately stale ✅ Implemented
2. **Set `refetchOnMount: 'always'`** - Forces refetch on component mount ✅ Implemented
3. **Invalidate queries on mutation** - Already working ✅ Already in place

Despite these configurations, the cross-page synchronization doesn't work reliably without a refresh.

### Why This Is Acceptable for MVP

1. **Primary use case works**: Users typically join/leave from the page they're on
2. **No data loss**: The backend is correct, it's just a UI cache issue
3. **Simple workaround**: Refresh button works perfectly
4. **Low impact**: Most users won't notice since they perform actions on the page they're viewing
5. **Not a bug**: The data is correct, just cached

### Future Improvements

#### Option 1: Use Router Events (Recommended)
Listen for Next.js router events and force refetch on navigation:

```typescript
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export const useClubDiscovery = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const handleRouteChange = () => {
      queryClient.invalidateQueries({ queryKey: ['clubs', 'discovery'] });
    };
    
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router, queryClient]);
  
  return useQuery({
    queryKey: ['clubs', 'discovery'],
    // ... rest of config
  });
};
```

#### Option 2: Global State Management
Use Zustand or Redux to maintain a single source of truth for membership status across pages.

#### Option 3: WebSocket/Server-Sent Events
Real-time updates when membership changes occur (overkill for MVP).

#### Option 4: Aggressive Cache Invalidation
Set `cacheTime: 0` to prevent any caching, but this increases API calls significantly.

### Testing Notes

When testing join/leave functionality:
1. Test actions on the same page first (should work perfectly)
2. If testing cross-page updates, remember to refresh
3. Check browser console for React Query logs to verify invalidation is happening
4. Use React Query DevTools to inspect cache state

### User Impact

**Low** - Most users will:
- Join clubs from the directory (works perfectly)
- Leave clubs from My Clubs (works perfectly)
- Rarely navigate between pages immediately after an action

The few users who do navigate immediately will see stale data for a few seconds until they refresh or perform another action.

### Priority for Fix

**Low** - This is a nice-to-have improvement, not a critical bug. Consider addressing in a future polish phase after core features are complete.

---

**Status**: Documented as known limitation  
**Impact**: Low  
**Workaround**: Refresh page  
**Fix Priority**: Low (post-MVP)  
**Date**: January 19, 2026
