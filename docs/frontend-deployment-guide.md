# Frontend Deployment Guide: Vercel + GitHub

## Overview

This guide documents the complete process for deploying the Collective Rides Next.js frontend application to Vercel using GitHub for version control and automatic deployments. This setup provides the website URL required for Strava developer application registration.

**Last Updated**: January 1, 2026  
**Version**: 1.0  
**Status**: Production Ready

## Architecture Overview

```
GitHub Repository → Vercel Platform → Global CDN
     ↓                    ↓              ↓
Version Control    Build & Deploy    Production URL
```

**Components:**
- **GitHub**: Source code repository and version control
- **Vercel**: Build platform and hosting service
- **Next.js**: React framework with SSR/SSG capabilities
- **AWS Backend**: API Gateway + Lambda + Cognito integration

## Prerequisites

### Required Accounts
- [ ] GitHub account with repository access
- [ ] Vercel account (free tier sufficient)
- [ ] AWS account (for backend services)

### Required Tools
- [ ] Git CLI installed locally
- [ ] Node.js 18+ and npm/pnpm
- [ ] Text editor/IDE

### Backend Requirements
- [ ] AWS API Gateway deployed and accessible
- [ ] Cognito User Pool configured
- [ ] CORS settings configured for frontend domains

## Step-by-Step Deployment Process

### Phase 1: Repository Setup

#### 1.1 Initialize Git Repository
```bash
# Navigate to project root
cd /path/to/collective-rides-frontend

# Initialize git (if not already done)
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: Collective Rides Next.js application"
```

