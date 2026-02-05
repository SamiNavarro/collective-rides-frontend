# Phase 3.4 Test Users - Club Administration Testing

**Date**: February 3, 2026  
**Purpose**: Test users with different club roles for Phase 3.4 testing

---

## 🔐 Test Users by Club Role

### 1. Club Owner
**Email**: `alice.admin@example.com`  
**Password**: `TempPassword123!` (may need reset)  
**User ID**: `b12ba510-80b1-708f-ff85-d56755c2596f`  
**Status**: ✅ Confirmed & Enabled  
**Club Role**: Owner  
**Access**:
- ✅ Club Settings page
- ✅ Management Hub (all tabs)
- ✅ Members tab
- ✅ Requests tab
- ✅ Draft Rides tab

**Use For Testing**:
- Full club administration
- Settings page access
- All management features
- Owner-specific permissions

---

### 2. Club Admin
**Email**: `admin@test.com`  
**Password**: `TestPassword123!`  
**User ID**: `71ab85d0-f0e1-7084-fed3-5f9507ff354a`  
**Status**: ✅ Confirmed & Enabled  
**Club Role**: Admin  
**Access**:
- ✅ Club Settings page
- ✅ Management Hub (all tabs)
- ✅ Members tab
- ✅ Requests tab
- ✅ Draft Rides tab

**Use For Testing**:
- Admin-level permissions
- Settings page access
- All management features
- Cannot remove owner

---

### 3. Ride Captain
**Email**: `bob.captain@example.com`  
**Password**: `TempPassword123!` (may need reset)  
**User ID**: `513bc5e0-d091-70fb-7afa-a7c4a3bee246`  
**Status**: ✅ Confirmed & Enabled  
**Club Role**: Ride Captain  
**Access**:
- ❌ Club Settings page (403 error)
- ✅ Management Hub (limited tabs)
- ✅ Members tab
- ❌ Requests tab (hidden)
- ✅ Draft Rides tab

**Use For Testing**:
- Captain-level permissions
- No settings access
- Limited management features
- Draft ride moderation

---

### 4. Ride Leader
**Email**: `carol.leader@example.com`  
**Password**: `TempPassword123!` (may need reset)  
**User ID**: `912b45c0-4081-701e-a878-00ff0f427c2d`  
**Status**: ✅ Confirmed & Enabled  
**Club Role**: Ride Leader  
**Access**:
- ❌ Club Settings page (403 error)
- ✅ Management Hub (limited tabs)
- ✅ Members tab
- ❌ Requests tab (hidden)
- ✅ Draft Rides tab

**Use For Testing**:
- Leader-level permissions
- No settings access
- Limited management features
- Draft ride moderation

---

### 5. Regular Member
**Email**: `testuser2@test.com`  
**Password**: `TestPassword123!`  
**User ID**: `512be5a0-f031-701c-787e-15a05bbb0ad1`  
**Status**: ✅ Confirmed & Enabled  
**Club Role**: Member  
**Access**:
- ❌ Club Settings page (403 error)
- ❌ Management Hub (403 error)
- ❌ Members tab (no access)
- ❌ Requests tab (no access)
- ❌ Draft Rides tab (no access)

**Use For Testing**:
- Member-level permissions
- No management access
- Verify authorization blocks
- Standard user experience

---

### 6. External User (Not a Member)
**Email**: `eve.external@example.com`  
**Password**: `TempPassword123!` (may need reset)  
**Status**: ✅ Confirmed & Enabled  
**Club Role**: None (not a member)  
**Access**:
- ❌ Club Settings page (403 error)
- ❌ Management Hub (403 error)
- ❌ All management features

**Use For Testing**:
- Non-member access
- Verify authorization blocks
- Join club flow

---

## 🔑 Quick Reference Table

