# New User Testing Guide - Collective Rides

## Overview

This guide provides comprehensive testing procedures for the new user experience in the Collective Rides application, from initial signup through exploring all features and functionality.

**Last Updated**: January 2, 2026  
**Version**: 1.0  
**Status**: Ready for Testing

## Testing Environment Setup

### Prerequisites
- Frontend development server running (`npm run dev`)
- Backend API accessible and responding
- Browser with developer tools available
- Clean browser state (no existing localStorage data)

### Quick Setup Commands
```bash
# Start the development server
npm run dev

# Open in browser
# http://localhost:3000

# Clear any existing user data (in browser console)
localStorage.removeItem('sydney-cycles-user')
```

## New User Journey Testing

### Phase 1: Landing Page Experience

#### Test 1.1: First Visit
**Objective**: Test the initial user experience on the homepage

**Steps**:
1. Navigate to `http://localhost:3000`
2. Observe the landing page layout
3. Check header navigation (should show "Sign In" and "Join Community")
4. Scroll through all sections

**Expected Results**:
- ✅ Clean, professional landing page
- ✅ Clear value proposition in hero section
- ✅ Features grid showing app capabilities
- ✅ Popular routes, coffee spots, and cycling clubs sections
- ✅ No authentication required to view content
- ✅ "Join Community" button prominently displayed

#### Test 1.2: Navigation Without Authentication
**Objective**: Test public access to different sections

**Steps**:
1. Click on "Routes" in navigation
2. Click on "Coffee" in navigation  
3. Click on "Clubs" in navigation
4. Click on "Guides" in navigation

**Expected Results**:
- ✅ All public pages accessible
- ✅ Content displays correctly
- ✅ No authentication barriers for public content

### Phase 2: User Registration Process

#### Test 2.1: Signup Flow Initiation
**Objective**: Test the signup process initiation

**Steps**:
1. Click "Join Community" button in header
2. Observe the signup dialog

**Expected Results**:
- ✅ Modal dialog opens with signup form
- ✅ Clear benefits displayed (Local Routes, Find Riders, Coffee Stops, Create Rides)
- ✅ Form fields: Full Name, Email, Password
- ✅ Helpful tooltips on form fields
- ✅ "Start Your Cycling Journey" button

#### Test 2.2: Form Validation
**Objective**: Test form validation and error handling

**Steps**:
1. Try submitting empty form
2. Enter invalid email format
3. Enter very short password
4. Test with valid data

**Test Data**:
```
Valid Test User:
Name: Alex Johnson
Email: alex.johnson@example.com
Password: SecurePass123
```

**Expected Results**:
- ✅ Required field validation works
- ✅ Email format validation
- ✅ Password requirements enforced
- ✅ Clear error messages displayed

#### Test 2.3: Successful Registration
**Objective**: Complete the registration process

**Steps**:
1. Fill form with valid test data
2. Click "Start Your Cycling Journey"
3. Wait for processing
4. Observe redirect behavior

**Expected Results**:
- ✅ Loading state displayed during processing
- ✅ Successful registration (simulated)
- ✅ Automatic redirect to `/hub`
- ✅ User logged in automatically
- ✅ Header shows user avatar and name

### Phase 3: First-Time User Experience

#### Test 3.1: Hub Dashboard
**Objective**: Test the new user's first view of their dashboard

**Steps**:
1. Observe the hub dashboard layout
2. Check for onboarding elements
3. Look for empty states and guidance

**Expected Results**:
- ✅ Welcome message for new user
- ✅ Clear navigation to key features
- ✅ Empty states with helpful guidance
- ✅ Calls-to-action for next steps

#### Test 3.2: Profile Setup
**Objective**: Test profile completion for new users

**Steps**:
1. Navigate to profile settings
2. Add additional profile information
3. Upload avatar (if available)
4. Set preferences

**Expected Results**:
- ✅ Profile form accessible
- ✅ Optional fields clearly marked
- ✅ Preference settings available
- ✅ Changes save successfully

