# Sydney Cycles Backend - Phase 1.1 Infrastructure Foundation

## Overview

This is the AWS-native backend infrastructure for the Sydney Cycling Platform v1. This phase implements the foundational infrastructure components as defined in the canonical specifications.

## Architecture

Based on the canonical specs in `.kiro/specs/`:
- **Domain Model:** `.kiro/specs/domain.v1.md`
- **AWS Architecture:** `.kiro/specs/architecture.aws.v1.md`
- **Implementation Plan:** `.kiro/specs/implementation.v1.md`

## Phase 1.1 Components

### Infrastructure (AWS CDK)
- **Cognito User Pool:** User authentication and JWT token issuance
- **DynamoDB Table:** Single table design for v1 domain entities
- **API Gateway:** REST API with health check endpoint
- **CloudWatch:** Logging and monitoring setup
- **IAM Roles:** Least-privilege access for Lambda execution

### Current Status
✅ Infrastructure Foundation (Phase 1.1)
⏳ User Profile Service (Phase 1.2 - Next)
⏳ Authorization Service (Phase 1.3)
⏳ Club Management (Phase 2)
⏳ Event Management (Phase 3)

## Prerequisites

- AWS CLI configured with appropriate permissions
- Node.js 18+ and npm/yarn
- AWS CDK CLI installed (`npm install -g aws-cdk`)

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Bootstrap CDK (First Time Only)**
   ```bash
   cdk bootstrap
   ```

3. **Deploy Infrastructure**
   ```bash
   cdk deploy
   ```

4. **Verify Deployment**
   ```bash
   # Health check endpoint will be available after deployment
   curl https://{api-gateway-url}/health
   ```

## Performance Optimization

This project uses **local esbuild bundling** for faster CDK deployments instead of Docker bundling. See [`docs/cdk-bundling-optimization.md`](docs/cdk-bundling-optimization.md) for:
- Performance improvements and troubleshooting
- How to switch between local and Docker bundling
- Configuration options and best practices

## Infrastructure Components

### Cognito User Pool
- Custom attributes for SystemRole
- JWT token configuration
- Password policies and MFA ready
- Integration points for User Profile Service

### DynamoDB Table
- Single table design with flexible access patterns
- On-demand billing for v1 simplicity
- GSI configurations for secondary access patterns
- Strong consistency for critical operations

### API Gateway
- REST API with proper CORS configuration
- Health check endpoint for monitoring
- JWT authorizer configuration (ready for Phase 1.2)
- CloudWatch logging enabled

## Next Steps (Phase 1.2)

- User Profile Service Lambda functions
- JWT validation and user context injection
- User management API endpoints
- Integration with Cognito User Pool

## Important Notes

- **No Business Logic:** This phase contains only infrastructure
- **Frontend Unchanged:** Existing UI continues to work with mock data
- **Reversible:** Complete infrastructure can be torn down with `cdk destroy`
- **Canonical Compliance:** All components align with approved specifications

## Monitoring

- CloudWatch logs for all components
- Health check endpoint for basic monitoring
- CDK deployment logs for infrastructure changes

## Security

- IAM roles with least-privilege access
- VPC-ready configuration for future isolation
- Secrets Manager integration points prepared
- WAF-ready API Gateway configuration