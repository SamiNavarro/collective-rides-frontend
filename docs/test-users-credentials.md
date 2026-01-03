# Test Users - Cognito User Pool Credentials

**User Pool ID**: `us-east-2_t5UUpOmPL`  
**Client ID**: `760idnu1d0mul2o10lut6rt7la`  
**Region**: `us-east-2`

## 🔐 Actual User Accounts in Pool

### 1. Collective Rides (Main Account)
- **User ID**: `11bb55f0-a081-7088-fa04-43763b87dbd9`
- **Email**: `collectiveridess@gmail.com`
- **Status**: ✅ Confirmed & Enabled
- **Email Verified**: Yes
- **Purpose**: Main project account

### 2. Test User 2 (Legacy)
- **User ID**: `512be5a0-f031-701c-787e-15a05bbb0ad1`
- **Email**: `testuser2@test.com`
- **Status**: ✅ Confirmed & Enabled
- **Email Verified**: Yes
- **Password**: `TestPassword123!`
- **Purpose**: Legacy test user from earlier phases

### 3. Bob Captain (Role Testing)
- **User ID**: `513bc5e0-d091-70fb-7afa-a7c4a3bee246`
- **Email**: `bob.captain@example.com`
- **Status**: ✅ Confirmed & Enabled
- **Email Verified**: Yes
- **Purpose**: Testing captain/leadership roles

### 4. Test User 1 (Needs Password Reset)
- **User ID**: `517b3570-20e1-7013-d0ac-453bbcc70517`
- **Email**: `testuser1@test.com`
- **Status**: ⚠️ Force Change Password & Enabled
- **Email Verified**: Yes
- **Purpose**: Testing password reset flows

### 5. New User (Unconfirmed)
- **User ID**: `51db7530-c0e1-705f-11a7-7aff498f0451`
- **Email**: `newuser@example.com`
- **Status**: ❌ Unconfirmed & Enabled
- **Email Verified**: No
- **Purpose**: Testing email verification flow

### 6. Admin User (Site Admin)
- **User ID**: `71ab85d0-f0e1-7084-fed3-5f9507ff354a`
- **Email**: `admin@test.com`
- **Status**: ✅ Confirmed & Enabled
- **Email Verified**: Yes
- **Password**: `TestPassword123!`
- **Purpose**: Site administration testing

### 7. Carol Leader (Role Testing)
- **User ID**: `912b45c0-4081-701e-a878-00ff0f427c2d`
- **Email**: `carol.leader@example.com`
- **Status**: ✅ Confirmed & Enabled
- **Email Verified**: Yes
- **Purpose**: Testing ride leader roles

### 8. Sami Navarro (Developer Account)
- **User ID**: `91abd570-20c1-7029-c6d3-f5f1d6d5aa5c`
- **Email**: `saminavarrodev@gmail.com`
- **Status**: ✅ Confirmed & Enabled
- **Email Verified**: Yes
- **Purpose**: Developer testing account

### 9. Test User (Generic)
- **User ID**: `a16b95c0-d021-703a-367a-d1b012b0c2d9`
- **Email**: `testuser@example.com`
- **Status**: ⚠️ Force Change Password & Enabled
- **Email Verified**: Yes
- **Purpose**: Generic testing

### 10. Alice Admin (Admin Testing)
- **User ID**: `b12ba510-80b1-708f-ff85-d56755c2596f`
- **Email**: `alice.admin@example.com`
- **Status**: ✅ Confirmed & Enabled
- **Email Verified**: Yes
- **Purpose**: Admin role testing

## 🔑 Known Passwords

Based on the setup scripts and documentation, these users likely have these passwords:

| Email | Password | Status |
|-------|----------|--------|
| `testuser2@test.com` | `TestPassword123!` | ✅ Ready to use |
| `admin@test.com` | `TestPassword123!` | ✅ Ready to use |
| `bob.captain@example.com` | Unknown - needs password reset | ⚠️ Contact admin |
| `carol.leader@example.com` | Unknown - needs password reset | ⚠️ Contact admin |
| `alice.admin@example.com` | Unknown - needs password reset | ⚠️ Contact admin |
| `collectiveridess@gmail.com` | Unknown - main account | ⚠️ Contact admin |
| `saminavarrodev@gmail.com` | Unknown - developer account | ⚠️ Contact admin |

**Note**: Users with "Force Change Password" status need to reset their password before use.

## 🧪 Testing Scenarios by User Status

### ✅ Ready for Testing (Confirmed & Enabled)
- `collectiveridess@gmail.com` - Main account testing
- `testuser2@test.com` - Standard user testing (Password: `TestPassword123!`)
- `bob.captain@example.com` - Captain role testing
- `admin@test.com` - Admin testing (Password: `TestPassword123!`)
- `carol.leader@example.com` - Leader role testing
- `saminavarrodev@gmail.com` - Developer testing
- `alice.admin@example.com` - Admin role testing

### ⚠️ Need Password Reset
- `testuser1@test.com` - Force change password required
- `testuser@example.com` - Force change password required

### ❌ Need Email Verification
- `newuser@example.com` - Perfect for testing email verification flow!

## 🧪 Testing Commands

### Authentication Testing
```bash
# Test login for confirmed users
curl -X POST https://cognito-idp.us-east-2.amazonaws.com/ \
  -H "Content-Type: application/x-amz-json-1.1" \
  -H "X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth" \
  -d '{
    "ClientId": "760idnu1d0mul2o10lut6rt7la",
    "AuthFlow": "USER_PASSWORD_AUTH",
    "AuthParameters": {
      "USERNAME": "testuser2@test.com",
      "PASSWORD": "TestPassword123!"
    }
  }'
```

