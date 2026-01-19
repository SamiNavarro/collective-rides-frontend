# Phase 3.2.3 - Vercel Testing Guide

## Current Status
✅ Backend CORS fix deployed (all 40 Lambda functions updated)
✅ Frontend auto-deployed to Vercel
⏳ Awaiting user login to verify pending applications visibility

## Test Credentials
- **Email**: `testuser2@test.com`
- **Password**: `TestPassword123!`
- **User ID**: `512be5a0-f031-701c-787e-15a05bbb0ad1`

## Expected Application
- **Club**: Pastries.cc
- **Status**: Pending
- **Applied**: During previous testing session

## Testing Steps

### 1. Sign In on Vercel
1. Go to: https://collective-rides-frontend.vercel.app
2. Click "Sign In" button
3. Enter credentials:
   - Email: `testuser2@test.com`
   - Password: `TestPassword123!`
4. Click "Sign In"

### 2. Verify Authentication
After successful login, you should see:
- ✅ Your name in the header (top right)
- ✅ "My Clubs" link in navigation
- ✅ No "Sign In" button (replaced with user menu)

### 3. Check My Clubs Page
1. Click "My Clubs" in the navigation
2. Expected to see:
   - **Pending Applications section** with orange background
   - **Pastries.cc** listed with:
     - "Pending Approval" badge
     - Application date
     - "View Club" button

### 4. Verify No CORS Errors
1. Open browser DevTools (F12)
2. Go to Console tab
3. Should NOT see:
   - ❌ "Access to fetch... has been blocked by CORS policy"
   - ❌ "No 'Access-Control-Allow-Origin' header"
4. Should see:
   - ✅ Successful API calls to backend
   - ✅ User data loaded
   - ✅ Clubs data loaded

## What Changed (CORS Fix)

### Backend Changes
**File**: `backend/shared/utils/lambda-utils.ts`
- Added `getCorsHeaders(origin?: string)` function
- Returns specific origin instead of wildcard (`*`)
- Added `Access-Control-Allow-Credentials: true`
- Supports:
  - `http://localhost:3000` (development)
  - `https://collective-rides-frontend.vercel.app` (production)
  - `https://*.vercel.app` (preview deployments)

**File**: `backend/services/club-service/handlers/user/get-user-clubs.ts`
- Updated to pass origin to CORS headers
- Properly handles preflight OPTIONS requests

### Frontend Changes
**File**: `contexts/auth-context.tsx`
- Fetches all clubs (no status filter to avoid CORS with query params)
- Separates active/pending client-side
- Populates `user.clubApplications` array

**File**: `app/my-clubs/page.tsx`
- Displays pending applications in orange card
- Shows "Pending Approval" badge
- Includes application date

## Troubleshooting

### If Still Seeing CORS Errors
1. Check browser console for exact error
2. Verify backend deployment completed successfully
3. Try hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
4. Clear browser cache

### If Not Seeing Pending Application
1. Verify you're logged in as `testuser2@test.com`
2. Check browser console for API errors
3. Verify application exists in database:
   ```bash
   aws dynamodb query \
     --table-name sydney-cycles-main-development \
     --key-condition-expression "PK = :pk" \
     --expression-attribute-values '{":pk":{"S":"USER#512be5a0-f031-701c-787e-15a05bbb0ad1"}}' \
     --region us-east-2
   ```

### If Login Fails
1. Verify credentials are correct
2. Check if user needs email verification
3. Try password reset if needed

## Success Criteria
✅ Login successful on Vercel
✅ No CORS errors in console
✅ Pending application to Pastries.cc visible in My Clubs
✅ Application shows correct status and date
✅ Can navigate to club detail page

## Next Steps After Verification
Once pending applications are confirmed visible:
1. Test application approval flow (admin side)
2. Test application rejection flow
3. Document complete user journey
4. Mark Phase 3.2.3 as complete
