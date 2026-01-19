# Phase 3.2.3 - Leave Club Implementation Fix

## Issue

After fixing the CORS error, the leave club functionality was failing with a 500 Internal Server Error:

```
❌ useLeaveClub: API error: INTERNAL_ERROR Status: 500
```

## Root Cause

CloudWatch logs revealed the actual error:

```
Error: updateMembershipStatus not fully implemented
    at DynamoDBMembershipRepository.updateMembershipStatus
    at DynamoDBMembershipRepository.removeMembership
    at MembershipService.leaveClub
```

The `updateMembershipStatus()` method in the membership repository was a stub that threw "not fully implemented" error.

## Solution

### 1. Implemented `updateMembershipStatusByClubAndUser()`

Created a new, more efficient method that updates membership status using clubId and userId (which we have in the leave club flow) instead of requiring a membershipId lookup:

```typescript
async updateMembershipStatusByClubAndUser(
  clubId: string,
  userId: string,
  status: MembershipStatus,
  processedBy?: string,
  reason?: string
): Promise<ClubMembership>
```

**Implementation:**
- Gets existing membership by clubId and userId
- Updates the membership object with new status and metadata
- Uses TransactWrite to atomically update all three DynamoDB items:
  - Canonical item (CLUB#clubId / MEMBER#userId)
  - User index item (USER#userId / MEMBERSHIP#clubId)
  - Club member index item (CLUB#clubId#MEMBERS / ROLE#role#USER#userId)

### 2. Implemented `removeMembershipByClubAndUser()`

Created a convenience method that calls `updateMembershipStatusByClubAndUser()` with status = REMOVED:

```typescript
async removeMembershipByClubAndUser(
  clubId: string,
  userId: string,
  removedBy: string,
  reason?: string
): Promise<ClubMembership>
```

### 3. Updated Membership Service

Changed `leaveClub()` to use the new efficient method:

```typescript
// Before
const updatedMembership = await this.membershipRepository.removeMembership(
  membership.membershipId,
  authContext.userId,
  'Voluntary departure'
);

// After
const updatedMembership = await this.membershipRepository.removeMembershipByClubAndUser(
  clubId,
  authContext.userId,
  authContext.userId,
  'Voluntary departure'
);
```

### 4. Updated Repository Interface

Added the new methods to `IMembershipRepository`:
- `removeMembershipByClubAndUser()`
- `updateMembershipStatusByClubAndUser()`

## Why This Approach?

The original `updateMembershipStatus(membershipId)` method would require:
1. Scanning DynamoDB to find the membership by ID (inefficient)
2. Or adding a GSI on membershipId (infrastructure change)

Since we already have clubId and userId in the leave club flow, using them directly is:
- More efficient (direct key lookup)
- No infrastructure changes needed
- Follows DynamoDB best practices (use partition + sort key when available)

## Files Changed

### Backend
- `backend/services/club-service/infrastructure/dynamodb-membership-repository.ts`
  - Implemented `updateMembershipStatusByClubAndUser()`
  - Implemented `removeMembershipByClubAndUser()`
  - Updated `updateMembershipStatus()` to throw helpful error
  
- `backend/services/club-service/domain/membership/membership-service.ts`
  - Updated `leaveClub()` to use `removeMembershipByClubAndUser()`
  
- `backend/services/club-service/domain/membership/membership-repository.ts`
  - Added interface methods for new functions

## Testing

### CloudWatch Logs Before Fix
```
ERROR Lambda error: Error: updateMembershipStatus not fully implemented
```

### Expected Logs After Fix
```
INFO Membership status updated in DynamoDB
INFO User left club successfully
```

## Deployment

```bash
cd backend
npm run deploy
```

Deployment completed in ~124 seconds.

## Verification Steps

1. Go to https://collective-rides-frontend.vercel.app/my-clubs
2. Login with testuser2@test.com / TestPassword123!
3. Click "Leave Club" on any club
4. Verify:
   - No 500 errors
   - No CORS errors
   - Club disappears from list
   - Success message appears

## Status

✅ Implementation complete
✅ Backend deployed
⏳ Awaiting Vercel testing

## Next Steps

Test on Vercel to confirm leave club now works end-to-end without errors.
