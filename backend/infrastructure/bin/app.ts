#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SydneyCyclesStack } from '../lib/sydney-cycles-stack';

/**
 * CDK App Entry Point
 * 
 * This is the main entry point for the Sydney Cycling Platform v1 backend infrastructure.
 * It creates and configures the CDK app and instantiates the main stack.
 * 
 * Based on canonical specifications:
 * - Domain Model: .kiro/specs/domain.v1.md
 * - AWS Architecture: .kiro/specs/architecture.aws.v1.md
 * - Implementation Plan: .kiro/specs/implementation.v1.md (Phase 1.1)
 */

const app = new cdk.App();

// Environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Stack configuration
const stackProps: cdk.StackProps = {
  env,
  description: 'Sydney Cycling Platform v1 Backend Infrastructure - Phase 1.1 Foundation',
  tags: {
    Project: 'SydneyCycles',
    Environment: process.env.ENVIRONMENT || 'development',
    Phase: '1.1-Infrastructure-Foundation',
    ManagedBy: 'CDK',
  },
};

// Create the main infrastructure stack
new SydneyCyclesStack(app, 'SydneyCyclesStack', stackProps);