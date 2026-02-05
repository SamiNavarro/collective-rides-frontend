# Phase 3.3.3: Create Ride

**Status:** Ready for Implementation  
**Phase:** 3.3.3 - Ride Creation  
**Dependencies:** Phase 3.3.2 (Ride Detail + Join/Leave) ✅  
**Blocks:** Phase 3.3.4 (Ride Management)

---

## Overview

Enable club leaders and members to create rides. This phase implements the ride creation workflow, allowing authorized users to propose rides (drafts) and club leadership to publish them as official club events.

**Scope:** MVP ride creation only - simple form, draft/publish workflow, no advanced features.

---

## User Stories

### US-1: Create Draft Ride (Any Member)
**As a** club member  
**I want to** create a draft ride proposal  
**So that** I can suggest rides to my club

**Acceptance Criteria:**
- AC-1.1: Any active club member can create a draft ride
- AC-1.2: Draft rides are visible only to creator and club leadership
- AC-1.3: Form includes all required fields (title, date/time, meeting point)
- AC-1.4: Form includes optional fields (description, route, capacity, requirements)
- AC-1.5: Draft is saved and creator becomes ride captain
- AC-1.6: After save, navigate to ride detail page
- AC-1.7: Clear indication that ride is in draft status

### US-2: Publish Ride (Leadership Only)
**As a** club leader/admin  
**I want to** publish draft rides as official club events  
**So that** all members can discover and join them

**Acceptance Criteria:**
- AC-2.1: Only authorized roles can publish rides (Owner, Admin, Ride Captain, Ride Leader)
- AC-2.2: Publish button visible on draft ride detail page
- AC-2.3: Confirmation dialog before publishing
- AC-2.4: Published rides appear in club ride listings
- AC-2.5: Published rides visible to all club members
- AC-2.6: Toast notification confirms successful publish

### US-3: Create and Publish Immediately (Leadership Only)
**As a** club leader/admin  
**I want to** create and publish a ride in one action  
**So that** I can quickly add official club rides

**Acceptance Criteria:**
- AC-3.1: "Publish immediately" checkbox available to authorized users
- AC-3.2: Ride is created in published status
- AC-3.3: Ride immediately appears in club listings
- AC-3.4: Creator becomes ride captain
- AC-3.5: Navigate to ride detail page after creation

---

## Technical Specification

### Route Structure

**Create Ride URL:**
```
/clubs/[clubId]/rides/new
```

**Entry Points:**
- "Create Ride" button on club detail page (`/clubs/[clubId]`)
- Direct navigation to `/clubs/[clubId]/rides/new`

### Authorization Rules

**Who Can Create Rides:**
- Any active club member (creates draft)
- Draft rides are proposals, not official club events

**Who Can Publish Rides:**
- Club Owner
- Club Admin
- Ride Captain
- Ride Leader

**Visibility Rules:**
- **Draft rides:** Visible only to creator + club leadership
- **Published rides:** Visible to all club members

### Form Fields

#### Required Fields

**Title** (text input)
- Max length: 100 characters
- Example: "Saturday Morning Training Ride"

**Start Date & Time** (date + time picker)
- Must be in the future
- Timezone: User's local timezone
- Format: ISO 8601 string

**Meeting Point** (structured input)
- Name (text): "Cronulla Station"
- Address (text): "Cronulla NSW 2230"
- Coordinates (optional): Latitude/Longitude
- Instructions (textarea, optional): "Meet at main entrance"

#### Optional Fields

**Description** (textarea)
- Max length: 1000 characters
- Markdown support (future enhancement)
- Safety notes, pace expectations, etc.

**Ride Type** (select)
- Options: Training, Social, Competitive, Adventure, Maintenance
- Default: Training (pre-selected)

**Difficulty** (select)
- Options: Beginner, Intermediate, Advanced, Expert
- Default: Intermediate (pre-selected)

**Estimated Duration** (number input)
- In minutes
- Default: 120 (2 hours)

**Maximum Participants** (number input)
- Optional (unlimited if not set)
- Min: 2, Max: 100
- Default: 20

**Route** (route picker - future enhancement)
- For MVP: Simple text input for route name
- Phase 2.4+: Route template picker
- Phase 3.1+: Strava route import

