# CDK Lambda Bundling Optimization Guide

## Overview

This document describes the optimization applied to improve CDK deployment performance by switching from Docker-based bundling to local esbuild bundling for Lambda functions.

## Problem Statement

**Issue**: CDK commands (`npx cdk ls`, `npx cdk diff`, `npx cdk deploy`) were getting stuck due to:
- Multiple synth processes remaining running
- NodejsFunction triggering heavy Docker buildx bundling processes
- Docker containers consuming excessive resources on local development machines

**Symptoms**:
- Commands hanging indefinitely
- High CPU/memory usage from Docker processes
- Need to kill multiple processes manually
- Slow deployment times

## Solution Applied

### 1. Added esbuild Dependency

**File**: `backend/package.json`

```json
{
  "devDependencies": {
    "esbuild": "^0.19.0",
    // ... other dependencies
  }
}
```

**Command**: `npm install` (to update package-lock.json)

### 2. Configured Local Bundling for All Lambda Functions

**Files Modified**:
- `backend/infrastructure/lib/user-profile-service.ts`
- `backend/infrastructure/lib/club-service.ts`

**Configuration Added**:
```typescript
bundling: {
  forceDockerBundling: false,  // ← Key setting to avoid Docker
  externalModules: ['@aws-sdk/*'],
  minify: false,               // Faster bundling
  sourceMap: false,            // Faster bundling
}
```

### 3. Implementation Details

#### User Profile Service
Each Lambda function now includes:
```typescript
this.getCurrentUserFunction = new lambdaNodejs.NodejsFunction(this, 'GetCurrentUserFunction', {
  // ... other props
  bundling: {
    forceDockerBundling: false,
    externalModules: ['@aws-sdk/*'],
  },
});
```

#### Club Service
Common configuration applied to all functions:
```typescript
const commonLambdaProps = {
  // ... other props
  bundling: {
    forceDockerBundling: false,
    externalModules: ['@aws-sdk/*'],
    minify: false,
    sourceMap: false,
  },
};
```

## Results

### Performance Improvements
- ✅ `npx cdk ls` completes in seconds (was hanging indefinitely)
- ✅ `npx cdk synth` completes quickly without Docker processes
- ✅ `npx cdk deploy` bundling is significantly faster
- ✅ No more stuck Docker buildx processes
- ✅ Reduced local resource consumption

### Verification Commands
```bash
# Test CDK commands work without hanging
npx cdk ls --output cdk.out.temp
npx cdk synth --output cdk.out.temp
npx cdk diff
npx cdk deploy
```

## Configuration Options

### Current Settings (Optimized for Speed)
```typescript
bundling: {
  forceDockerBundling: false,  // Use local esbuild
  externalModules: ['@aws-sdk/*'],  // Exclude AWS SDK (provided by Lambda runtime)
  minify: false,               // Skip minification for faster builds
  sourceMap: false,            // Skip source maps for faster builds
}
```

### Alternative Settings

#### For Production Optimization
```typescript
bundling: {
  forceDockerBundling: false,
  externalModules: ['@aws-sdk/*'],
  minify: true,                // Enable for smaller bundles
  sourceMap: true,             // Enable for debugging
  target: 'es2020',           // Specify target for better optimization
}
```

#### Force Docker Bundling (if needed)
```typescript
bundling: {
  forceDockerBundling: true,   // Force Docker (slower but more consistent)
  externalModules: ['@aws-sdk/*'],
}
```

## When to Use Each Approach

### Local Bundling (Current - Recommended for Development)
**Use when**:
- Developing locally
- Need fast iteration cycles
- Docker is causing issues
- Local environment has esbuild available

**Pros**:
- Much faster bundling
- No Docker dependency issues
- Lower resource usage
- Consistent with local Node.js environment

**Cons**:
- Slight differences from Lambda runtime environment
- Requires esbuild as dependency

### Docker Bundling (Alternative)
**Use when**:
- Need exact Lambda runtime environment
- Deploying to production (optional)
- Local environment differences cause issues
- Team standardization requires Docker

**Pros**:
- Exact runtime environment match
- Consistent across all development environments
- No local tooling dependencies

**Cons**:
- Slower bundling process
- Higher resource usage
- Potential for hanging processes
- Docker dependency required

## Troubleshooting

### If Local Bundling Fails
1. **Check esbuild installation**:
   ```bash
   npm list esbuild
   ```

2. **Verify Node.js version compatibility**:
   ```bash
   node --version  # Should be 18.x or 20.x
   ```

3. **Clear CDK cache**:
   ```bash
   rm -rf cdk.out*
   ```

4. **Fallback to Docker bundling**:
   ```typescript
   bundling: {
     forceDockerBundling: true,
   }
   ```

### If Commands Still Hang
1. **Kill stuck processes**:
   ```bash
   # Find CDK/Docker processes
   ps aux | grep -E "(cdk|docker|buildx)"
   
   # Kill specific processes
   kill <process_ids>
   ```

2. **Clean Docker state**:
   ```bash
   docker system prune -f
   ```

3. **Restart Docker Desktop** (if using Docker Desktop)

## Migration Guide

### To Switch Back to Docker Bundling
1. **Update bundling configuration**:
   ```typescript
   bundling: {
     forceDockerBundling: true,
     externalModules: ['@aws-sdk/*'],
   }
   ```

2. **Remove esbuild dependency** (optional):
   ```bash
   npm uninstall esbuild
   ```

### To Apply to New Lambda Functions
Always include the bundling configuration:
```typescript
new lambdaNodejs.NodejsFunction(this, 'NewFunction', {
  // ... other props
  bundling: {
    forceDockerBundling: false,
    externalModules: ['@aws-sdk/*'],
  },
});
```

## Best Practices

1. **Use local bundling for development** - Faster iteration
2. **Consider Docker bundling for CI/CD** - More consistent
3. **Always include externalModules** - Reduces bundle size
4. **Test both approaches** - Ensure compatibility
5. **Document team preferences** - Maintain consistency
6. **Monitor bundle sizes** - Optimize as needed

## Related Files

- `backend/package.json` - esbuild dependency
- `backend/infrastructure/lib/user-profile-service.ts` - User profile Lambda configs
- `backend/infrastructure/lib/club-service.ts` - Club service Lambda configs
- `backend/docs/testing-guide.md` - Testing procedures
- `backend/README.md` - General project documentation

## References

- [AWS CDK Lambda NodeJS Documentation](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs-readme.html)
- [esbuild Documentation](https://esbuild.github.io/)
- [AWS Lambda Runtime Environment](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html)

---

**Last Updated**: December 2024  
**Applied By**: Kiro AI Assistant  
**Status**: Active - Local bundling enabled for all Lambda functions