| Email | Password | Role | Settings | Manage Hub | Members | Requests | Drafts |
|-------|----------|------|----------|------------|---------|----------|--------|
| `alice.admin@example.com` | `TempPassword123!` | Owner | ✅ | ✅ | ✅ | ✅ | ✅ |
| `admin@test.com` | `TestPassword123!` | Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| `bob.captain@example.com` | `TempPassword123!` | Captain | ❌ | ✅ | ✅ | ❌ | ✅ |
| `carol.leader@example.com` | `TempPassword123!` | Leader | ❌ | ✅ | ✅ | ❌ | ✅ |
| `testuser2@test.com` | `TestPassword123!` | Member | ❌ | ❌ | ❌ | ❌ | ❌ |
| `eve.external@example.com` | `TempPassword123!` | None | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🚀 Setup Instructions

### Step 1: Reset Passwords (If Needed)

Some users may need password reset. Run these commands:

```bash
# Reset alice.admin password
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-2_t5UUpOmPL \
  --username alice.admin@example.com \
  --password TempPassword123! \
  --permanent \
  --region us-east-2

# Reset bob.captain password
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-2_t5UUpOmPL \
  --username bob.captain@example.com \
  --password TempPassword123! \
  --permanent \
  --region us-east-2

# Reset carol.leader password
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-2_t5UUpOmPL \
  --username carol.leader@example.com \
  --password TempPassword123! \
  --permanent \
  --region us-east-2
```

### Step 2: Verify Club Memberships

Check which clubs these users belong to and their roles:

```bash
# Get JWT token for a user
TOKEN=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-2_t5UUpOmPL \
  --client-id 760idnu1d0mul2o10lut6rt7la \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=alice.admin@example.com,PASSWORD=TempPassword123! \
  --region us-east-2 \
  --query 'AuthenticationResult.IdToken' \
  --output text)

# Check user's clubs
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/v1/users/me/clubs"
```

### Step 3: Assign Club Roles (If Needed)

If users don't have the correct club roles, you'll need to:

1. Log in as a club owner
2. Navigate to the club's management hub
3. Go to Members tab
4. Change user roles as needed

Or use the API directly:

```bash
# Update member role (requires owner/admin token)
curl -X PUT \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "ride_captain"}' \
  "https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/v1/clubs/{clubId}/members/{userId}"
```

---

## 🧪 Testing Scenarios

### Scenario 1: Owner Full Access
**User**: `alice.admin@example.com`

1. Log in to the app
2. Navigate to a club you own
3. Verify "Settings" button is visible
4. Click "Settings" - should load successfully
5. Verify "Manage Club" button is visible with badge count
6. Click "Manage Club" - should load successfully
7. Verify all three tabs are visible (Members, Requests, Draft Rides)
8. Test all management features

**Expected**: Full access to everything

---

### Scenario 2: Admin Full Access
**User**: `admin@test.com`

1. Log in to the app
2. Navigate to a club where you're admin
3. Verify "Settings" button is visible
4. Click "Settings" - should load successfully
5. Verify "Manage Club" button is visible
6. Click "Manage Club" - should load successfully
7. Verify all tabs are visible
8. Try to remove the owner - should fail

**Expected**: Full access except can't remove owner

---

### Scenario 3: Captain Limited Access
**User**: `bob.captain@example.com`

1. Log in to the app
2. Navigate to a club where you're captain
3. Verify "Settings" button is NOT visible
4. Try to access `/clubs/{clubId}/settings` directly - should get 403
5. Verify "Manage Club" button IS visible
6. Click "Manage Club" - should load successfully
7. Verify only Members and Draft Rides tabs are visible
8. Requests tab should be hidden
9. Test member viewing and draft ride moderation

**Expected**: Limited access - no settings, no requests tab

---

### Scenario 4: Leader Limited Access
**User**: `carol.leader@example.com`