**Requirements** (structured input)
- Equipment (multi-select): Helmet, Water bottle, Spare tube, etc.
- Experience level (select): Beginner, Intermediate, Advanced
- Fitness level (select): Low, Moderate, High

**Allow Waitlist** (checkbox)
- Default: false (waitlist UI/logic deferred to later phase)
- Only relevant if maxParticipants is set
- Hidden in MVP (not implemented yet)

#### Leadership-Only Fields

**Publish Immediately** (checkbox)
- Only visible to authorized users
- Default: false
- If checked, ride created in published status

### Form Validation

**Client-Side Validation:**
- Title: Required, 1-100 characters
- Start date/time: Required, must be in future
- Meeting point name: Required
- Meeting point address: Required
- Duration: Must be positive number
- Max participants: If set, must be >= 2

**Server-Side Validation:**
- All client-side rules enforced
- Authorization check for publish immediately
- Club membership verification
- Duplicate ride detection (optional)

### API Integration

**Create Ride:**
```typescript
POST /v1/clubs/{clubId}/rides
Authorization: Bearer {token}

Request Body:
{
  title: string;
  description?: string;
  rideType: RideType;
  difficulty: RideDifficulty;
  startDateTime: string; // ISO 8601
  estimatedDuration: number; // minutes
  maxParticipants?: number;
  publishImmediately?: boolean; // Leadership only
  meetingPoint: {
    name: string;
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    instructions?: string;
  };
  route?: {
    name: string;
    type: 'basic';
    distance?: number; // meters
    difficulty?: RideDifficulty;
  };
  requirements?: {
    equipment: string[];
    experience: string;
    fitness: string;
  };
  // isPublic: hidden in MVP (not fully supported)
  // allowWaitlist: defaults to false (waitlist UI deferred)
}

Response 201:
{
  success: true;
  data: {
    rideId: string;
    clubId: string;
    title: string;
    status: 'draft' | 'published';
    // ... full ride object
  };
  timestamp: string;
}
```

**Publish Ride:**
```typescript
POST /v1/clubs/{clubId}/rides/{rideId}/publish
Authorization: Bearer {token}

Request Body:
{
  audience?: 'members_only' | 'public_read_only';
  isPublic?: boolean;
  publishMessage?: string;
}

Response 200:
{
  success: true;
  data: {
    rideId: string;
    status: 'published';
    publishedBy: string;
    publishedAt: string;
  };
  timestamp: string;
}
```

### React Query Hooks

**Create Ride Hook:**
```typescript
// hooks/use-rides.ts

export const useCreateRide = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  
  return useMutation({
    mutationFn: async ({ 
      clubId, 
      data 
    }: { 
      clubId: string; 
      data: CreateRideRequest 
    }) => {
      const response = await api.rides.create(clubId, data);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: (ride, { clubId }) => {
      // Invalidate ride lists
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'rides'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      
      // Navigate to ride detail page
      router.push(`/clubs/${clubId}/rides/${ride.rideId}`);
      
      // Show success toast
      toast({
        title: ride.status === 'published' ? 'Ride Published' : 'Draft Saved',
        description: ride.status === 'published' 
          ? 'Your ride is now visible to all club members.'
          : 'Your ride draft has been saved. Publish it to make it visible to members.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Create Ride',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
};
```

**Publish Ride Hook:**
```typescript
export const usePublishRide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      clubId, 
      rideId 
    }: { 
      clubId: string; 
      rideId: string 
    }) => {
      const response = await api.rides.publish(clubId, rideId);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: (data, { clubId, rideId }) => {
      // Invalidate ride detail and lists
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'rides', rideId] });
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'rides'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      
      toast({
        title: 'Ride Published',
        description: 'Your ride is now visible to all club members.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Publish Ride',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
};
```

---

## UI Components

### 1. Create Ride Page

**Location:** `app/clubs/[clubId]/rides/new/page.tsx`

**Layout:**
- Header with club name and "Create Ride" title
- Form with sections:
  - Basic Information (title, type, difficulty)
  - Schedule (date, time, duration)
  - Meeting Point (name, address, instructions)
  - Route (optional, simple for MVP)
  - Requirements (optional)
  - Settings (capacity, waitlist, visibility)
- Footer with action buttons:
  - "Cancel" (navigate back)
  - "Save Draft" (default)
  - "Publish" (leadership only, if publishImmediately checked)

**Form Sections:**

