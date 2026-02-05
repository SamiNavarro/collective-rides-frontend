# Phase 3.3.4: Ride Management (Edit/Cancel)

**Status:** Ready for Review  
**Phase:** 3.3.4 - Ride Management UI  
**Dependencies:** Phase 3.3.3 (Create Ride) ✅  
**Blocks:** None (Enhancement phase)

---

## Overview

Enable ride creators and club leadership to manage rides after creation. This phase adds essential ride management capabilities: editing ride details before the ride starts and cancelling rides with proper participant notification.

**Scope:** Lightweight management features only - edit and cancel. No advanced features.

**Philosophy:** Keep it minimal. If it's not essential for managing a ride's lifecycle, it doesn't belong here.

---

## User Stories

### US-1: Edit Ride Details (Before Start)
**As a** ride creator or club leader  
**I want to** edit ride details before the ride starts  
**So that** I can correct mistakes or update logistics

**Acceptance Criteria:**
- AC-1.1: Ride creator can edit their own rides
- AC-1.2: Club leadership can edit any club ride
- AC-1.3: Only editable before ride start time
- AC-1.4: Cannot edit after ride has started
- AC-1.5: Cannot edit completed or cancelled rides
- AC-1.6: Edit button visible on ride detail page
- AC-1.7: Form pre-populated with current values
- AC-1.8: Validation same as create ride
- AC-1.9: Success toast notification
- AC-1.10: Participants see updated details immediately

### US-2: Cancel Ride
**As a** ride creator or club leader  
**I want to** cancel a ride  
**So that** participants know the ride won't happen

**Acceptance Criteria:**
- AC-2.1: Ride creator can cancel their own rides
- AC-2.2: Club leadership can cancel any club ride
- AC-2.3: Can cancel draft or published rides
- AC-2.4: Cannot cancel active, completed, or already cancelled rides
- AC-2.5: Confirmation dialog with reason field
- AC-2.6: Reason is optional but recommended
- AC-2.7: Cancelled rides show "Cancelled" badge
- AC-2.8: Cancelled rides remain visible (not deleted)
- AC-2.9: Participants can still view cancelled ride details
- AC-2.10: Success toast notification
- AC-2.11: Ride status updated immediately (notifications deferred to Phase 3.1)

### US-3: View Cancelled Rides
**As a** club member  
**I want to** see cancelled rides in my history  
**So that** I have a record of what was planned

**Acceptance Criteria:**
- AC-3.1: Cancelled rides excluded from default "Upcoming" list
- AC-3.2: Cancelled rides visible when filter includes cancelled status
- AC-3.3: Cancelled rides show cancellation reason
- AC-3.4: Cancelled rides show who cancelled and when
- AC-3.5: Cannot join cancelled rides
- AC-3.6: Cannot edit cancelled rides
- AC-3.7: Cancelled badge visible on ride cards and detail page

---

## Technical Specification

### Backend Capabilities (Already Exist)

**Phase 2.3 implemented these endpoints:**

#### Update Ride
```
PUT /v1/clubs/{clubId}/rides/{rideId}
Authorization: Bearer {token}
```

**Authorization:**
- Ride creator (any status before start)
- Club leadership (Owner, Admin, Ride Captain, Ride Leader)

**Business Rules:**
- Can only edit rides with status: `draft` or `published`
- Cannot edit `active`, `completed`, or `cancelled` rides
- Cannot edit rides after start time has passed
- All fields optional (partial updates supported)

#### Cancel Ride
```
DELETE /v1/clubs/{clubId}/rides/{rideId}
Authorization: Bearer {token}

Request Body:
{
  "reason": "Weather conditions unsafe for cycling"
  // notifyParticipants: backend may accept this field but notifications not implemented until Phase 3.1
}
```

**Authorization:**
- Ride creator (own rides only)
- Club leadership (any ride)

**Business Rules:**
- Can cancel rides with status: `draft` or `published`
- Cannot cancel `active`, `completed`, or already `cancelled` rides
- Ride status changes to `cancelled`
- Ride remains in database (soft delete)
- Cancellation reason stored
- Participant notifications deferred to Phase 3.1 (notification system)

### Frontend Implementation

#### 1. Edit Ride Page

**Location:** `app/clubs/[clubId]/rides/[rideId]/edit/page.tsx`

**Route:** `/clubs/[clubId]/rides/[rideId]/edit`

