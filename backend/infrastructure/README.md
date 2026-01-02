# Infrastructure - Phase 1.1 Foundation

## Overview

This directory contains the AWS CDK infrastructure code for the Sydney Cycling Platform v1 backend. The infrastructure is designed according to the canonical specifications and implements a modular, scalable architecture.

## Architecture Components

### Cognito User Pool (`cognito/user-pool.ts`)
- **Purpose:** User authentication and identity management
- **Features:**
  - JWT token issuance with custom claims
  - SystemRole custom attribute (SiteAdmin/User)
  - Password policies and security settings
  - MFA-ready configuration
  - Integration hooks for user lifecycle events

### DynamoDB Table (`dynamodb/main-table.ts`)
- **Purpose:** Primary data store for all v1 domain entities
- **Design:** Single table pattern with flexible access patterns
- **Features:**
  - On-demand billing for cost optimization
  - Global Secondary Indexes for query patterns
  - Strong consistency for critical operations
  - Backup and point-in-time recovery enabled

### API Gateway (`api-gateway/rest-api.ts`)
- **Purpose:** HTTP API layer for all backend services
- **Features:**
  - REST API with proper CORS configuration
  - Health check endpoint for monitoring
  - JWT authorizer integration (ready for Phase 1.2)
  - CloudWatch logging and monitoring
  - Request/response validation

## Stack Organization

### Main Stack (`lib/sydney-cycles-stack.ts`)
- Orchestrates all infrastructure components
- Manages cross-component dependencies
- Outputs important resource identifiers
- Configures environment-specific settings

### CDK App (`bin/app.ts`)
- Entry point for CDK deployment
- Environment configuration
- Stack instantiation and deployment

## Deployment

The infrastructure follows AWS best practices:
- **Least Privilege:** IAM roles with minimal required permissions
- **Security:** Encryption at rest and in transit
- **Monitoring:** CloudWatch integration for all components
- **Scalability:** Auto-scaling and on-demand configurations

### Performance Optimization

This project uses **local esbuild bundling** for Lambda functions to improve deployment speed:
- Faster CDK commands (`cdk ls`, `cdk synth`, `cdk deploy`)
- No Docker dependency issues
- Lower local resource consumption

See [`../docs/cdk-bundling-optimization.md`](../docs/cdk-bundling-optimization.md) for details on:
- Configuration options
- Switching between local and Docker bundling
- Troubleshooting guide

## Access Patterns

### DynamoDB Entity Storage
```
Users:           PK=USER#{id},           SK=PROFILE
Clubs:           PK=CLUB#{id},           SK=METADATA  
Memberships:     PK=CLUB#{id},           SK=MEMBER#{user_id}
Rides:           PK=CLUB#{id},           SK=RIDE#{ride_id}
Participations:  PK=RIDE#{id},           SK=PARTICIPANT#{user_id}
```

### Global Secondary Indexes
- **GSI1:** User-centric queries (user memberships, participations)
- **GSI2:** Time-based queries (recent rides, upcoming events)

## Security Configuration

### IAM Roles
- Lambda execution roles with DynamoDB and CloudWatch access
- API Gateway service roles for logging
- Cognito service roles for user management

### Encryption
- DynamoDB encryption at rest using AWS managed keys
- API Gateway with TLS 1.2+ enforcement
- CloudWatch logs encryption

### Network Security
- VPC-ready configuration for future isolation
- Security groups prepared for Lambda VPC deployment
- WAF integration points for API protection

## Monitoring and Logging

### CloudWatch Integration
- API Gateway access and execution logs
- DynamoDB performance metrics
- Cognito authentication metrics
- Custom business metrics preparation

### Health Checks
- API Gateway health endpoint (`GET /health`)
- DynamoDB connection validation
- Cognito service availability checks

## Environment Configuration

The infrastructure supports multiple environments:
- **Development:** Minimal resources, relaxed security
- **Staging:** Production-like setup for testing
- **Production:** Full security, monitoring, and backup

## Next Phase Preparation

The infrastructure is designed to support upcoming phases:
- **Phase 1.2:** Lambda functions for User Profile Service
- **Phase 1.3:** Authorization Service integration
- **Phase 2+:** Additional services and integrations

## Compliance

All infrastructure components comply with:
- Canonical domain model (`.kiro/specs/domain.v1.md`)
- AWS architecture specification (`.kiro/specs/architecture.aws.v1.md`)
- Implementation plan requirements (`.kiro/specs/implementation.v1.md`)