#### 1.2 Create GitHub Repository
1. Navigate to [GitHub.com](https://github.com)
2. Click "New repository" button
3. Configure repository:
   - **Name**: `collective-rides-frontend`
   - **Description**: "Collective Rides - Sydney Cycling Platform Frontend"
   - **Visibility**: Public (recommended for Vercel free tier)
   - **Initialize**: Leave unchecked (existing code)

#### 1.3 Connect Local to Remote
```bash
# Add remote origin (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/collective-rides-frontend.git

# Set main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

### Phase 2: Environment Configuration

#### 2.1 Create Environment Template
Create `.env.example` file:
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com/development
NEXT_PUBLIC_AWS_REGION=us-east-2

# Cognito Authentication
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-user-pool-id
NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id

# Strava Integration
NEXT_PUBLIC_STRAVA_CLIENT_ID=your-strava-client-id

# Application Environment
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_APP_NAME=Collective Rides
NEXT_PUBLIC_APP_VERSION=1.0.0
```

#### 2.2 Backend Configuration Values
Collect these values from your AWS deployment:

| Variable | Source | Example |
|----------|--------|---------|
| `NEXT_PUBLIC_API_URL` | API Gateway Console | `https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development` |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | Cognito Console | `us-east-2_xxxxxxxxx` |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | Cognito Console | `xxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `NEXT_PUBLIC_AWS_REGION` | AWS Region | `us-east-2` |

### Phase 3: Application Optimization

#### 3.1 Update Next.js Configuration
Update `next.config.mjs`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false, // Enable strict checking for production
  },
  
  // Image optimization
  images: {
    unoptimized: true,
    domains: [
      'collective-rides.vercel.app',
      'your-custom-domain.com'
    ],
  },
  
  // Performance optimizations
  output: 'standalone',
  experimental: {
    optimizeCss: true,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
}

export default nextConfig
```

#### 3.2 Vercel Configuration (Optional)
Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["syd1", "iad1"],
  "functions": {
    "app/**/*.tsx": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

#### 3.3 Package.json Optimization
Ensure proper scripts in `package.json`:
```json
{
  "scripts": {
    "build": "next build",
    "dev": "next dev",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
```

### Phase 4: Vercel Deployment

#### 4.1 Connect Vercel to GitHub
1. Navigate to [vercel.com](https://vercel.com)
2. Sign up/Login using GitHub account
3. Click "New Project"
4. Import GitHub repository:
   - Search for `collective-rides-frontend`
   - Click "Import"

#### 4.2 Configure Deployment Settings

**Framework Detection**: Next.js (auto-detected)

**Build Settings**:
- **Framework Preset**: Next.js
- **Root Directory**: `.` (project root)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

#### 4.3 Environment Variables Configuration
Add the following environment variables in Vercel:

```
NEXT_PUBLIC_API_URL = https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development
NEXT_PUBLIC_AWS_REGION = us-east-2
NEXT_PUBLIC_COGNITO_USER_POOL_ID = [your-user-pool-id]
NEXT_PUBLIC_COGNITO_CLIENT_ID = [your-client-id]
NEXT_PUBLIC_ENVIRONMENT = production
NEXT_PUBLIC_APP_NAME = Collective Rides
NEXT_PUBLIC_APP_VERSION = 1.0.0
```

#### 4.4 Deploy Application
1. Click "Deploy" button
2. Monitor build process in Vercel dashboard
3. Wait for deployment completion (~2-5 minutes)

### Phase 5: Post-Deployment Configuration

#### 5.1 Deployment URLs
After successful deployment, you'll receive:

**Production URL**: `https://collective-rides-frontend.vercel.app`
**Preview URLs**: `https://collective-rides-frontend-git-[branch]-[username].vercel.app`

#### 5.2 Custom Domain Setup (Optional)
1. Navigate to Vercel Dashboard → Project → Settings → Domains
2. Add custom domain: `collectiverides.com`
3. Configure DNS records as instructed:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   
   Type: A
   Name: @
   Value: 76.76.19.61
   ```

#### 5.3 Update Backend CORS Configuration
Update API Gateway CORS settings to include Vercel domains:

```typescript
// In backend/infrastructure/lib/api-gateway/rest-api.ts
defaultCorsPreflightOptions: {
  allowOrigins: [
    'http://localhost:3000',
    'https://collective-rides-frontend.vercel.app',
    'https://collectiverides.com', // if using custom domain
    'https://www.collectiverides.com'
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'X-Api-Key',
    'X-Amz-Security-Token'
  ],
  allowCredentials: true,
  maxAge: cdk.Duration.hours(1),
}
```

### Phase 6: Strava Integration Setup

#### 6.1 Strava Developer Application Configuration
Use deployed URL for Strava developer console:

**Application Settings**:
- **Application Name**: "Collective Rides"
- **Category**: "Cycling"
- **Website**: `https://collective-rides-frontend.vercel.app`
- **Authorization Callback Domain**: `collective-rides-frontend.vercel.app`

**OAuth Settings**:
- **Authorization Callback URL**: `https://collective-rides-frontend.vercel.app/auth/strava/callback`
- **Webhook Endpoint**: `https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/integrations/strava/webhook`

#### 6.2 Update Environment Variables
Add Strava credentials to Vercel environment variables:
```
NEXT_PUBLIC_STRAVA_CLIENT_ID = [your-strava-client-id]
```

Note: Strava Client Secret should be stored in backend AWS Systems Manager Parameter Store, not frontend environment variables.

### Phase 7: Continuous Deployment Setup

#### 7.1 Automatic Deployment Configuration
Vercel automatically deploys based on Git activity:

**Production Deployments**:
- Triggered by: Push to `main` branch
- URL: `https://collective-rides-frontend.vercel.app`
- Environment: Production environment variables

**Preview Deployments**:
- Triggered by: Push to any other branch
- URL: `https://collective-rides-frontend-git-[branch]-[username].vercel.app`
- Environment: Preview environment variables (if configured)

**Pull Request Deployments**:
- Triggered by: Opening/updating pull requests
- URL: Unique preview URL per PR
- Environment: Preview environment variables

#### 7.2 Branch Protection Rules (Recommended)
Configure GitHub branch protection for `main`:
1. GitHub Repository → Settings → Branches
2. Add rule for `main` branch:
   - Require pull request reviews
   - Require status checks (Vercel deployment)
   - Restrict pushes to main branch

### Phase 8: Monitoring and Optimization

#### 8.1 Vercel Analytics Setup
1. Navigate to Vercel Dashboard → Project → Analytics
2. Enable Vercel Analytics (free tier available)
3. Monitor Core Web Vitals and performance metrics

#### 8.2 Error Monitoring
Consider integrating error tracking:
- **Sentry**: Error tracking and performance monitoring
- **LogRocket**: Session replay and debugging
- **Vercel Functions**: Built-in function monitoring

#### 8.3 Performance Optimization
Monitor and optimize:
- **Bundle Size**: Use Vercel Bundle Analyzer
- **Core Web Vitals**: Monitor LCP, FID, CLS scores
- **Image Optimization**: Ensure proper Next.js Image usage
- **Caching**: Configure appropriate cache headers

## Testing and Validation

### Pre-Deployment Checklist
- [ ] All environment variables configured
- [ ] TypeScript compilation successful
- [ ] Build process completes without errors
- [ ] All pages render correctly
- [ ] Authentication flow works (if implemented)
- [ ] API integration functional
- [ ] Responsive design verified
- [ ] Performance metrics acceptable

### Post-Deployment Validation
- [ ] Production URL accessible
- [ ] All routes working correctly
- [ ] Environment variables loaded properly
- [ ] CORS configuration working
- [ ] SSL certificate active
- [ ] Performance metrics within targets
- [ ] Error tracking functional

### Testing Commands
```bash
# Local development
npm run dev

# Production build test
npm run build
npm run start

# Type checking
npm run type-check

# Linting
npm run lint

# Testing (if configured)
npm run test
```

## Troubleshooting Guide

### Common Build Issues

**TypeScript Errors**:
```bash
# Check for type errors
npm run type-check

# Fix common issues
npm install @types/node @types/react @types/react-dom --save-dev
```

**Dependency Issues**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Update dependencies
npm update
```

**Environment Variable Issues**:
- Ensure all `NEXT_PUBLIC_` prefixed variables are set
- Check Vercel dashboard for proper configuration
- Verify no typos in variable names

### Common Runtime Issues

**CORS Errors**:
- Update backend CORS configuration
- Verify Vercel domain in allowed origins
- Check API Gateway settings

**Authentication Issues**:
- Verify Cognito configuration
- Check JWT token handling
- Validate redirect URLs

**API Connection Issues**:
- Test API endpoints directly
- Verify network connectivity
- Check API Gateway logs

### Performance Issues

**Slow Loading**:
- Optimize images and assets
- Enable compression
- Review bundle size
- Implement code splitting

**High Memory Usage**:
- Check for memory leaks
- Optimize component rendering
- Review state management

## Maintenance and Updates

### Regular Maintenance Tasks

**Weekly**:
- Monitor deployment status
- Review error logs
- Check performance metrics

**Monthly**:
- Update dependencies
- Review security advisories
- Optimize performance

**Quarterly**:
- Review and update documentation
- Audit environment variables
- Performance optimization review

### Update Process

**Dependency Updates**:
```bash
# Check for updates
npm outdated

# Update packages
npm update

# Major version updates (careful review required)
npm install package@latest
```

**Environment Updates**:
1. Update `.env.example` with new variables
2. Add variables to Vercel dashboard
3. Redeploy application
4. Test functionality

## Security Considerations

### Environment Variables
- Never commit `.env` files to repository
- Use Vercel environment variables for secrets
- Rotate API keys regularly
- Use different keys for development/production

### HTTPS and SSL
- Vercel provides automatic SSL certificates
- Enforce HTTPS redirects
- Configure security headers
- Regular security audits

### Access Control
- Implement proper authentication
- Use role-based access control
- Regular access reviews
- Monitor for suspicious activity

## Cost Optimization

### Vercel Pricing Tiers
- **Hobby**: Free tier (sufficient for development)
- **Pro**: $20/month (recommended for production)
- **Enterprise**: Custom pricing (large scale)

### Cost Monitoring
- Monitor function execution time
- Optimize build times
- Review bandwidth usage
- Consider CDN optimization

## Support and Resources

### Documentation Links
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [GitHub Actions](https://docs.github.com/en/actions)

### Community Resources
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/vercel)

### Emergency Contacts
- Vercel Support: support@vercel.com
- GitHub Support: support@github.com
- Internal Team: [team-contact-info]

---

**Document Version**: 1.0  
**Last Updated**: January 1, 2026  
**Next Review**: April 1, 2026  
**Maintained By**: Development Team