### Phase 4: Core Feature Exploration

#### Test 4.1: Club Discovery and Application
**Objective**: Test the club joining process for new users

**Steps**:
1. Navigate to "Clubs" section
2. Browse available clubs
3. View club details
4. Apply to join a club

**Test Scenario**:
```
Target Club: Sydney Cycling Club
Application Details:
- Experience Level: Beginner
- Motivation: "New to cycling, want to learn from experienced riders"
- Availability: Saturday Morning, Sunday Morning
```

**Expected Results**:
- ✅ Club listings display correctly
- ✅ Club detail pages show comprehensive information
- ✅ Application form is user-friendly
- ✅ Application submitted successfully
- ✅ Status tracked in user profile

#### Test 4.2: Route Exploration
**Objective**: Test route discovery features

**Steps**:
1. Navigate to "Routes" section
2. Browse available routes
3. View route details
4. Save favorite routes (if available)

**Expected Results**:
- ✅ Route listings with difficulty levels
- ✅ Detailed route information
- ✅ Maps and elevation profiles
- ✅ User can interact with route data

#### Test 4.3: Coffee Stop Discovery
**Objective**: Test coffee stop features

**Steps**:
1. Navigate to "Coffee" section
2. Browse coffee stops
3. View detailed information
4. Check location and amenities

**Expected Results**:
- ✅ Coffee stop listings
- ✅ Bike-friendly amenities highlighted
- ✅ Location information accurate
- ✅ User-friendly interface

### Phase 5: User Account Management

#### Test 5.1: Navigation Menu
**Objective**: Test authenticated user navigation

**Steps**:
1. Click on user avatar in header
2. Explore dropdown menu options
3. Test each menu item

**Expected Menu Items**:
- My Hub
- My Clubs  
- My Rides
- Profile
- Favorites
- Activity
- Settings
- Log out

**Expected Results**:
- ✅ All menu items accessible
- ✅ Correct user information displayed
- ✅ Role-based menu items (should show "Rider" for new user)

#### Test 5.2: Settings and Preferences
**Objective**: Test user settings functionality

**Steps**:
1. Navigate to Settings
2. Update notification preferences
3. Modify privacy settings
4. Save changes

**Expected Results**:
- ✅ Settings page loads correctly
- ✅ Current preferences displayed
- ✅ Changes save successfully
- ✅ Confirmation feedback provided

### Phase 6: Mobile Responsiveness

#### Test 6.1: Mobile Navigation
**Objective**: Test mobile user experience

**Steps**:
1. Resize browser to mobile width (375px)
2. Test hamburger menu
3. Navigate through mobile interface
4. Test signup flow on mobile

**Expected Results**:
- ✅ Responsive design works correctly
- ✅ Mobile menu functional
- ✅ Forms usable on mobile
- ✅ Touch interactions work properly

### Phase 7: Data Persistence

#### Test 7.1: Session Management
**Objective**: Test user session persistence

**Steps**:
1. Complete signup and login
2. Refresh the page
3. Close and reopen browser tab
4. Test logout functionality

**Expected Results**:
- ✅ User session persists across page refreshes
- ✅ User data maintained in localStorage
- ✅ Logout clears session data
- ✅ Redirect to homepage after logout

## Automated Testing Scripts