```typescript
// Basic Information
<FormSection title="Basic Information">
  <FormField name="title" label="Ride Title" required />
  <FormField name="rideType" label="Ride Type" type="select" />
  <FormField name="difficulty" label="Difficulty" type="select" />
  <FormField name="description" label="Description" type="textarea" />
</FormSection>

// Schedule
<FormSection title="Schedule">
  <FormField name="startDate" label="Start Date" type="date" required />
  <FormField name="startTime" label="Start Time" type="time" required />
  <FormField name="estimatedDuration" label="Duration (minutes)" type="number" />
</FormSection>

// Meeting Point
<FormSection title="Meeting Point">
  <FormField name="meetingPoint.name" label="Location Name" required />
  <FormField name="meetingPoint.address" label="Address" required />
  <FormField name="meetingPoint.instructions" label="Instructions" type="textarea" />
</FormSection>

// Route (MVP - Simple)
<FormSection title="Route (Optional)">
  <FormField name="route.name" label="Route Name" />
  <FormField name="route.distance" label="Distance (km)" type="number" />
</FormSection>

// Settings
<FormSection title="Settings">
  <FormField name="maxParticipants" label="Maximum Participants" type="number" />
  {/* allowWaitlist hidden - deferred to later phase */}
  {/* isPublic hidden - not fully supported in MVP */}
  {canPublish && (
    <FormField name="publishImmediately" label="Publish Immediately" type="checkbox" />
  )}
</FormSection>
```

### 2. Publish Button (on Ride Detail Page)

**Location:** `app/clubs/[clubId]/rides/[rideId]/page.tsx`

**Visibility:**
- Only shown for draft rides
- Only shown to authorized users (leadership)

**Implementation:**
```typescript
{ride.status === 'draft' && canPublish && (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button size="lg">
        Publish Ride
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Publish this ride?</AlertDialogTitle>
        <AlertDialogDescription>
          This will make the ride visible to all club members and they can start joining.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={handlePublish}>
          Publish Ride
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)}
```

### 3. Draft Status Indicator

**Location:** Ride detail page and ride cards

**Implementation:**
```typescript
{ride.status === 'draft' && (
  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
    Draft
  </Badge>
)}
```

---

## Implementation Order

**Low-risk sequence:**

1. **Form Component** (Day 1 Morning)
   - Create form structure with all fields
   - Implement client-side validation
   - Handle form state with React Hook Form
   - No API integration yet

2. **Create Ride API Integration** (Day 1 Afternoon)
   - Implement useCreateRide hook
   - Connect form to API
   - Handle success/error states
   - Navigate to ride detail after creation

3. **Publish Workflow** (Day 2 Morning)
   - Add publish button to ride detail page
   - Implement usePublishRide hook
   - Add confirmation dialog
   - Handle authorization checks

4. **Polish** (Day 2 Afternoon)
   - Loading states
   - Error messages
   - Form validation feedback
   - Mobile responsiveness
   - Toast notifications

---

## Edge Cases & Error Handling

### Form Validation Errors
- Show inline error messages
- Highlight invalid fields
- Prevent submission until valid
- Clear error messages on fix

### Authorization Errors
- 401: Redirect to login
- 403: Show "Insufficient privileges" message
- Handle token expiration gracefully

### Network Errors
- Show retry button
- Preserve form state
- Clear error messaging
- Don't lose user's work

### Duplicate Rides
- Backend may reject duplicate rides (same title, date, club)
- Show clear error message
- Suggest editing existing ride

### Past Date Selection
- Prevent selecting past dates
- Show clear validation message
- Suggest future dates

---

## What NOT to Build

**Explicitly out of scope for 3.3.3:**

❌ **Multi-step wizard** - Single page form is enough  
❌ **Route file upload** - Phase 2.4 feature  
❌ **Strava route import** - Phase 3.1+ feature  
❌ **Recurring rides** - Phase 3.4+ feature  
❌ **Advanced route editor** - Phase 2.4+ feature  
❌ **Ride templates** - Phase 3.4+ feature  
❌ **Bulk ride creation** - Not in MVP scope  
❌ **Ride cloning** - Nice-to-have, later  
❌ **Draft auto-save** - Nice-to-have, later  

**Rule:** If it doesn't help create a basic ride, it doesn't belong here.

---

## Testing Checklist

### Manual Testing