**Authorization Check:**
```typescript
const canEdit = useMemo(() => {
  if (!ride || !membership) return false;
  
  // Cannot edit after start time
  if (new Date(ride.startDateTime) <= new Date()) return false;
  
  // Cannot edit completed or cancelled rides
  if (['completed', 'cancelled', 'active'].includes(ride.status)) return false;
  
  // Ride creator can edit
  if (ride.createdBy === user?.userId) return true;
  
  // Leadership can edit
  const leadershipRoles = ['owner', 'admin', 'ride_captain', 'ride_leader'];
  return leadershipRoles.includes(membership.membershipRole);
}, [ride, membership, user]);
```

**Component Structure:**
```typescript
export default function EditRidePage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params.clubId as string;
  const rideId = params.rideId as string;
  
  const { data: ride, isLoading } = useRide(clubId, rideId);
  const { data: myClubs } = useMyClubs();
  const updateRide = useUpdateRide();
  
  const membership = myClubs?.find(c => c.clubId === clubId);
  const canEdit = /* authorization check */;
  
  if (!canEdit) {
    return <ErrorPage message="You don't have permission to edit this ride" />;
  }
  
  const handleSubmit = async (data: UpdateRideRequest) => {
    await updateRide.mutateAsync({ clubId, rideId, data });
    router.push(`/clubs/${clubId}/rides/${rideId}`);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Edit Ride</h1>
          <RideForm
            clubId={clubId}
            canPublish={false} // Cannot change publish status when editing
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            isSubmitting={updateRide.isPending}
            initialData={ride} // Pre-populate form
            mode="edit"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

#### 2. Enhanced Ride Form Component

**Modify:** `components/rides/ride-form.tsx`

**Add Props:**
```typescript
interface RideFormProps {
  clubId: string;
  canPublish: boolean;
  onSubmit: (data: CreateRideRequest | UpdateRideRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialData?: RideDetail; // NEW: For edit mode
  mode?: 'create' | 'edit'; // NEW: Form mode
}
```

**Form Initialization:**
```typescript
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<FormData>({
  defaultValues: mode === 'edit' && initialData ? {
    title: initialData.title,
    description: initialData.description,
    startDate: initialData.startDateTime.split('T')[0],
    startTime: initialData.startDateTime.split('T')[1].substring(0, 5),
    estimatedDuration: initialData.estimatedDuration,
    maxParticipants: initialData.maxParticipants,
    meetingPoint: initialData.meetingPoint,
    route: initialData.route,
  } : {
    estimatedDuration: 120,
  },
});
```

**Conditional Fields:**
```typescript
// Hide publish checkbox in edit mode
{canPublish && mode === 'create' && (
  <div className="flex items-center space-x-2">
    <Checkbox
      id="publishImmediately"
      checked={publishImmediately}
      onCheckedChange={(checked) => setPublishImmediately(checked as boolean)}
    />
    <Label htmlFor="publishImmediately">
      Publish immediately
    </Label>
  </div>
)}
```

**Submit Button Text:**
```typescript
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {mode === 'edit' ? 'Save Changes' : (publishImmediately ? 'Publish Ride' : 'Save Draft')}
</Button>
```

#### 3. Edit Button on Ride Detail Page

**Modify:** `app/clubs/[clubId]/rides/[rideId]/page.tsx`

**Add Edit Button:**
```typescript
{canEdit && (
  <Link href={`/clubs/${clubId}/rides/${rideId}/edit`}>
    <Button variant="outline" size="lg">
      <Edit className="h-4 w-4 mr-2" />
      Edit Ride
    </Button>
  </Link>
)}
```

**Authorization Logic:**
```typescript
const canEdit = useMemo(() => {
  if (!ride || !membership) return false;
  
  // Cannot edit after start time
  if (new Date(ride.startDateTime) <= new Date()) return false;
  
  // Cannot edit completed or cancelled rides
  if (['completed', 'cancelled', 'active'].includes(ride.status)) return false;
  
  // Ride creator can edit
  if (ride.createdBy === user?.userId) return true;
  
  // Leadership can edit
  const leadershipRoles = ['owner', 'admin', 'ride_captain', 'ride_leader'];
  return leadershipRoles.includes(membership.membershipRole);
}, [ride, membership, user]);
```

#### 4. Cancel Ride Dialog

**Add to:** `app/clubs/[clubId]/rides/[rideId]/page.tsx`

**Cancel Button:**
```typescript
{canCancel && (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="destructive" size="lg">
        <XCircle className="h-4 w-4 mr-2" />
        Cancel Ride
      </Button>
    </AlertDialogTrigger>
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
)}
```

**Authorization Logic:**
```typescript
const canCancel = useMemo(() => {
  if (!ride || !membership) return false;
  
  // Can only cancel draft or published rides
  if (!['draft', 'published'].includes(ride.status)) return false;
  
  // Ride creator can cancel
  if (ride.createdBy === user?.userId) return true;
  
  // Leadership can cancel
  const leadershipRoles = ['owner', 'admin', 'ride_captain', 'ride_leader'];
  return leadershipRoles.includes(membership.membershipRole);
}, [ride, membership, user]);
```

**Cancel Handler:**
```typescript
const [cancelReason, setCancelReason] = useState('');
const cancelRide = useCancelRide();

const handleCancelRide = async () => {
  try {
    await cancelRide.mutateAsync({
      clubId,
      rideId,
      reason: cancelReason || undefined,
    });
    // Stay on page to show cancelled state
  } catch (error) {
    console.error('Failed to cancel ride:', error);
  }
};
```

#### 5. Cancelled Ride Badge

**Add to:** `app/clubs/[clubId]/rides/[rideId]/page.tsx`

**Status Badge:**
```typescript
{ride.status === 'cancelled' && (
  <Badge variant="destructive" className="text-lg px-4 py-1">
    Cancelled
  </Badge>
)}
```

**Cancellation Details:**
```typescript
{ride.status === 'cancelled' && ride.cancellationReason && (
  <Card className="border-destructive">
    <CardHeader>
      <CardTitle className="text-destructive">Ride Cancelled</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground mb-2">{ride.cancellationReason}</p>
      {ride.cancelledBy && ride.cancelledAt && (
        <p className="text-sm text-muted-foreground">
          Cancelled by {ride.cancelledByName || 'organizer'} on{' '}
          {new Date(ride.cancelledAt).toLocaleDateString()}
        </p>
      )}
    </CardContent>
  </Card>
)}
```

**Disable Actions:**
```typescript
// Hide join/leave buttons for cancelled rides
{ride.status !== 'cancelled' && (
  // ... join/leave buttons
)}
```

#### 6. React Query Hooks

**Add to:** `hooks/use-rides.ts`

**Update Ride Hook:**
```typescript
export const useUpdateRide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      clubId, 
      rideId, 
      data 
    }: { 
      clubId: string; 
      rideId: string; 
      data: UpdateRideRequest 
    }) => {
      const response = await api.rides.update(clubId, rideId, data);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update ride');
      }
      return response.data;
    },
    onSuccess: (data, { clubId, rideId }) => {
      // Invalidate ride detail and lists
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'rides', rideId] });
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'rides'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      
      toast({
        title: 'Ride Updated',
        description: 'Your changes have been saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Update Ride',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
};
```

**Cancel Ride Hook:**
```typescript
export const useCancelRide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      clubId, 
      rideId, 
      reason 
    }: { 
      clubId: string; 
      rideId: string; 
      reason?: string 
    }) => {
      const response = await api.rides.cancel(clubId, rideId, { reason });
      if (!response.success) {
        throw new Error(response.error || 'Failed to cancel ride');
      }
      return response.data;
    },
    onSuccess: (data, { clubId, rideId }) => {
      // Invalidate ride detail and lists
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'rides', rideId] });
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'rides'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      
      toast({
        title: 'Ride Cancelled',
        description: 'Ride cancelled. Members will see the updated status.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Cancel Ride',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
};
```

#### 7. API Client Methods

**Add to:** `lib/api/api-client.ts`

```typescript
rides: {
  // ... existing methods
  
  update: (clubId: string, rideId: string, data: UpdateRideRequest) =>
    apiClient.put(`/v1/clubs/${clubId}/rides/${rideId}`, data),
  
  cancel: (clubId: string, rideId: string, data: { reason?: string }) =>
    apiClient.delete(`/v1/clubs/${clubId}/rides/${rideId}`, { data }),
}
```

#### 8. Type Definitions

**Add to:** `lib/types/rides.ts`

```typescript
export interface UpdateRideRequest {
  title?: string;
  description?: string;
  rideType?: RideType;
  difficulty?: RideDifficulty;
  startDateTime?: string;
  estimatedDuration?: number;
  maxParticipants?: number;
  meetingPoint?: {
    name?: string;
    address?: string;
    instructions?: string;
  };
  route?: {
    name?: string;
    type?: 'basic';
    distance?: number;
    difficulty?: RideDifficulty;
  };
}

export interface CancelRideRequest {
  reason?: string;
  // notifyParticipants field omitted - notifications not implemented until Phase 3.1
}
```

---

## Cancelled Ride Listing Behavior

**Default Behavior:**
- Default ride listings show only `published` rides (upcoming)
- Cancelled rides excluded from default view
- Prevents clutter and user confusion

**Filtered View:**
- User can explicitly filter to include cancelled rides
- Cancelled rides appear with prominent "Cancelled" badge
- Useful for historical reference and record-keeping

**Implementation:**
```typescript
// Default query excludes cancelled
const { data: rides } = useRides(clubIds, {
  status: 'published', // Excludes cancelled
  startDate: new Date().toISOString(),
});

// Explicit filter can include cancelled
const { data: rides } = useRides(clubIds, {
  status: filters.includeCancelled ? undefined : 'published',
  startDate: filters.startDate,
});
```

---

## UI/UX Considerations

### Edit Ride Flow

1. User clicks "Edit Ride" button on ride detail page
2. Navigate to `/clubs/[clubId]/rides/[rideId]/edit`
3. Form pre-populated with current values
4. User makes changes
5. Click "Save Changes"
6. Navigate back to ride detail page
7. Toast notification confirms success

### Cancel Ride Flow

1. User clicks "Cancel Ride" button on ride detail page
2. Confirmation dialog appears
3. User optionally enters cancellation reason
4. Click "Cancel Ride" to confirm
5. Dialog closes
6. Ride detail page updates to show cancelled status
7. Toast notification confirms cancellation

### Cancelled Ride Display

**Visual Indicators:**
- Red "Cancelled" badge prominently displayed
- Cancellation reason shown in alert card
- Join/Leave buttons hidden
- Edit button hidden
- Cancel button hidden
- Participant list still visible (historical record)

**Information Displayed:**
- Cancellation reason (if provided)
- Who cancelled the ride
- When it was cancelled
- Original ride details (for reference)

---

## Update Semantics

**UI Behavior:**
- Form submits full normalized payload (all fields from form state)
- Empty optional fields sent as `undefined` (not included in request)
- Backend treats request as partial update (only updates provided fields)
- UI does not rely on partial update behavior - always sends complete form state

**Why Full Payload:**
- Simpler form logic (no field-level dirty tracking)
- Avoids "field cleared because user left it empty" bugs
- Backend handles partial update semantics transparently
- Form pre-population ensures all fields have values

**Example:**
```typescript
// Form always sends complete state
const handleSubmit = async (data: FormData) => {
  const submitData: UpdateRideRequest = {
    title: data.title,
    description: data.description || '', // Empty string, not undefined
    rideType,
    difficulty,
    startDateTime: `${data.startDate}T${data.startTime}:00.000Z`,
    estimatedDuration: data.estimatedDuration,
    maxParticipants: data.maxParticipants || undefined,
    meetingPoint: data.meetingPoint,
    route: data.route?.name ? data.route : undefined,
  };
  
  await updateRide.mutateAsync({ clubId, rideId, data: submitData });
};
```

---

## Implementation Notes

### Timezone Handling
- Backend stores UTC timestamps (ISO 8601 format)
- Frontend compares using `new Date()` which handles local timezone
- Comparison: `new Date(ride.startDateTime) <= new Date()` is timezone-safe
- Both sides convert to UTC for comparison

### API Client DELETE with Body
- Verify `apiClient.delete()` forwards request config correctly
- Axios syntax: `axios.delete(url, { data: { reason } })`
- If wrapper doesn't support body, use POST to `/cancel` endpoint instead
- Test cancel request includes reason in backend logs

### Dialog State Management
- Cancel reason state scoped inside dialog component
- State resets when dialog closes (`onOpenChange`)
- Prevents stale reason text on re-open
- Example:
```typescript
<AlertDialog onOpenChange={(open) => {
  if (!open) setCancelReason(''); // Reset on close
}}>
```

---

## What NOT to Build

**Explicitly out of scope for 3.3.4:**

❌ **Participant notifications** - Phase 3.1 feature (notification system)  
❌ **Edit history/audit log** - Nice-to-have, later  
❌ **Undo cancellation** - Cancelled is final state  
❌ **Reschedule ride** - Create new ride instead  
❌ **Bulk edit multiple rides** - Not in MVP scope  
❌ **Edit ride after start** - Business rule: no editing after start  
❌ **Delete ride permanently** - Soft delete only (cancelled status)  
❌ **Transfer ride ownership** - Phase 3.4+ feature  
❌ **Duplicate/clone ride** - Nice-to-have, later  
❌ **Edit participant list** - Separate feature, later  
❌ **Change ride status manually** - Status transitions are automatic  

**Rule:** If it's not essential for basic ride lifecycle management, it doesn't belong here.

---

## Implementation Order

**Low-risk sequence:**

1. **API Client Methods** (30 minutes)
   - Add update and cancel methods
   - Type definitions
   - No UI changes yet

2. **React Query Hooks** (30 minutes)
   - useUpdateRide hook
   - useCancelRide hook
   - Cache invalidation
   - Toast notifications

3. **Enhance Ride Form** (1 hour)
   - Add initialData prop
   - Add mode prop
   - Pre-populate form in edit mode
   - Conditional rendering for edit mode
   - Test with existing create flow

4. **Edit Ride Page** (1 hour)
   - Create edit page component
   - Authorization checks
   - Form integration
   - Navigation handling

5. **Cancel Ride Dialog** (1 hour)
   - Add cancel button to ride detail
   - Confirmation dialog
   - Reason input field
   - Cancel handler

6. **Cancelled Ride Display** (30 minutes)
   - Cancelled badge
   - Cancellation details card
   - Hide action buttons
   - Update ride card component

7. **Polish** (30 minutes)
   - Loading states
   - Error handling
   - Mobile responsiveness
   - Toast notifications

**Total Estimate:** 5-6 hours

---

## Edge Cases & Error Handling

### Edit Ride Errors

**Cannot Edit After Start:**
- Show error message: "Cannot edit ride after start time"
- Redirect to ride detail page
- Hide edit button if ride has started

**Cannot Edit Cancelled Ride:**
- Show error message: "Cannot edit cancelled rides"
- Hide edit button for cancelled rides

**Concurrent Edits:**
- Backend may return 409 Conflict if ride was modified
- Show error: "Ride was updated by someone else. Please refresh and try again."
- Reload ride data
- Note: Optimistic locking not implemented in Phase 2.3 - handle 409 generically

**Validation Errors:**
- Same validation as create ride
- Show inline error messages
- Highlight invalid fields

### Cancel Ride Errors

**Cannot Cancel Active Ride:**
- Show error: "Cannot cancel ride that has already started"
- Hide cancel button for active rides

**Cannot Cancel Completed Ride:**
- Show error: "Cannot cancel completed rides"
- Hide cancel button for completed rides

**Already Cancelled:**
- Show error: "Ride is already cancelled"
- Hide cancel button for cancelled rides

**Authorization Errors:**
- 401: Redirect to login
- 403: Show "Insufficient privileges" message
- Handle token expiration gracefully

### Network Errors

**Update Failed:**
- Show retry button
- Preserve form state
- Clear error messaging
- Don't lose user's changes

**Cancel Failed:**
- Show retry button
- Keep dialog open
- Preserve reason text
- Clear error messaging

---

## Testing Checklist

### Manual Testing

**Edit Ride Flow:**
- [ ] Edit button visible to ride creator
- [ ] Edit button visible to club leadership
- [ ] Edit button hidden for non-authorized users
- [ ] Edit button hidden after ride start
- [ ] Edit button hidden for cancelled rides
- [ ] Form pre-populated with current values
- [ ] All fields editable
- [ ] Validation works correctly
- [ ] Save changes updates ride
- [ ] Navigate back to ride detail
- [ ] Toast notification appears

**Cancel Ride Flow:**
- [ ] Cancel button visible to ride creator
- [ ] Cancel button visible to club leadership
- [ ] Cancel button hidden for non-authorized users
- [ ] Cancel button hidden for active rides
- [ ] Cancel button hidden for completed rides
- [ ] Cancel button hidden for already cancelled rides
- [ ] Confirmation dialog appears
- [ ] Reason field optional
- [ ] Cancel updates ride status
- [ ] Cancelled badge appears
- [ ] Cancellation details shown
- [ ] Join/Leave buttons hidden
- [ ] Toast notification appears

**Cancelled Ride Display:**
- [ ] Cancelled badge visible
- [ ] Cancellation reason shown (if provided)
- [ ] Cancelled by and date shown
- [ ] Original ride details visible
- [ ] Cannot join cancelled ride
- [ ] Cannot edit cancelled ride
- [ ] Cannot cancel again
- [ ] Participant list still visible

**Edge Cases:**
- [ ] Cannot edit after start time
- [ ] Cannot edit cancelled ride
- [ ] Cannot cancel active ride
- [ ] Cannot cancel completed ride
- [ ] Network error handled
- [ ] Authorization enforced
- [ ] Mobile responsive

### Backend Verification

- [ ] PUT /v1/clubs/{clubId}/rides/{rideId} works
- [ ] DELETE /v1/clubs/{clubId}/rides/{rideId} works
- [ ] Authorization enforced correctly
- [ ] Cannot edit after start time
- [ ] Cannot edit cancelled rides
- [ ] Cannot cancel active/completed rides
- [ ] Cancellation reason stored
- [ ] Ride status updated correctly

---

## Success Criteria

**Phase 3.3.4 is complete when:**

1. ✅ Ride creators can edit their rides before start
2. ✅ Club leadership can edit any ride before start
3. ✅ Cannot edit rides after start time
4. ✅ Cannot edit cancelled or completed rides
5. ✅ Ride creators can cancel their rides
6. ✅ Club leadership can cancel any ride
7. ✅ Cancellation reason captured (optional)
8. ✅ Cancelled rides display correctly
9. ✅ Authorization rules enforced
10. ✅ Error states handled gracefully
11. ✅ Mobile responsive

**Time estimate:** 5-6 focused hours

---

## Next Phase

**Phase 3.3.5: Ride Filters & Search (Optional Enhancement)**
- Advanced ride filtering
- Search by title/description
- Date range selection
- Distance/difficulty filters
- Save filter preferences

**OR**

**Phase 3.4: Notifications & Communication**
- Email notifications for ride updates
- Push notifications
- In-app notification center
- Ride chat/comments

---

## Notes

- Backend endpoints already exist and work (tested in Phase 2.3)
- Keep UI simple - resist feature creep
- Focus on essential management only
- Mobile-first design
- Clear feedback at every step
- Cancelled rides are soft-deleted (remain visible)

---

## Files to Create/Modify

### New Files
- `app/clubs/[clubId]/rides/[rideId]/edit/page.tsx` - Edit ride page

### Modified Files
- `components/rides/ride-form.tsx` - Add edit mode support
- `app/clubs/[clubId]/rides/[rideId]/page.tsx` - Add edit/cancel buttons and cancelled display
- `hooks/use-rides.ts` - Add useUpdateRide and useCancelRide hooks
- `lib/api/api-client.ts` - Add update() and cancel() methods
- `lib/types/rides.ts` - Add UpdateRideRequest and CancelRideRequest types
- `components/rides/ride-card.tsx` - Add cancelled badge display (optional)

---

## Dependencies

**Required:**
- Phase 3.3.3 complete (create ride functionality exists)
- Backend endpoints tested and working
- Authorization system in place

**Optional:**
- Phase 3.1 (Notifications) - for participant notifications
- Phase 3.4 (Audit log) - for edit history tracking

---

## Risk Mitigation

**Form Complexity:**
- Reuse existing RideForm component
- Add mode prop for create vs edit
- Minimal changes to existing code

**Authorization Confusion:**
- Clear visual indicators for who can edit/cancel
- Hide buttons from non-authorized users
- Show helpful error messages

**Cancelled Ride UX:**
- Clear visual distinction (red badge)
- Show cancellation details prominently
- Keep ride visible for historical record
- Disable all actions (join, edit, cancel)

**Mobile UX:**
- Test on mobile devices early
- Ensure buttons are accessible
- Confirmation dialogs mobile-friendly

---

## Post-Implementation

After Phase 3.3.4 is complete:

1. Test complete ride lifecycle (create → edit → cancel)
2. Verify authorization rules work correctly
3. Test on mobile devices
4. Gather user feedback
5. Document any issues
6. Plan next enhancement phase

---

**Ready for Implementation:** ✅  
**Estimated Duration:** 5-6 hours  
**Complexity:** Low (backend exists, UI additions only)  
**Priority:** Medium (Enhancement, not blocker)
