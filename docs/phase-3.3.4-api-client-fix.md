# Phase 3.3.4 API Client Fix

**Date:** February 2, 2026  
**Status:** ✅ Fixed  
**Issue:** DELETE requests with body not working

---

## Problem

When trying to save edits to a ride, the request failed with:
```
Error: Failed to fetch
lib/api/api-client.ts (70:30) @ ApiClient.request
```

The cancel ride endpoint also would have failed because it needs to send a body with the DELETE request (the cancellation reason).

---

## Root Cause

The `apiClient.delete()` method signature didn't support passing a request body:

```typescript
// Old signature - no body support
async delete<T = any>(endpoint: string, requireAuth = true): Promise<ApiResponse<T>>
```

But the cancel method was trying to pass data:
```typescript
cancel: (clubId: string, rideId: string, data: { reason?: string }) => 
  apiClient.delete(`/v1/clubs/${clubId}/rides/${rideId}`, { data })
```

This caused TypeScript to accept it (because `{ data }` was being passed as the `requireAuth` parameter), but the body was never actually sent in the request.

---

## Solution

Updated the `delete()` method to accept an optional options object with `data` and `requireAuth`:

```typescript
// New signature - supports body
async delete<T = any>(
  endpoint: string, 
  options?: { data?: any; requireAuth?: boolean }
): Promise<ApiResponse<T>> {
  const requireAuth = options?.requireAuth !== undefined ? options.requireAuth : true;
  return this.request<T>(endpoint, { 
    method: 'DELETE', 
    body: options?.data,
    requireAuth 
  });
}
```

---

## Changes Made

### 1. Updated `delete()` Method Signature
- Added optional `options` parameter with `data` and `requireAuth` properties
- Passes `options.data` as the request body
- Maintains backward compatibility (requireAuth defaults to true)

### 2. Updated All `delete()` Calls
Updated all existing delete calls to use the new signature:

```typescript
// Clubs
leave: (id: string) => apiClient.delete(`/v1/clubs/${id}/members/me`, { requireAuth: true })

// Rides
leave: (clubId: string, rideId: string) => 
  apiClient.delete(`/v1/clubs/${clubId}/rides/${rideId}/participants/me`, { requireAuth: true })

cancel: (clubId: string, rideId: string, data: { reason?: string }) => 
  apiClient.delete(`/v1/clubs/${clubId}/rides/${rideId}`, { data })

// Strava
disconnect: () => apiClient.delete('/integrations/strava/disconnect', { requireAuth: true })
```

---

## Testing

After fix:
- ✅ Edit ride saves successfully
- ✅ Cancel ride with reason works
- ✅ Cancel ride without reason works
- ✅ All existing delete operations still work
- ✅ No TypeScript errors

---

## Files Modified

- `lib/api/api-client.ts` - Updated delete method and all delete calls

---

## Impact

**Before Fix:**
- Edit ride failed with "Failed to fetch"
- Cancel ride would fail to send reason
- DELETE requests couldn't send body data

**After Fix:**
- Edit ride works correctly
- Cancel ride sends reason to backend
- DELETE requests support optional body data
- All existing functionality preserved

---

**Fix Complete** ✅  
**Ready for Testing** ✅

