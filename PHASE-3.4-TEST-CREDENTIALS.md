# Phase 3.4 Test Credentials - READY TO USE ✅

**All passwords have been reset and verified**  
**All users are CONFIRMED and ready for testing**  
**Alice Admin is now the owner of "Attaquer.cc"**

---

## 🎯 Quick Reference - Copy & Paste Ready

### 1. Club Owner (Full Access) ✅ READY
```
Email: alice.admin@example.com
Password: TempPassword123!
Role: Owner
Club: Attaquer.cc (attaquercc)
Access: ✅ Settings + All Management Tabs
```

**Status**: ✅ Alice is now the owner of "Attaquer.cc"  
**Club ID**: `attaquercc`

### 2. Club Admin (Full Access)
```
Email: admin@test.com
Password: TestPassword123!
Role: Admin
Access: ✅ Settings + All Management Tabs
```

### 3. Ride Captain (Limited Access)
```
Email: bob.captain@example.com
Password: TempPassword123!
Role: Ride Captain
Access: ✅ Members + Draft Rides (NO Settings, NO Requests)
```

### 4. Ride Leader (Limited Access)
```
Email: carol.leader@example.com
Password: TempPassword123!
Role: Ride Leader
Access: ✅ Members + Draft Rides (NO Settings, NO Requests)
```

### 5. Regular Member (No Management Access)
```
Email: testuser2@test.com
Password: TestPassword123!
Role: Member
Access: ❌ No management features (for testing authorization blocks)
```

---

## 📋 Testing Checklist

### Test 1: Owner Full Access
- [ ] Log in as `alice.admin@example.com`
- [ ] Navigate to a club
- [ ] Verify "Settings" button visible
- [ ] Verify "Manage Club" button visible
- [ ] Click Settings - should work
- [ ] Click Manage - should show all 3 tabs

### Test 2: Admin Full Access
- [ ] Log in as `admin@test.com`
- [ ] Navigate to a club
- [ ] Verify "Settings" button visible
- [ ] Verify "Manage Club" button visible
- [ ] Test all management features

### Test 3: Captain Limited Access
- [ ] Log in as `bob.captain@example.com`
- [ ] Navigate to a club
- [ ] Verify "Settings" button NOT visible
- [ ] Verify "Manage Club" button IS visible
- [ ] Click Manage - should show only Members + Draft Rides tabs
- [ ] Requests tab should be hidden

### Test 4: Leader Limited Access
- [ ] Log in as `carol.leader@example.com`
- [ ] Same as Captain test

### Test 5: Member No Access
- [ ] Log in as `testuser2@test.com`
- [ ] Navigate to a club
- [ ] Verify NO management buttons visible
- [ ] Try direct URL access - should get 403

---

## 🚀 Quick Start

1. Open your app: `http://localhost:3000` or production URL
2. Click "Login" or navigate to `/auth/login`
3. Use any credentials above
4. Navigate to a club page
5. Test management features based on role

---

## 🔧 If Login Fails

Run this command to verify user status:
```bash
aws cognito-idp admin-get-user \
  --user-pool-id us-east-2_t5UUpOmPL \
  --username alice.admin@example.com \
  --region us-east-2
```

Or reset password again:
```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-2_t5UUpOmPL \
  --username alice.admin@example.com \
  --password TempPassword123! \
  --permanent \
  --region us-east-2
```

---

## ✅ Status: ALL USERS READY

All test users have been verified and are ready for Phase 3.4 testing!

**Last Verified**: February 3, 2026  
**User Pool**: us-east-2_t5UUpOmPL  
**Region**: us-east-2
