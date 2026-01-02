# Node.js Runtime Update - Action Checklist

## 🚨 IMMEDIATE ACTION REQUIRED

**Deadline**: April 30, 2026 (4 months away)
**Recommended**: Complete this week

## Phase 1: Fix Ride Service (CRITICAL)

### Pre-Update Checklist
- [ ] Backup current infrastructure configuration
- [ ] Ensure development environment is available for testing
- [ ] Verify AWS CLI and CDK are up to date

### Configuration Update
- [ ] Open `backend/infrastructure/lib/ride-service.ts`
- [ ] Change line 25: `runtime: lambda.Runtime.NODEJS_20_X` → `runtime: lambda.Runtime.NODEJS_24_X`
- [ ] Save file and commit changes

### Deployment Steps
```bash
# 1. Navigate to infrastructure directory
cd backend/infrastructure

# 2. Install dependencies (if needed)
npm install

# 3. Deploy changes
npm run deploy

# 4. Verify deployment
aws lambda list-functions --query "Functions[?Runtime=='nodejs20.x'].FunctionName"
# Should return empty array after successful update
```

### Verification Checklist
- [ ] All 7 Ride Service functions show `nodejs24.x` in AWS Console
- [ ] No deployment errors in CDK output
- [ ] CloudFormation stack update completed successfully

### Testing Checklist
- [ ] Test ride creation endpoint
- [ ] Test ride listing endpoint
- [ ] Test ride participation (join/leave)
- [ ] Test user rides endpoint
- [ ] Check CloudWatch logs for any runtime errors

## Phase 2: Standardize Other Services (RECOMMENDED)

### Services to Update
- [ ] User Profile Service (`backend/infrastructure/lib/user-profile-service.ts`)
- [ ] Club Service (`backend/infrastructure/lib/club-service.ts`)
- [ ] Route File Service (`backend/infrastructure/lib/route-file-service.ts`)
- [ ] Route Template Service (`backend/infrastructure/lib/route-template-service.ts`)

### Update Pattern
For each service file, change:
```typescript
runtime: lambda.Runtime.NODEJS_18_X  // OLD
```
to:
```typescript
runtime: lambda.Runtime.NODEJS_24_X  // NEW
```

## Quick Commands

### Check Current Runtime Versions
```bash
# List all functions with their runtimes
aws lambda list-functions --query "Functions[].{Name:FunctionName,Runtime:Runtime}" --output table

# Check specifically for Node.js 20.x functions
aws lambda list-functions --query "Functions[?Runtime=='nodejs20.x'].FunctionName"
```

### Verify Update Success
```bash
# Should return empty after successful update
aws lambda list-functions --query "Functions[?Runtime=='nodejs20.x'].FunctionName"

# Check all Node.js functions are on 24.x
aws lambda list-functions --query "Functions[?starts_with(Runtime, 'nodejs')].{Name:FunctionName,Runtime:Runtime}" --output table
```

## Rollback Plan (If Needed)

If issues occur after deployment:

1. **Revert Configuration**
   ```typescript
   runtime: lambda.Runtime.NODEJS_20_X  // Temporary rollback
   ```

2. **Redeploy**
   ```bash
   npm run deploy
   ```

3. **Investigate Issues**
   - Check CloudWatch logs
   - Review error patterns
   - Test in development environment

## Success Criteria

✅ **Phase 1 Complete When:**
- All 7 Ride Service functions use Node.js 24.x
- All API endpoints respond correctly
- No increase in error rates
- CloudWatch shows healthy function execution

✅ **Phase 2 Complete When:**
- All Lambda functions use Node.js 24.x
- Consistent runtime across all services
- All functionality verified working

## Emergency Contacts

- **AWS Support**: If deployment issues occur
- **Technical Lead**: For approval of changes
- **DevOps Team**: For infrastructure assistance

## Notes

- Node.js 24.x is production-ready and in active LTS
- Existing code should work without modifications
- Performance may improve with newer runtime
- Security patches will continue until April 2028

---

**Status**: [ ] Not Started [ ] In Progress [ ] Phase 1 Complete [ ] Phase 2 Complete
**Last Updated**: 2025-01-01
**Next Review**: After Phase 1 completion