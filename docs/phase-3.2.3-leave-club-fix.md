# Phase 3.2.3 - Leave Club Fix (Response Unwrapping)

## Issue
User reported: "still club not disappearing from 'my hub' lets test in local host see whats happening"

After clicking "Leave Club" in the custom dialog:
- Dialog closes successfully
- No errors in console
- But the club remains in the "My Clubs" list
- Page refresh doesn't remove it either

## Root Cause

### The Problem
The frontend React Query hooks were still using **double unwrapping** (`response.data.data`) even though the backend was fixed to return single-wrapped responses.

### What Was Happening

**Backend Response** (after Phase 3.2.3 response format fix):
```json
{
  "success": true,
  "data": [
    {"clubId": "pastriescc", "clubName": "Pastries.cc", ...}
  ],
  "timestamp": "2026-01-19T06:10:00.000Z"
}
```

**Frontend Code** (WRONG):
```typescript
// hooks/use-clubs.ts
const response = await api.user.getClubs();
return response.data.data; // ❌ Trying to access .data.data
//                    ^^^^
//                    This is undefined!
```

**Result**:
- `response.data` = array of clubs ✅
- `response.data.data` = undefined ❌
- React Query caches `undefined`
- Page shows no clubs or stale data

### Why It Wasn't Caught Earlier
The issue was masked because:
1. React Query was caching old data from before the backend fix
2. The page appeared to work on first load
3. Only mutations (like leave club) triggered refetch with new data format
4. The refetch returned `undefined`, so React Query kept showing stale data

## Solution

### Fix All React Query Hooks
Update all hooks in `hooks/use-clubs.ts` to use **single unwrapping**.

#### 1. useMyClubs Hook
**Before**:
```typescript
export const useMyClubs = () => {
  return useQuery({
    queryKey: ['users', 'me', 'clubs'],
    queryFn: async (): Promise<MyClubMembership[]> => {
      const response = await api.user.getClubs();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch clubs');
      }
      return response.data.data; // ❌ Double unwrap
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
};
```

**After**:
```typescript
export const useMyClubs = () => {
  return useQuery({
    queryKey: ['users', 'me', 'clubs'],
    queryFn: async (): Promise<MyClubMembership[]> => {
      const response = await api.user.getClubs();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch clubs');
      }
      return response.data; // ✅ Single unwrap (response.data is the array)
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
};
```

#### 2. useClubDiscovery Hook
**Before**:
```typescript
return response.data.data; // ❌ Double unwrap
```

**After**:
```typescript
return response.data; // ✅ Single unwrap (response.data is the array)
```

#### 3. useClub Hook
**Before**:
```typescript
return response.data.data; // ❌ Double unwrap
```

**After**:
```typescript
return response.data; // ✅ Single unwrap (response.data is the club object)
```

#### 4. useClubMembers Hook
**Before**:
```typescript
return response.data.data; // ❌ Double unwrap
```

**After**:
```typescript
return response.data; // ✅ Single unwrap (response.data is the array)
```

#### 5. useMyMemberships Hook (Legacy)
**Before**:
```typescript
return response.data.data; // ❌ Double unwrap
```

**After**:
```typescript
return response.data; // ✅ Single unwrap (response.data is the array)
```

### Enhanced Logging
Added detailed console logging to `app/my-clubs/page.tsx` for debugging:

```typescript
const confirmLeaveClub = async () => {
  if (!clubToLeave) return
  
  console.log('🚪 Leaving club:', clubToLeave)
  console.log('📊 Current clubs count:', clubs?.length)
  
  try {
    const result = await leaveClubMutation.mutateAsync(clubToLeave.id)
    console.log('✅ Leave club result:', result)
    console.log('🔄 Mutation completed, React Query should invalidate queries now')
    setLeaveDialogOpen(false)
    setClubToLeave(null)
    
    // Force refetch after a short delay to ensure backend has processed
    setTimeout(() => {
      console.log('🔄 Manually triggering refetch...')
      refetch()
    }, 500)
  } catch (error) {
    console.error('❌ Failed to leave club:', error)
  }
}
```

## Files Changed

### Frontend
- ✅ `hooks/use-clubs.ts` - Fixed all 5 hooks to use single unwrapping
- ✅ `app/my-clubs/page.tsx` - Added enhanced logging for debugging