### Script 1: New User Signup Test
```javascript
// Save as: scripts/test-new-user-signup.js
// Run in browser console after starting dev server

const testNewUserSignup = async () => {
  console.log('🧪 Testing New User Signup Flow...\n');
  
  // Test 1: Check if we're on the homepage
  if (window.location.pathname !== '/') {
    console.log('❌ Not on homepage, navigating...');
    window.location.href = '/';
    return;
  }
  
  console.log('✅ On homepage');
  
  // Test 2: Check for Join Community button
  const joinButton = document.querySelector('button:contains("Join Community")') || 
                    Array.from(document.querySelectorAll('button')).find(btn => 
                      btn.textContent.includes('Join Community'));
  
  if (joinButton) {
    console.log('✅ Join Community button found');
  } else {
    console.log('❌ Join Community button not found');
  }
  
  // Test 3: Check localStorage for existing user
  const existingUser = localStorage.getItem('sydney-cycles-user');
  if (existingUser) {
    console.log('⚠️ Existing user found in localStorage');
    console.log('User:', JSON.parse(existingUser).name);
  } else {
    console.log('✅ No existing user - ready for signup test');
  }
  
  // Test 4: Environment variables check
  const envVars = {
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
  };
  
  console.log('\n📋 Environment Check:');
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`${value ? '✅' : '❌'} ${key}: ${value || 'NOT SET'}`);
  });
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Click "Join Community" to test signup flow');
  console.log('2. Fill form with test data:');
  console.log('   Name: Alex Johnson');
  console.log('   Email: alex.johnson@example.com');
  console.log('   Password: SecurePass123');
  console.log('3. Submit and verify redirect to /hub');
};

// Run the test
testNewUserSignup();
```

### Script 2: User Journey Validation
```javascript
// Save as: scripts/test-user-journey.js
// Run in browser console after signup

const testUserJourney = () => {
  console.log('🚀 Testing User Journey...\n');
  
  // Test 1: Check if user is logged in
  const user = localStorage.getItem('sydney-cycles-user');
  if (user) {
    const userData = JSON.parse(user);
    console.log('✅ User logged in:', userData.name);
    console.log('   Email:', userData.email);
    console.log('   Role:', userData.siteRole);
    console.log('   Clubs:', userData.joinedClubs?.length || 0);
  } else {
    console.log('❌ No user found - please sign up first');
    return;
  }
  
  // Test 2: Check current page
  console.log('\n📍 Current Location:', window.location.pathname);
  
  // Test 3: Check for user avatar in header
  const avatar = document.querySelector('[data-testid="user-avatar"]') || 
                document.querySelector('button[class*="avatar"]') ||
                document.querySelector('.avatar');
  
  console.log(avatar ? '✅ User avatar found in header' : '❌ User avatar not found');
  
  // Test 4: Test navigation links
  const navLinks = [
    { path: '/hub', name: 'My Hub' },
    { path: '/my-clubs', name: 'My Clubs' },
    { path: '/rides', name: 'My Rides' },
    { path: '/clubs', name: 'Clubs' },
    { path: '/routes', name: 'Routes' }
  ];
  
  console.log('\n🔗 Testing Navigation:');
  navLinks.forEach(link => {
    const linkElement = Array.from(document.querySelectorAll('a')).find(a => 
      a.getAttribute('href') === link.path);
    console.log(`${linkElement ? '✅' : '❌'} ${link.name} (${link.path})`);
  });
  
  console.log('\n🎯 Manual Tests to Perform:');
  console.log('1. Click user avatar to test dropdown menu');
  console.log('2. Navigate to /clubs and apply to join a club');
  console.log('3. Check /hub for personalized dashboard');
  console.log('4. Test logout functionality');
};

// Run the test
testUserJourney();
```

## Test Data Sets

### New User Profiles
```javascript
const testUsers = [
  {
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    password: "SecurePass123",
    scenario: "Complete beginner, first time cyclist"
  },
  {
    name: "Sarah Chen",
    email: "sarah.chen@example.com", 
    password: "CyclingFan456",
    scenario: "Experienced cyclist, new to Sydney"
  },
  {
    name: "Marcus Thompson",
    email: "marcus.thompson@example.com",
    password: "BikeLife789",
    scenario: "Casual rider, looking for social rides"
  }
];
```

### Club Application Test Data
```javascript
const clubApplications = [
  {
    clubId: "1",
    clubName: "Sydney Cycling Club",
    experience: "Beginner",
    motivation: "New to cycling, want to learn from experienced riders",
    availability: ["Saturday Morning", "Sunday Morning"]
  },
  {
    clubId: "2", 
    clubName: "Eastern Suburbs Cycling Club",
    experience: "Intermediate",
    motivation: "Looking to join group rides and improve my cycling skills",
    availability: ["Saturday Morning", "Sunday Morning", "Weekday Evening"]
  }
];
```