### Get JWT Token for API Testing
```bash
# Get token for testuser2 (confirmed user)
TOKEN=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-2_t5UUpOmPL \
  --client-id 760idnu1d0mul2o10lut6rt7la \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=testuser2@test.com,PASSWORD=TestPassword123! \
  --region us-east-2 \
  --query 'AuthenticationResult.AccessToken' \
  --output text)

# Use token for API calls
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/v1/users/me"
```

### Frontend Testing
Use these credentials in the test pages:
- **Main Testing**: `http://localhost:3000/test-cognito`
- **Email Verification**: `http://localhost:3000/test-email-verification`

**Recommended test credentials**:
- Email: `testuser2@test.com`
- Password: `TestPassword123!`

### Email Verification Testing
Perfect user for testing email verification:
- **Email**: `newuser@example.com` (Status: Unconfirmed)
- Use this email to test the complete verification flow

## 🎯 Role-Based Testing

### Site Admins
- **`admin@test.com`** - Site administration (Password: `TestPassword123!`)
- **`alice.admin@example.com`** - Admin role testing

### Leadership Roles
- **`bob.captain@example.com`** - Captain role testing
- **`carol.leader@example.com`** - Leader role testing

### Regular Users
- **`testuser2@test.com`** - Standard user testing (Password: `TestPassword123!`)
- **`collectiveridess@gmail.com`** - Main project account

### Developer/Special Accounts
- **`saminavarrodev@gmail.com`** - Developer testing account

### Testing Specific Flows
- **`newuser@example.com`** - Email verification testing (Unconfirmed)
- **`testuser1@test.com`** - Password reset testing (Force change password)
- **`testuser@example.com`** - Password reset testing (Force change password)

## 📊 Quick Reference Table

| Email | User ID | Status | Email Verified | Best For Testing |
|-------|---------|--------|----------------|------------------|
| `collectiveridess@gmail.com` | `11bb55f0...` | ✅ Confirmed | Yes | Main account features |
| `testuser2@test.com` | `512be5a0...` | ✅ Confirmed | Yes | Standard user flows |
| `bob.captain@example.com` | `513bc5e0...` | ✅ Confirmed | Yes | Captain/leadership roles |
| `testuser1@test.com` | `517b3570...` | ⚠️ Force Reset | Yes | Password reset flows |
| `newuser@example.com` | `51db7530...` | ❌ Unconfirmed | No | Email verification |
| `admin@test.com` | `71ab85d0...` | ✅ Confirmed | Yes | Admin features |
| `carol.leader@example.com` | `912b45c0...` | ✅ Confirmed | Yes | Leader roles |
| `saminavarrodev@gmail.com` | `91abd570...` | ✅ Confirmed | Yes | Developer testing |
| `testuser@example.com` | `a16b95c0...` | ⚠️ Force Reset | Yes | Password reset flows |
| `alice.admin@example.com` | `b12ba510...` | ✅ Confirmed | Yes | Admin role testing |

## 🔄 User Management Commands

### Reset User Password
```bash
# Reset password for users with "Force Change Password" status
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-2_t5UUpOmPL \
  --username testuser1@test.com \
  --password TestPassword123! \
  --permanent \
  --region us-east-2
```

### Confirm User Email
```bash
# Confirm email for unconfirmed users
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id us-east-2_t5UUpOmPL \
  --username newuser@example.com \
  --region us-east-2
```

### List All Users
```bash
aws cognito-idp list-users \
  --user-pool-id us-east-2_t5UUpOmPL \
  --region us-east-2
```

## 🚀 Quick Start Testing

### For Immediate Testing (Ready to Use)
1. **Standard User Testing**: 
   - Email: `testuser2@test.com`
   - Password: `TestPassword123!`
   - Status: ✅ Confirmed & Ready

2. **Admin Testing**:
   - Email: `admin@test.com`
   - Password: `TestPassword123!`
   - Status: ✅ Confirmed & Ready

### For Email Verification Testing
1. **Unconfirmed User**:
   - Email: `newuser@example.com`
   - Status: ❌ Needs email verification
   - Perfect for testing verification flow

### For Password Reset Testing
1. **Force Change Password Users**:
   - `testuser1@test.com`
   - `testuser@example.com`
   - Both need password reset before use

## 🔧 Setup Commands for Testing

### Make Users Ready for Testing
```bash
# Reset passwords for force-change users
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-2_t5UUpOmPL \
  --username testuser1@test.com \
  --password TestPassword123! \
  --permanent \
  --region us-east-2

aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-2_t5UUpOmPL \
  --username testuser@example.com \
  --password TestPassword123! \
  --permanent \
  --region us-east-2
```

### Test Login Immediately
```bash
# Test with confirmed user
curl -X POST https://cognito-idp.us-east-2.amazonaws.com/ \
  -H "Content-Type: application/x-amz-json-1.1" \
  -H "X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth" \
  -d '{
    "ClientId": "760idnu1d0mul2o10lut6rt7la",
    "AuthFlow": "USER_PASSWORD_AUTH",
    "AuthParameters": {
      "USERNAME": "testuser2@test.com",
      "PASSWORD": "TestPassword123!"
    }
  }'
```