### No Backend Changes Needed
Backend was already fixed in Phase 3.2.3 response format fix.

## Testing on Localhost

### Expected Behavior
1. **Load My Clubs page**: Should show user's clubs
2. **Click "Leave Club"**: Custom dialog appears
3. **Confirm leave**: 
   - Dialog closes
   - Console shows: "🚪 Leaving club: {clubId, name}"
   - Console shows: "✅ Leave club result: {success: true, ...}"
   - Console shows: "🔄 Mutation completed, React Query should invalidate queries now"
   - Console shows: "🔄 Manually triggering refetch..."
   - Club disappears from list immediately
4. **Refresh page**: Club should still be gone

### Console Output (Success)
```
🚪 Leaving club: {id: "pastriescc", name: "Pastries.cc"}
📊 Current clubs count: 2
✅ Leave club result: {success: true, message: "Successfully left the club", ...}
🔄 Mutation completed, React Query should invalidate queries now
🔄 Manually triggering refetch...
```

### Console Output (Failure)
```
🚪 Leaving club: {id: "pastriescc", name: "Pastries.cc"}
📊 Current clubs count: 2
❌ Failed to leave club: Error: Failed to leave club
```

## Why This Fix Works

### The Response Flow

**1. Backend Handler** (`leave-club.ts`):
```typescript
const response = {
  success: true,
  message: 'Successfully left the club',
  timestamp: new Date().toISOString(),
};
return createSuccessResponse(response, undefined, origin);
```

**2. createSuccessResponse** wraps it:
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Successfully left the club",
    "timestamp": "..."
  },
  "timestamp": "..."
}
```

**3. Frontend API Client** (`api-client.ts`):
```typescript
// Returns the full response
return {
  success: true,
  data: responseData,  // The wrapped response
  statusCode: response.status,
};
```

**4. React Query Hook** (`use-clubs.ts`):
```typescript
const response = await api.clubs.leave(clubId);
// response.success = true
// response.data = {success: true, message: "...", timestamp: "..."}
return response.data; // ✅ Correct!
```

**5. Mutation Success**:
```typescript
onSuccess: (data, clubId) => {
  // Invalidate queries to trigger refetch
  queryClient.invalidateQueries({ queryKey: ['users', 'me', 'clubs'] });
  queryClient.invalidateQueries({ queryKey: ['clubs', clubId] });
  queryClient.invalidateQueries({ queryKey: ['clubs', 'discovery'] });
}
```

**6. Refetch** (`useMyClubs`):
```typescript
const response = await api.user.getClubs();
// response.data = [clubs array]
return response.data; // ✅ Returns array correctly!
```

## Related Issues Fixed

This fix also resolves potential issues in:
- ✅ Club directory page (`/clubs/directory`)
- ✅ Club detail page (`/clubs/[clubId]`)
- ✅ Club members list
- ✅ My Clubs page (`/my-clubs`)

All pages now correctly parse API responses.

## Deployment

### Frontend Only
No backend changes needed. Only frontend needs to be deployed.

```bash
# Test locally first
npm run dev
# Open http://localhost:3000
# Test leave club functionality

# Deploy to Vercel
git add hooks/use-clubs.ts app/my-clubs/page.tsx
git commit -m "fix: Correct response unwrapping in React Query hooks"
git push origin main
# Vercel auto-deploys
```

## Success Criteria

✅ My Clubs page loads without errors
✅ Clubs display correctly
✅ Leave Club dialog appears when clicking "Leave Club"
✅ Club is removed from list after confirming leave
✅ Page refresh shows club is still gone
✅ No console errors
✅ React Query cache updates correctly

## Prevention

### Pattern to Remember
**Backend response format**:
```json
{
  "success": true,
  "data": <your actual data>,
  "timestamp": "..."
}
```

**Frontend unwrapping**:
```typescript
const response = await api.someEndpoint();
// response.success = true
// response.data = <your actual data>
return response.data; // ✅ Single unwrap
```

**Never do**:
```typescript
return response.data.data; // ❌ Double unwrap (wrong!)
```

## Next Steps

1. **Test on localhost** - Verify leave club works
2. **Check console logs** - Ensure proper flow
3. **Deploy to Vercel** - Push changes
4. **Test on production** - Verify on Vercel URL
5. **Clear browser cache** - Hard refresh (Cmd+Shift+R)

The fix is ready for testing!