## Expected User Flow

### Successful New User Journey
1. **Landing Page** → User sees value proposition
2. **Signup** → User creates account with valid information
3. **Hub Redirect** → User automatically redirected to personalized dashboard
4. **Profile Setup** → User completes profile information
5. **Club Discovery** → User browses and applies to clubs
6. **Route Exploration** → User discovers cycling routes
7. **Settings Configuration** → User sets preferences
8. **Return Visits** → User session persists across visits

### Key Success Metrics
- ✅ Signup completion rate: 100% with valid data
- ✅ Time to first club application: < 5 minutes
- ✅ Navigation success rate: 100% for all main sections
- ✅ Session persistence: Maintains login across browser sessions
- ✅ Mobile usability: All features work on mobile devices

## Troubleshooting Common Issues

### Issue 1: Signup Form Not Submitting
**Symptoms**: Form doesn't respond to submit button
**Solutions**:
- Check browser console for JavaScript errors
- Verify all required fields are filled
- Check network tab for API calls
- Clear browser cache and try again

### Issue 2: User Not Redirected After Signup
**Symptoms**: Stays on signup form after successful submission
**Solutions**:
- Check browser console for navigation errors
- Verify `/hub` route exists and is accessible
- Check if authentication state is properly set
- Test with different browser

### Issue 3: User Data Not Persisting
**Symptoms**: User logged out after page refresh
**Solutions**:
- Check localStorage in browser dev tools
- Verify localStorage.setItem is working
- Check for localStorage quota issues
- Test in incognito mode

### Issue 4: Mobile Interface Issues
**Symptoms**: Layout broken or unusable on mobile
**Solutions**:
- Test with browser dev tools mobile simulation
- Check CSS media queries
- Verify touch interactions work
- Test on actual mobile device

## Testing Checklist

### Pre-Testing Setup
- [ ] Development server running
- [ ] Backend API accessible
- [ ] Browser dev tools open
- [ ] Clean browser state (no existing user data)

### Signup Flow Testing
- [ ] Landing page loads correctly
- [ ] Join Community button works
- [ ] Signup form displays properly
- [ ] Form validation works
- [ ] Successful signup redirects to hub
- [ ] User data stored in localStorage

### Post-Signup Testing
- [ ] Hub dashboard displays correctly
- [ ] User avatar appears in header
- [ ] Navigation menu works
- [ ] All authenticated routes accessible
- [ ] Club application process works
- [ ] Settings can be updated
- [ ] Logout functionality works

### Cross-Browser Testing
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Mobile browsers

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Color contrast sufficient
- [ ] Focus indicators visible

## Success Criteria

### New User Onboarding Success
- ✅ User can complete signup in under 2 minutes
- ✅ All form validations work correctly
- ✅ User automatically logged in after signup
- ✅ Clear next steps provided in hub dashboard
- ✅ User can apply to join clubs immediately
- ✅ All navigation works without errors

### Technical Success
- ✅ No JavaScript errors in console
- ✅ All API calls succeed (or fail gracefully)
- ✅ Responsive design works on all screen sizes
- ✅ Session persistence works correctly
- ✅ Data validation prevents invalid submissions

---

**Testing Guide Version**: 1.0  
**Last Updated**: January 2, 2026  
**Next Review**: February 2, 2026  
**Maintained By**: Development Team

## Quick Start Testing

To quickly test the new user experience:

1. **Start the app**: `npm run dev`
2. **Clear existing data**: Open browser console and run `localStorage.clear()`
3. **Navigate to**: `http://localhost:3000`
4. **Click**: "Join Community" 
5. **Fill form** with test data and submit
6. **Explore**: Navigate through all sections as a new user

The complete new user journey should be smooth, intuitive, and error-free!