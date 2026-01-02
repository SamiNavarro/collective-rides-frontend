# Deployment Checklist: Frontend to Vercel

## Quick Reference Checklist

Use this checklist for rapid deployment validation and troubleshooting.

### Pre-Deployment Setup ✅

#### Repository Preparation
- [ ] Git repository initialized
- [ ] All files committed to main branch
- [ ] GitHub repository created and connected
- [ ] `.env.example` file created with all required variables
- [ ] `.gitignore` includes `.env.local` and other sensitive files

#### Application Configuration
- [ ] `next.config.mjs` optimized for production
- [ ] `package.json` scripts configured correctly
- [ ] TypeScript compilation successful (`npm run type-check`)
- [ ] Build process completes without errors (`npm run build`)
- [ ] All dependencies up to date

#### Backend Integration
- [ ] AWS API Gateway URL confirmed and accessible
- [ ] Cognito User Pool ID and Client ID obtained
- [ ] Backend CORS configured for localhost:3000
- [ ] API endpoints tested and functional

### Vercel Deployment ✅

#### Account Setup
- [ ] Vercel account created/logged in with GitHub
- [ ] GitHub repository access granted to Vercel
- [ ] Project imported from GitHub successfully

#### Build Configuration
- [ ] Framework preset: Next.js (auto-detected)
- [ ] Root directory: `.` (project root)
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`
- [ ] Install command: `npm install`

#### Environment Variables
- [ ] `NEXT_PUBLIC_API_URL` configured
- [ ] `NEXT_PUBLIC_AWS_REGION` configured
- [ ] `NEXT_PUBLIC_COGNITO_USER_POOL_ID` configured
- [ ] `NEXT_PUBLIC_COGNITO_CLIENT_ID` configured
- [ ] `NEXT_PUBLIC_ENVIRONMENT` set to "production"
- [ ] All variables saved in Vercel dashboard

#### Deployment Process
- [ ] Initial deployment triggered
- [ ] Build process completed successfully
- [ ] No build errors or warnings
- [ ] Production URL generated and accessible

### Post-Deployment Validation ✅

#### Basic Functionality
- [ ] Production URL loads correctly
- [ ] All main pages accessible (/, /clubs, /routes, /coffee, /guides)
- [ ] Navigation menu works properly
- [ ] Responsive design functions on mobile/tablet
- [ ] No console errors in browser developer tools

#### Backend Integration
- [ ] API calls reach backend successfully
- [ ] CORS configuration working (no CORS errors)
- [ ] Authentication flow functional (if implemented)
- [ ] Environment variables loaded correctly

#### Performance
- [ ] Page load times acceptable (<3 seconds)
- [ ] Core Web Vitals within acceptable ranges
- [ ] Images loading and optimized
- [ ] No JavaScript errors in production

### Backend CORS Update ✅

#### API Gateway Configuration
- [ ] Vercel production URL added to CORS origins
- [ ] Custom domain added to CORS origins (if applicable)
- [ ] CORS headers include required authentication headers
- [ ] CORS preflight requests working correctly
- [ ] Backend redeployed with updated CORS settings

### Strava Integration Setup ✅

#### Strava Developer Console
- [ ] Strava developer account created/accessed
- [ ] New application created in Strava
- [ ] Application name set to "Collective Rides"
- [ ] Website URL set to Vercel production URL
- [ ] Authorization callback domain configured
- [ ] Authorization callback URL configured

#### Environment Variables Update
- [ ] Strava Client ID obtained from developer console
- [ ] `NEXT_PUBLIC_STRAVA_CLIENT_ID` added to Vercel
- [ ] Application redeployed with new environment variable
- [ ] Strava OAuth flow tested (if implemented)

### Continuous Deployment ✅

#### GitHub Integration
- [ ] Automatic deployments enabled for main branch
- [ ] Preview deployments enabled for feature branches
- [ ] Pull request deployments configured
- [ ] Branch protection rules configured (optional)

#### Monitoring Setup
- [ ] Vercel Analytics enabled (optional)
- [ ] Error tracking configured (optional)
- [ ] Performance monitoring active
- [ ] Deployment notifications configured

### Security and Optimization ✅

#### Security Headers
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Security headers configured in next.config.mjs
- [ ] No sensitive data exposed in client-side code
- [ ] Environment variables properly secured

#### Performance Optimization
- [ ] Bundle size optimized
- [ ] Images properly optimized
- [ ] Caching headers configured
- [ ] CDN distribution active

### Documentation and Handoff ✅

#### Documentation Updates
- [ ] Deployment guide documented
- [ ] Environment variables documented
- [ ] API endpoints documented
- [ ] Troubleshooting guide updated

#### Team Communication
- [ ] Production URL shared with team
- [ ] Access credentials documented securely
- [ ] Deployment process communicated
- [ ] Support contacts identified

## Quick Commands Reference

### Local Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server locally
npm run start

# Type checking
npm run type-check

# Linting
npm run lint
```