**Create Draft Flow:**
- [ ] Can create draft ride as regular member
- [ ] All required fields validated
- [ ] Optional fields work correctly
- [ ] Draft saved successfully
- [ ] Navigate to ride detail page
- [ ] Draft badge visible
- [ ] Only creator and leadership can see draft

**Publish Flow:**
- [ ] Publish button visible to leadership only
- [ ] Confirmation dialog appears
- [ ] Ride published successfully
- [ ] Ride appears in club listings
- [ ] All members can see published ride
- [ ] Toast notification appears

**Create and Publish Immediately:**
- [ ] Checkbox visible to leadership only
- [ ] Ride created in published status
- [ ] Ride immediately visible to members
- [ ] Navigate to ride detail page
- [ ] No draft badge shown

**Edge Cases:**
- [ ] Past date rejected
- [ ] Invalid fields show errors
- [ ] Network error handled
- [ ] Authorization enforced
- [ ] Mobile responsive

### Backend Verification

- [ ] POST /v1/clubs/{clubId}/rides works
- [ ] POST /v1/clubs/{clubId}/rides/{rideId}/publish works
- [ ] Authorization enforced correctly
- [ ] Creator becomes captain
- [ ] Draft visibility rules enforced

---

## Success Criteria

**Phase 3.3.3 is complete when:**

1. ✅ Any club member can create draft rides
2. ✅ Club leadership can publish draft rides
3. ✅ Leadership can create and publish in one action
4. ✅ Form validation works correctly
5. ✅ Navigation flow is clear
6. ✅ Authorization rules enforced
7. ✅ Error states handled gracefully
8. ✅ Mobile responsive

**Time estimate:** 2 focused days

---

## Next Phase

**Phase 3.3.4: Ride Management (Edit/Cancel)**
- Edit ride details (before start)
- Cancel rides with participant notification
- Leadership reassignment
- Ride status management

---

## Notes

- Backend endpoints already exist and work (tested in Phase 2.3)
- Keep form simple - resist feature creep
- Focus on happy path first
- Mobile-first design
- Clear feedback at every step
- Draft/publish workflow is key differentiator

---

## Files to Create/Modify

### New Files
- `app/clubs/[clubId]/rides/new/page.tsx` - Create ride page
- `components/rides/ride-form.tsx` - Ride form component
- `components/rides/form-sections/basic-info.tsx` - Basic info section
- `components/rides/form-sections/schedule.tsx` - Schedule section
- `components/rides/form-sections/meeting-point.tsx` - Meeting point section
- `components/rides/form-sections/route.tsx` - Route section (simple)
- `components/rides/form-sections/settings.tsx` - Settings section

### Modified Files
- `hooks/use-rides.ts` - Add useCreateRide and usePublishRide hooks
- `lib/api/api-client.ts` - Add rides.create() and rides.publish() methods
- `app/clubs/[clubId]/rides/[rideId]/page.tsx` - Add publish button for drafts
- `app/clubs/[clubId]/page.tsx` - Add "Create Ride" button
- `lib/types/rides.ts` - Add CreateRideRequest type (if not exists)

---

## Dependencies

**Required:**
- Phase 3.3.2 complete (ride detail page exists)
- Backend endpoints tested and working
- Authorization system in place

**Optional:**
- Route templates (Phase 2.4) - can be added later
- Strava integration (Phase 3.1+) - can be added later

---

## Risk Mitigation

**Form Complexity:**
- Start with required fields only
- Add optional fields incrementally
- Use React Hook Form for state management

**Authorization Confusion:**
- Clear visual indicators for draft vs published
- Hide publish options from non-authorized users
- Show helpful error messages

**Mobile UX:**
- Test on mobile devices early
- Use mobile-friendly date/time pickers
- Ensure form is scrollable and usable

**Data Loss:**
- Consider localStorage backup (future enhancement)
- Show unsaved changes warning (future enhancement)
- For MVP: Accept that refresh loses data

---

## Post-Implementation

After Phase 3.3.3 is complete:

1. Test complete ride creation flow
2. Verify authorization rules
3. Test on mobile devices
4. Gather user feedback
5. Document any issues
6. Plan Phase 3.3.4 (Edit/Cancel)

---

**Ready for Implementation:** ✅  
**Estimated Duration:** 2 days  
**Complexity:** Medium  
**Priority:** High (Core MVP feature)
