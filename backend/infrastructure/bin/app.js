#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
const sydney_cycles_stack_1 = require("../lib/sydney-cycles-stack");
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
const stackProps = {
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
new sydney_cycles_stack_1.SydneyCyclesStack(app, 'SydneyCyclesStack', stackProps);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsdUNBQXFDO0FBQ3JDLGlEQUFtQztBQUNuQyxvRUFBK0Q7QUFFL0Q7Ozs7Ozs7Ozs7R0FVRztBQUVILE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLDRCQUE0QjtBQUM1QixNQUFNLEdBQUcsR0FBRztJQUNWLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQjtJQUN4QyxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsSUFBSSxXQUFXO0NBQ3RELENBQUM7QUFFRixzQkFBc0I7QUFDdEIsTUFBTSxVQUFVLEdBQW1CO0lBQ2pDLEdBQUc7SUFDSCxXQUFXLEVBQUUsMEVBQTBFO0lBQ3ZGLElBQUksRUFBRTtRQUNKLE9BQU8sRUFBRSxjQUFjO1FBQ3ZCLFdBQVcsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsSUFBSSxhQUFhO1FBQ3JELEtBQUssRUFBRSwrQkFBK0I7UUFDdEMsU0FBUyxFQUFFLEtBQUs7S0FDakI7Q0FDRixDQUFDO0FBRUYsdUNBQXVDO0FBQ3ZDLElBQUksdUNBQWlCLENBQUMsR0FBRyxFQUFFLG1CQUFtQixFQUFFLFVBQVUsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuaW1wb3J0ICdzb3VyY2UtbWFwLXN1cHBvcnQvcmVnaXN0ZXInO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IFN5ZG5leUN5Y2xlc1N0YWNrIH0gZnJvbSAnLi4vbGliL3N5ZG5leS1jeWNsZXMtc3RhY2snO1xuXG4vKipcbiAqIENESyBBcHAgRW50cnkgUG9pbnRcbiAqIFxuICogVGhpcyBpcyB0aGUgbWFpbiBlbnRyeSBwb2ludCBmb3IgdGhlIFN5ZG5leSBDeWNsaW5nIFBsYXRmb3JtIHYxIGJhY2tlbmQgaW5mcmFzdHJ1Y3R1cmUuXG4gKiBJdCBjcmVhdGVzIGFuZCBjb25maWd1cmVzIHRoZSBDREsgYXBwIGFuZCBpbnN0YW50aWF0ZXMgdGhlIG1haW4gc3RhY2suXG4gKiBcbiAqIEJhc2VkIG9uIGNhbm9uaWNhbCBzcGVjaWZpY2F0aW9uczpcbiAqIC0gRG9tYWluIE1vZGVsOiAua2lyby9zcGVjcy9kb21haW4udjEubWRcbiAqIC0gQVdTIEFyY2hpdGVjdHVyZTogLmtpcm8vc3BlY3MvYXJjaGl0ZWN0dXJlLmF3cy52MS5tZFxuICogLSBJbXBsZW1lbnRhdGlvbiBQbGFuOiAua2lyby9zcGVjcy9pbXBsZW1lbnRhdGlvbi52MS5tZCAoUGhhc2UgMS4xKVxuICovXG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbi8vIEVudmlyb25tZW50IGNvbmZpZ3VyYXRpb25cbmNvbnN0IGVudiA9IHtcbiAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcbiAgcmVnaW9uOiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9SRUdJT04gfHwgJ3VzLWVhc3QtMScsXG59O1xuXG4vLyBTdGFjayBjb25maWd1cmF0aW9uXG5jb25zdCBzdGFja1Byb3BzOiBjZGsuU3RhY2tQcm9wcyA9IHtcbiAgZW52LFxuICBkZXNjcmlwdGlvbjogJ1N5ZG5leSBDeWNsaW5nIFBsYXRmb3JtIHYxIEJhY2tlbmQgSW5mcmFzdHJ1Y3R1cmUgLSBQaGFzZSAxLjEgRm91bmRhdGlvbicsXG4gIHRhZ3M6IHtcbiAgICBQcm9qZWN0OiAnU3lkbmV5Q3ljbGVzJyxcbiAgICBFbnZpcm9ubWVudDogcHJvY2Vzcy5lbnYuRU5WSVJPTk1FTlQgfHwgJ2RldmVsb3BtZW50JyxcbiAgICBQaGFzZTogJzEuMS1JbmZyYXN0cnVjdHVyZS1Gb3VuZGF0aW9uJyxcbiAgICBNYW5hZ2VkQnk6ICdDREsnLFxuICB9LFxufTtcblxuLy8gQ3JlYXRlIHRoZSBtYWluIGluZnJhc3RydWN0dXJlIHN0YWNrXG5uZXcgU3lkbmV5Q3ljbGVzU3RhY2soYXBwLCAnU3lkbmV5Q3ljbGVzU3RhY2snLCBzdGFja1Byb3BzKTsiXX0=