### Git Operations
```bash
# Add and commit changes
git add .
git commit -m "Deploy: Frontend application to Vercel"

# Push to GitHub
git push origin main

# Create feature branch
git checkout -b feature/new-feature
git push -u origin feature/new-feature
```

### Vercel CLI (Optional)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from command line
vercel --prod

# Check deployment status
vercel ls
```

## Environment Variables Template

Copy this template for quick environment setup:

```bash
# .env.local (for local development)
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_AWS_REGION=us-east-2
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-2_xxxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRAVA_CLIENT_ID=xxxxx
NEXT_PUBLIC_ENVIRONMENT=development

# Vercel Environment Variables (for production)
NEXT_PUBLIC_API_URL=https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development
NEXT_PUBLIC_AWS_REGION=us-east-2
NEXT_PUBLIC_COGNITO_USER_POOL_ID=[your-user-pool-id]
NEXT_PUBLIC_COGNITO_CLIENT_ID=[your-client-id]
NEXT_PUBLIC_STRAVA_CLIENT_ID=[your-strava-client-id]
NEXT_PUBLIC_ENVIRONMENT=production
```

## Troubleshooting Quick Fixes

### Build Failures
```bash
# Clear cache and rebuild
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### CORS Issues
1. Check backend CORS configuration includes Vercel URL
2. Verify API Gateway settings
3. Test API endpoints directly
4. Check browser network tab for CORS errors

### Environment Variable Issues
1. Verify all variables have `NEXT_PUBLIC_` prefix for client-side access
2. Check Vercel dashboard for proper configuration
3. Redeploy after adding new variables
4. Test variables in browser console: `process.env.NEXT_PUBLIC_API_URL`

### Performance Issues
1. Check bundle size with `npm run build`
2. Optimize images and assets
3. Review Core Web Vitals in Vercel Analytics
4. Enable compression and caching

## Success Criteria

### Deployment Success
- ✅ Application builds without errors
- ✅ Production URL accessible and functional
- ✅ All environment variables loaded correctly
- ✅ No console errors in production
- ✅ Backend API integration working

### Performance Success
- ✅ Page load time < 3 seconds
- ✅ Core Web Vitals scores in green
- ✅ Mobile responsiveness working
- ✅ Images optimized and loading quickly

### Integration Success
- ✅ Backend API calls successful
- ✅ Authentication flow working (if implemented)
- ✅ Strava OAuth configured (if implemented)
- ✅ All user flows functional

## Timeline Estimates

| Task | Estimated Time | Notes |
|------|----------------|-------|
| Repository Setup | 15 minutes | Git and GitHub configuration |
| Application Optimization | 30 minutes | Config files and build optimization |
| Vercel Deployment | 15 minutes | Platform setup and deployment |
| Environment Configuration | 15 minutes | Variables and settings |
| Backend CORS Update | 15 minutes | API Gateway configuration |
| Strava Integration | 15 minutes | Developer console setup |
| Testing and Validation | 30 minutes | Comprehensive testing |
| **Total** | **2.25 hours** | End-to-end deployment |

---

**Last Updated**: January 1, 2026  
**Version**: 1.0  
**Use Case**: Production deployment to Vercel