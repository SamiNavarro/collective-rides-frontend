# Phase 3.3.1 Navigation Cleanup

**Date**: January 22, 2026  
**Status**: ✅ Complete

## Context

After implementing Phase 3.3.1 (Ride Listing), clarified the navigation structure to avoid confusion between `/routes` (static discovery) and `/rides` (dynamic user rides).

## The Two Pages

### `/routes` - Static Route Discovery (Unchanged)
- Marketing/discovery page for routes
- Regular weekly rides (Three Gorges, CP Thursdays, Waterfall, Ball Hill Loop)
- Captain's Rides with Strava links
- Carousel UI with filters
- **Purpose**: Browse and discover routes (not user-specific)

### `/rides` - Dynamic User Rides (NEW - Phase 3.3.1)
- Shows upcoming rides from user's joined clubs
- Filtered by active memberships
- Real-time data from backend
- "My clubs only" badge for clarity
- **Purpose**: See rides from clubs you're a member of

## Navigation Structure

### Option A1 (Implemented) - Updated

**Main Navigation** (visible to all):
- Routes → `/routes` (static discovery)
- **Rides** → `/rides` (only visible when logged in)
- Coffee → `/coffee`
- Clubs → `/clubs/directory`
- Guides → `/guides`

**User Menu** (when logged in):
- My Hub → `/hub`
- My Clubs → `/my-clubs`
- **Rides** → `/rides` (same as main nav, feels like alias)
- Profile, Settings, etc.

**Desktop Nav** (when logged in):
- Shows "Rides" link in main nav (member-only)
- Also shows "Rides" in user menu (alias)

**Key Change**: "Rides" is now hidden from main nav when logged out to avoid confusion.

## Key Decisions

### Why Option A1?

1. **Single destination**: `/rides` is already scoped to "my clubs" by default
2. **No feature creep**: Avoids building "all rides on platform" (privacy, moderation, spam concerns)
3. **Clear labeling**: Both "Rides" links go to same place, but context makes it clear
4. **MVP-appropriate**: Can add "joined rides only" filter later if needed

### Why NOT "My Rides" label?

- Implies there are two different pages (confusing)
- The page already shows "My clubs only" badge
- Cleaner to have consistent "Rides" label everywhere

### Future Enhancement (Optional)

If users request "show only rides I've joined":
- Add query param: `/rides?view=joined`
- Add toggle on page: "My clubs | Joined"
- No new page needed

## Changes Made

### `components/header.tsx`

**Before**:
- Desktop nav: "Rides" visible to all users → `/rides`
- Mobile nav: "Rides" visible to all users → `/rides`
- User dropdown: "My Rides" → `/rides`

**After**:
- Desktop nav: "Rides" only visible when logged in → `/rides`
- Mobile nav: "Rides" only visible when logged in → `/rides`
- User dropdown: "Rides" → `/rides`

**Result**: 
- Logged-out users see: Routes, Coffee, Clubs, Guides (no Rides)
- Logged-in users see: Routes, Rides, Coffee, Clubs, Guides + user menu with Rides
- Consistent "Rides" label everywhere (no "My Rides")
- No confusion about member-only content

## UI Clarity

The `/rides` page already has:
- ✅ "My clubs only" badge near filters
- ✅ Empty state handling (no clubs, pending only, no rides)
- ✅ Clear scope messaging

This makes the current behavior feel intentional, not confusing.

## Testing

- [x] Desktop nav hides "Rides" when logged out
- [x] Desktop nav shows "Rides" when logged in
- [x] Mobile nav hides "Rides" when logged out
- [x] Mobile nav shows "Rides" when logged in
- [x] User dropdown shows "Rides" (not "My Rides")
- [x] All links point to `/rides`
- [x] Page shows "My clubs only" badge
- [x] No confusion about member-only content
- [x] Logged-out users see Routes (static) but not Rides (dynamic)

## Summary

Navigation cleanup complete. The distinction between `/routes` (static discovery) and `/rides` (dynamic user rides) is now clear, and the labeling avoids implying duplicate features. The MVP is clean and ready for Phase 3.3.2 (Ride Detail + Join/Leave).