1. Log in to the app
2. Navigate to a club where you're leader
3. Verify "Settings" button is NOT visible
4. Try to access `/clubs/{clubId}/settings` directly - should get 403
5. Verify "Manage Club" button IS visible
6. Click "Manage Club" - should load successfully
7. Verify only Members and Draft Rides tabs are visible
8. Test member viewing and draft ride moderation

**Expected**: Same as captain - limited access

---

### Scenario 5: Member No Access
**User**: `testuser2@test.com`

1. Log in to the app
2. Navigate to a club where you're a member
3. Verify "Settings" button is NOT visible
4. Verify "Manage Club" button is NOT visible
5. Try to access `/clubs/{clubId}/settings` directly - should get 403
6. Try to access `/clubs/{clubId}/manage` directly - should get 403
7. Verify you can only see public club information

**Expected**: No management access at all

---

### Scenario 6: External User No Access
**User**: `eve.external@example.com`

1. Log in to the app
2. Navigate to a club where you're NOT a member
3. Verify no management buttons are visible
4. Try to access management URLs directly - should get 403
5. Verify you can only see public club information

**Expected**: No management access, can only view public info

---

## 🔧 Troubleshooting

### Issue: User password doesn't work
**Solution**: Run the password reset command from Step 1

### Issue: User doesn't have expected club role
**Solution**: 
1. Check user's memberships via API
2. Update role using management hub or API
3. Verify role change took effect

### Issue: User not a member of any club
**Solution**:
1. Join a club using the app
2. Or use API to add membership
3. Assign appropriate role

### Issue: 403 errors for authorized users
**Solution**:
1. Verify user's membership status is 'active'
2. Check user's role in the club
3. Verify JWT token is valid
4. Check browser console for errors

---

## 📝 Test Results Template

```markdown
## Phase 3.4 Test Results

**Date**: [Date]
**Tester**: [Name]

### Owner Test (alice.admin@example.com)
- [ ] Settings page accessible
- [ ] Management hub accessible
- [ ] All tabs visible
- [ ] Can edit settings
- [ ] Can manage members
- [ ] Can process requests
- [ ] Can moderate drafts

### Admin Test (admin@test.com)
- [ ] Settings page accessible
- [ ] Management hub accessible
- [ ] All tabs visible
- [ ] Can edit settings
- [ ] Can manage members (except owner)
- [ ] Can process requests
- [ ] Can moderate drafts

### Captain Test (bob.captain@example.com)
- [ ] Settings page blocked (403)
- [ ] Management hub accessible
- [ ] Only Members and Draft Rides tabs visible
- [ ] Can view members
- [ ] Can moderate drafts
- [ ] Requests tab hidden

### Leader Test (carol.leader@example.com)
- [ ] Settings page blocked (403)
- [ ] Management hub accessible
- [ ] Only Members and Draft Rides tabs visible
- [ ] Can view members
- [ ] Can moderate drafts
- [ ] Requests tab hidden

### Member Test (testuser2@test.com)
- [ ] Settings button hidden
- [ ] Manage button hidden
- [ ] Direct URL access blocked (403)
- [ ] Can only view public info

### External Test (eve.external@example.com)
- [ ] No management buttons visible
- [ ] Direct URL access blocked (403)
- [ ] Can only view public info

**Overall Result**: [PASS/FAIL]
**Issues Found**: [List any issues]
```

---

## 🎯 Quick Start Commands

### Get All Test Tokens
```bash
cd backend
./scripts/get-test-tokens.sh --save-file
source test-tokens.env
```

### Test API Access
```bash
# Test as admin
curl -X GET \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/v1/users/me/clubs"

# Test as captain
curl -X GET \
  -H "Authorization: Bearer $CAPTAIN_TOKEN" \
  "https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/v1/users/me/clubs"
```

### Frontend Testing
1. Open `http://localhost:3000` or production URL
2. Log in with test user credentials
3. Navigate to a club
4. Test management features based on role

---

**Ready for Testing**: All users are set up and ready for Phase 3.4 testing!
