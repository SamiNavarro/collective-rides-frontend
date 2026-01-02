# Node.js Runtime Update Analysis and Action Plan

## Executive Summary

AWS has notified us that 7 Lambda functions in our Ride Service are using Node.js 20.x runtime, which will be deprecated on **April 30, 2026**. This document provides analysis, recommendations, and an action plan to address this deprecation.

## Current Situation

### Affected Functions
The following 7 Ride Service Lambda functions are using Node.js 20.x runtime:

1. `SydneyCyclesStack-RideServiceGetRideHandler4E24A88-OCC6XiUsQDcg`
2. `SydneyCyclesStack-RideServiceLeaveRideHandler47843-4iMIboBvCMZm`
3. `SydneyCyclesStack-RideServiceGetUserRidesHandler9C-uVEeB9pvKSth`
4. `SydneyCyclesStack-RideServicePublishRideHandler6FF-A0hyMw47Xgto`
5. `SydneyCyclesStack-RideServiceCreateRideHandler9D0E-JHU6aILTVMwG`
6. `SydneyCyclesStack-RideServiceJoinRideHandler5EAA6A-xtonTptRSG4C`
7. `SydneyCyclesStack-RideServiceListRidesHandler9958C-ecxHgRLXnFFy`

### Infrastructure Analysis

**Ride Service Configuration** (`backend/infrastructure/lib/ride-service.ts`):
```typescript
runtime: lambda.Runtime.NODEJS_20_X  // ⚠️ DEPRECATED
```

**Other Services** (Correctly configured):
- User Profile Service: `NODEJS_18_X`
- Club Service: `NODEJS_18_X`
- Route File Service: `NODEJS_18_X`
- Route Template Service: `NODEJS_18_X`

## AWS Lambda Node.js Runtime Support Matrix

| Runtime | Identifier | Status | Deprecation Date | Block Create | Block Update |
|---------|------------|--------|------------------|--------------|--------------|
| Node.js 24 | `nodejs24.x` | **Active LTS** | Apr 30, 2028 | Jun 1, 2028 | Jul 1, 2028 |
| Node.js 22 | `nodejs22.x` | Active | Apr 30, 2027 | Jun 1, 2027 | Jul 1, 2027 |
| Node.js 20 | `nodejs20.x` | **⚠️ DEPRECATING** | **Apr 30, 2026** | Jun 1, 2026 | Jul 1, 2026 |
| Node.js 18 | `nodejs18.x` | Active | Apr 30, 2025 | Jun 1, 2025 | Jul 1, 2025 |

## Deprecation Timeline

### Node.js 20.x Deprecation Schedule
- **April 30, 2026**: End of support (no security patches or updates)
- **June 1, 2026**: Cannot create new functions with Node.js 20.x
- **July 1, 2026**: Cannot update existing functions with Node.js 20.x

### Impact Assessment
- **Functions continue to run** after deprecation
- **No technical support** for Node.js 20.x runtime issues
- **Security vulnerabilities** will not be patched
- **Compliance risks** for production workloads

## Recommendations

### Primary Recommendation: Upgrade to Node.js 24.x

**Rationale:**
- **Longest Support**: Until April 2028 (3+ years)
- **Latest LTS**: Production-ready with active support
- **Modern Features**: Latest JavaScript/Node.js capabilities
- **Performance**: Improved performance and security
- **Future-Proof**: Avoid near-term deprecation cycles

### Secondary Recommendation: Standardize All Services

Currently, we have mixed runtime versions across services. Recommend standardizing all services to Node.js 24.x for:
- **Consistency**: Uniform runtime environment
- **Maintenance**: Simplified dependency management
- **Future Updates**: Single upgrade path for all services

## Implementation Plan

### Phase 1: Critical Fix (Ride Service) - IMMEDIATE
**Priority**: HIGH
**Timeline**: This week

1. **Update Configuration**
   ```typescript
   // In backend/infrastructure/lib/ride-service.ts
   runtime: lambda.Runtime.NODEJS_24_X  // Change from NODEJS_20_X
   ```

2. **Deploy Changes**
   ```bash
   cd backend/infrastructure
   npm run deploy
   ```

3. **Verify Deployment**
   - Check AWS Console for updated runtime versions
   - Run smoke tests on all Ride Service endpoints

### Phase 2: Standardization (All Services) - RECOMMENDED
**Priority**: MEDIUM
**Timeline**: Next sprint

Update all service configurations to Node.js 24.x:

1. **User Profile Service** (`backend/infrastructure/lib/user-profile-service.ts`)
2. **Club Service** (`backend/infrastructure/lib/club-service.ts`)
3. **Route File Service** (`backend/infrastructure/lib/route-file-service.ts`)
4. **Route Template Service** (`backend/infrastructure/lib/route-template-service.ts`)

## Risk Assessment

### Low Risk Factors
- **Backward Compatibility**: Node.js 24.x maintains compatibility with modern async/await patterns
- **Production Ready**: Node.js 24.x is in active LTS status
- **AWS Support**: Fully supported runtime with automatic updates

### Mitigation Strategies
1. **Development Testing**: Test in development environment first
2. **Gradual Rollout**: Update Ride Service first, then other services
3. **Monitoring**: Monitor function performance post-deployment
4. **Rollback Plan**: Keep previous CDK configuration for quick rollback if needed

## Code Compatibility Analysis

### Current Code Patterns
Our Lambda functions use modern JavaScript patterns that are fully compatible with Node.js 24.x:

```typescript
// ✅ Compatible - Modern async/await pattern
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const authContext = validateAuthContext(event);
    // ... function logic
    return createResponse(200, { success: true, data: result });
  } catch (error) {
    // ... error handling
  }
};
```

### AWS SDK Usage
All services use AWS SDK v3 with external modules bundling:
```typescript
bundling: {
  forceDockerBundling: false,
  externalModules: ['@aws-sdk/*'],  // ✅ Compatible with Node.js 24.x
}
```

## Testing Strategy

### Pre-Deployment Testing
1. **Unit Tests**: Run existing test suites
2. **Integration Tests**: Test API endpoints in development
3. **Performance Tests**: Compare response times and memory usage

### Post-Deployment Verification
1. **Smoke Tests**: Verify all endpoints respond correctly
2. **End-to-End Tests**: Run full user journey tests
3. **Monitoring**: Watch CloudWatch metrics for anomalies

## Monitoring and Validation

### Key Metrics to Monitor
- **Function Duration**: Ensure no performance regression
- **Error Rate**: Watch for increased error rates
- **Memory Usage**: Monitor memory consumption patterns
- **Cold Start Times**: Check initialization performance

### Validation Checklist
- [ ] All 7 Ride Service functions updated to Node.js 24.x
- [ ] Deployment successful without errors
- [ ] All API endpoints responding correctly
- [ ] No increase in error rates or latency
- [ ] CloudWatch logs showing correct runtime version

## Cost Impact

### Expected Cost Changes
- **Minimal Impact**: Runtime change should not significantly affect costs
- **Potential Savings**: Node.js 24.x may have improved performance leading to faster execution times

## Compliance and Security

### Security Benefits
- **Latest Security Patches**: Node.js 24.x receives active security updates
- **Vulnerability Management**: Avoid running on unsupported runtime
- **Compliance**: Meet security best practices for production workloads

## Action Items

### Immediate (This Week)
- [ ] Update Ride Service configuration to Node.js 24.x
- [ ] Deploy infrastructure changes
- [ ] Verify all Ride Service functions are updated
- [ ] Run smoke tests to ensure functionality

### Short Term (Next Sprint)
- [ ] Plan standardization of other services to Node.js 24.x
- [ ] Update remaining service configurations
- [ ] Deploy and test all services
- [ ] Update documentation and deployment guides

### Long Term (Ongoing)
- [ ] Monitor AWS runtime announcements for future updates
- [ ] Establish process for proactive runtime updates
- [ ] Include runtime version in infrastructure review checklist

## References

- [AWS Lambda Runtimes Documentation](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html)
- [Node.js 24 Runtime Announcement](https://aws.amazon.com/blogs/compute/node-js-24-runtime-now-available-in-aws-lambda/)
- [AWS Health Dashboard Notification](https://health.aws.amazon.com/health/home#/account/event-log)

## Document History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-01-01 | 1.0 | System | Initial analysis and action plan |

---

**Next Review Date**: After Phase 1 completion
**Document Owner**: Infrastructure Team
**Approval Required**: Technical Lead