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
exports.MainTableConstruct = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const constructs_1 = require("constructs");
/**
 * DynamoDB Main Table Construct - Phase 1.1
 *
 * Creates and configures the primary DynamoDB table for all v1 domain entities
 * using single-table design pattern as specified in the canonical architecture.
 *
 * Features:
 * - Single table design with flexible access patterns
 * - Global Secondary Indexes for efficient queries
 * - Strong consistency for critical operations
 * - On-demand billing for cost optimization
 * - Backup and point-in-time recovery for production
 *
 * Entity Storage Patterns (from canonical domain model):
 * - Users:           PK=USER#{id},           SK=PROFILE
 * - Clubs:           PK=CLUB#{id},           SK=METADATA
 * - Memberships:     PK=CLUB#{id},           SK=MEMBER#{user_id}
 * - Rides:           PK=CLUB#{id},           SK=RIDE#{ride_id}
 * - Participations:  PK=RIDE#{id},           SK=PARTICIPANT#{user_id}
 *
 * Compliance:
 * - AWS Architecture: .kiro/specs/architecture.aws.v1.md
 * - Domain Model: All entities from .kiro/specs/domain.v1.md
 */
class MainTableConstruct extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        // Main table with single-table design pattern
        this.table = new dynamodb.Table(this, 'SydneyCyclesMainTable', {
            tableName: `sydney-cycles-main-${props.environment}`,
            // Partition key and sort key for flexible entity storage
            partitionKey: {
                name: 'PK',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'SK',
                type: dynamodb.AttributeType.STRING,
            },
            // Billing mode - on-demand for v1 simplicity and cost optimization
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            // Encryption configuration
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            // Point-in-time recovery for production
            pointInTimeRecovery: props.enableBackup || false,
            // Deletion protection for production
            deletionProtection: props.environment === 'production',
            // Removal policy
            removalPolicy: props.environment === 'production'
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
            // Stream configuration for future event-driven features
            stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            // Table class - standard for general purpose workloads
            tableClass: dynamodb.TableClass.STANDARD,
        });
        // Global Secondary Index 1: User-centric queries
        // Enables efficient queries for user memberships and participations
        this.table.addGlobalSecondaryIndex({
            indexName: 'GSI1',
            partitionKey: {
                name: 'GSI1PK',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'GSI1SK',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        // Global Secondary Index 2: Time-based and status queries
        // Enables efficient queries for recent rides, upcoming events, etc.
        this.table.addGlobalSecondaryIndex({
            indexName: 'GSI2',
            partitionKey: {
                name: 'GSI2PK',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'GSI2SK',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        // Local Secondary Index for entity-specific sorting
        // Useful for sorting within the same partition (e.g., club rides by date)
        this.table.addLocalSecondaryIndex({
            indexName: 'LSI1',
            sortKey: {
                name: 'LSI1SK',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        // CloudWatch alarms for monitoring (production only)
        if (props.environment === 'production') {
            // Read throttle alarm
            new cdk.aws_cloudwatch.Alarm(this, 'ReadThrottleAlarm', {
                metric: this.table.metricUserErrors(),
                threshold: 5,
                evaluationPeriods: 2,
                treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
            });
            // Write throttle alarm
            new cdk.aws_cloudwatch.Alarm(this, 'WriteThrottleAlarm', {
                metric: this.table.metricSystemErrors(),
                threshold: 5,
                evaluationPeriods: 2,
                treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
            });
        }
        // Backup configuration for production
        // Note: AWS Backup integration can be added separately if needed
        // Point-in-time recovery is already enabled above for production
        // Tags for resource management and cost allocation
        cdk.Tags.of(this.table).add('Component', 'DataStorage');
        cdk.Tags.of(this.table).add('Phase', '1.1-Infrastructure');
        cdk.Tags.of(this.table).add('DataPattern', 'SingleTable');
    }
    /**
     * Grant read permissions to a principal
     */
    grantReadData(grantee) {
        return this.table.grantReadData(grantee);
    }
    /**
     * Grant write permissions to a principal
     */
    grantWriteData(grantee) {
        return this.table.grantWriteData(grantee);
    }
    /**
     * Grant full access permissions to a principal
     */
    grantFullAccess(grantee) {
        return this.table.grantFullAccess(grantee);
    }
    /**
     * Grant stream read permissions to a principal
     */
    grantStreamRead(grantee) {
        return this.table.grantStreamRead(grantee);
    }
}
exports.MainTableConstruct = MainTableConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi10YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1haW4tdGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsbUVBQXFEO0FBQ3JELDJDQUF1QztBQWF2Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F1Qkc7QUFDSCxNQUFhLGtCQUFtQixTQUFRLHNCQUFTO0lBRy9DLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBOEI7UUFDdEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQiw4Q0FBOEM7UUFDOUMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLHVCQUF1QixFQUFFO1lBQzdELFNBQVMsRUFBRSxzQkFBc0IsS0FBSyxDQUFDLFdBQVcsRUFBRTtZQUVwRCx5REFBeUQ7WUFDekQsWUFBWSxFQUFFO2dCQUNaLElBQUksRUFBRSxJQUFJO2dCQUNWLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU07YUFDcEM7WUFDRCxPQUFPLEVBQUU7Z0JBQ1AsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTTthQUNwQztZQUVELG1FQUFtRTtZQUNuRSxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlO1lBRWpELDJCQUEyQjtZQUMzQixVQUFVLEVBQUUsUUFBUSxDQUFDLGVBQWUsQ0FBQyxXQUFXO1lBRWhELHdDQUF3QztZQUN4QyxtQkFBbUIsRUFBRSxLQUFLLENBQUMsWUFBWSxJQUFJLEtBQUs7WUFFaEQscUNBQXFDO1lBQ3JDLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxXQUFXLEtBQUssWUFBWTtZQUV0RCxpQkFBaUI7WUFDakIsYUFBYSxFQUFFLEtBQUssQ0FBQyxXQUFXLEtBQUssWUFBWTtnQkFDL0MsQ0FB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TyxFQUFFLG9CQUFvQixDQUFDLENBQUM7UUFDM0QsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLENBQUM7SUFDNUQsQ0FBQztJQUVEOztPQUVHO0lBQ0ksYUFBYSxDQUFDLE9BQStCO1FBQ2xELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVEOztPQUVHO0lBQ0ksY0FBYyxDQUFDLE9BQStCO1FBQ25ELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVEOztPQUVHO0lBQ0ksZUFBZSxDQUFDLE9BQStCO1FBQ3BELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVEOztPQUVHO0lBQ0ksZUFBZSxDQUFDLE9BQStCO1FBQ3BELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDN0MsQ0FBQztDQUNGO0FBN0lELGdEQTZJQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbi8qKlxuICogRHluYW1vREIgTWFpbiBUYWJsZSBDb25maWd1cmF0aW9uXG4gKiBcbiAqIEludGVyZmFjZSBmb3IgY29uZmlndXJpbmcgdGhlIG1haW4gdGFibGUgY29uc3RydWN0IGJhc2VkIG9uIGVudmlyb25tZW50XG4gKiBhbmQgb3BlcmF0aW9uYWwgcmVxdWlyZW1lbnRzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIE1haW5UYWJsZUNvbnN0cnVjdFByb3BzIHtcbiAgZW52aXJvbm1lbnQ6IHN0cmluZztcbiAgZW5hYmxlQmFja3VwPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBEeW5hbW9EQiBNYWluIFRhYmxlIENvbnN0cnVjdCAtIFBoYXNlIDEuMVxuICogXG4gKiBDcmVhdGVzIGFuZCBjb25maWd1cmVzIHRoZSBwcmltYXJ5IER5bmFtb0RCIHRhYmxlIGZvciBhbGwgdjEgZG9tYWluIGVudGl0aWVzXG4gKiB1c2luZyBzaW5nbGUtdGFibGUgZGVzaWduIHBhdHRlcm4gYXMgc3BlY2lmaWVkIGluIHRoZSBjYW5vbmljYWwgYXJjaGl0ZWN0dXJlLlxuICogXG4gKiBGZWF0dXJlczpcbiAqIC0gU2luZ2xlIHRhYmxlIGRlc2lnbiB3aXRoIGZsZXhpYmxlIGFjY2VzcyBwYXR0ZXJuc1xuICogLSBHbG9iYWwgU2Vjb25kYXJ5IEluZGV4ZXMgZm9yIGVmZmljaWVudCBxdWVyaWVzXG4gKiAtIFN0cm9uZyBjb25zaXN0ZW5jeSBmb3IgY3JpdGljYWwgb3BlcmF0aW9uc1xuICogLSBPbi1kZW1hbmQgYmlsbGluZyBmb3IgY29zdCBvcHRpbWl6YXRpb25cbiAqIC0gQmFja3VwIGFuZCBwb2ludC1pbi10aW1lIHJlY292ZXJ5IGZvciBwcm9kdWN0aW9uXG4gKiBcbiAqIEVudGl0eSBTdG9yYWdlIFBhdHRlcm5zIChmcm9tIGNhbm9uaWNhbCBkb21haW4gbW9kZWwpOlxuICogLSBVc2VyczogICAgICAgICAgIFBLPVVTRVIje2lkfSwgICAgICAgICAgIFNLPVBST0ZJTEVcbiAqIC0gQ2x1YnM6ICAgICAgICAgICBQSz1DTFVCI3tpZH0sICAgICAgICAgICBTSz1NRVRBREFUQSAgXG4gKiAtIE1lbWJlcnNoaXBzOiAgICAgUEs9Q0xVQiN7aWR9LCAgICAgICAgICAgU0s9TUVNQkVSI3t1c2VyX2lkfVxuICogLSBSaWRlczogICAgICAgICAgIFBLPUNMVUIje2lkfSwgICAgICAgICAgIFNLPVJJREUje3JpZGVfaWR9XG4gKiAtIFBhcnRpY2lwYXRpb25zOiAgUEs9UklERSN7aWR9LCAgICAgICAgICAgU0s9UEFSVElDSVBBTlQje3VzZXJfaWR9XG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIEFXUyBBcmNoaXRlY3R1cmU6IC5raXJvL3NwZWNzL2FyY2hpdGVjdHVyZS5hd3MudjEubWRcbiAqIC0gRG9tYWluIE1vZGVsOiBBbGwgZW50aXRpZXMgZnJvbSAua2lyby9zcGVjcy9kb21haW4udjEubWRcbiAqL1xuZXhwb3J0IGNsYXNzIE1haW5UYWJsZUNvbnN0cnVjdCBleHRlbmRzIENvbnN0cnVjdCB7XG4gIHB1YmxpYyByZWFkb25seSB0YWJsZTogZHluYW1vZGIuVGFibGU7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IE1haW5UYWJsZUNvbnN0cnVjdFByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIC8vIE1haW4gdGFibGUgd2l0aCBzaW5nbGUtdGFibGUgZGVzaWduIHBhdHRlcm5cbiAgICB0aGlzLnRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdTeWRuZXlDeWNsZXNNYWluVGFibGUnLCB7XG4gICAgICB0YWJsZU5hbWU6IGBzeWRuZXktY3ljbGVzLW1haW4tJHtwcm9wcy5lbnZpcm9ubWVudH1gLFxuICAgICAgXG4gICAgICAvLyBQYXJ0aXRpb24ga2V5IGFuZCBzb3J0IGtleSBmb3IgZmxleGlibGUgZW50aXR5IHN0b3JhZ2VcbiAgICAgIHBhcnRpdGlvbktleToge1xuICAgICAgICBuYW1lOiAnUEsnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgICBzb3J0S2V5OiB7XG4gICAgICAgIG5hbWU6ICdTSycsXG4gICAgICAgIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgICAgfSxcbiAgICAgIFxuICAgICAgLy8gQmlsbGluZyBtb2RlIC0gb24tZGVtYW5kIGZvciB2MSBzaW1wbGljaXR5IGFuZCBjb3N0IG9wdGltaXphdGlvblxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcbiAgICAgIFxuICAgICAgLy8gRW5jcnlwdGlvbiBjb25maWd1cmF0aW9uXG4gICAgICBlbmNyeXB0aW9uOiBkeW5hbW9kYi5UYWJsZUVuY3J5cHRpb24uQVdTX01BTkFHRUQsXG4gICAgICBcbiAgICAgIC8vIFBvaW50LWluLXRpbWUgcmVjb3ZlcnkgZm9yIHByb2R1Y3Rpb25cbiAgICAgIHBvaW50SW5UaW1lUmVjb3Zlcnk6IHByb3BzLmVuYWJsZUJhY2t1cCB8fCBmYWxzZSxcbiAgICAgIFxuICAgICAgLy8gRGVsZXRpb24gcHJvdGVjdGlvbiBmb3IgcHJvZHVjdGlvblxuICAgICAgZGVsZXRpb25Qcm90ZWN0aW9uOiBwcm9wcy5lbnZpcm9ubWVudCA9PT0gJ3Byb2R1Y3Rpb24nLFxuICAgICAgXG4gICAgICAvLyBSZW1vdmFsIHBvbGljeVxuICAgICAgcmVtb3ZhbFBvbGljeTogcHJvcHMuZW52aXJvbm1lbnQgPT09ICdwcm9kdWN0aW9uJyBcbiAgICAgICAgPyBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4gXG4gICAgICAgIDogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIFxuICAgICAgLy8gU3RyZWFtIGNvbmZpZ3VyYXRpb24gZm9yIGZ1dHVyZSBldmVudC1kcml2ZW4gZmVhdHVyZXNcbiAgICAgIHN0cmVhbTogZHluYW1vZGIuU3RyZWFtVmlld1R5cGUuTkVXX0FORF9PTERfSU1BR0VTLFxuICAgICAgXG4gICAgICAvLyBUYWJsZSBjbGFzcyAtIHN0YW5kYXJkIGZvciBnZW5lcmFsIHB1cnBvc2Ugd29ya2xvYWRzXG4gICAgICB0YWJsZUNsYXNzOiBkeW5hbW9kYi5UYWJsZUNsYXNzLlNUQU5EQVJELFxuICAgIH0pO1xuXG4gICAgLy8gR2xvYmFsIFNlY29uZGFyeSBJbmRleCAxOiBVc2VyLWNlbnRyaWMgcXVlcmllc1xuICAgIC8vIEVuYWJsZXMgZWZmaWNpZW50IHF1ZXJpZXMgZm9yIHVzZXIgbWVtYmVyc2hpcHMgYW5kIHBhcnRpY2lwYXRpb25zXG4gICAgdGhpcy50YWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICdHU0kxJyxcbiAgICAgIHBhcnRpdGlvbktleToge1xuICAgICAgICBuYW1lOiAnR1NJMVBLJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgc29ydEtleToge1xuICAgICAgICBuYW1lOiAnR1NJMVNLJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgcHJvamVjdGlvblR5cGU6IGR5bmFtb2RiLlByb2plY3Rpb25UeXBlLkFMTCxcbiAgICB9KTtcblxuICAgIC8vIEdsb2JhbCBTZWNvbmRhcnkgSW5kZXggMjogVGltZS1iYXNlZCBhbmQgc3RhdHVzIHF1ZXJpZXNcbiAgICAvLyBFbmFibGVzIGVmZmljaWVudCBxdWVyaWVzIGZvciByZWNlbnQgcmlkZXMsIHVwY29taW5nIGV2ZW50cywgZXRjLlxuICAgIHRoaXMudGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgaW5kZXhOYW1lOiAnR1NJMicsXG4gICAgICBwYXJ0aXRpb25LZXk6IHtcbiAgICAgICAgbmFtZTogJ0dTSTJQSycsXG4gICAgICAgIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgICAgfSxcbiAgICAgIHNvcnRLZXk6IHtcbiAgICAgICAgbmFtZTogJ0dTSTJTSycsXG4gICAgICAgIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgICAgfSxcbiAgICAgIHByb2plY3Rpb25UeXBlOiBkeW5hbW9kYi5Qcm9qZWN0aW9uVHlwZS5BTEwsXG4gICAgfSk7XG5cbiAgICAvLyBMb2NhbCBTZWNvbmRhcnkgSW5kZXggZm9yIGVudGl0eS1zcGVjaWZpYyBzb3J0aW5nXG4gICAgLy8gVXNlZnVsIGZvciBzb3J0aW5nIHdpdGhpbiB0aGUgc2FtZSBwYXJ0aXRpb24gKGUuZy4sIGNsdWIgcmlkZXMgYnkgZGF0ZSlcbiAgICB0aGlzLnRhYmxlLmFkZExvY2FsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgaW5kZXhOYW1lOiAnTFNJMScsXG4gICAgICBzb3J0S2V5OiB7XG4gICAgICAgIG5hbWU6ICdMU0kxU0snLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgICBwcm9qZWN0aW9uVHlwZTogZHluYW1vZGIuUHJvamVjdGlvblR5cGUuQUxMLFxuICAgIH0pO1xuXG4gICAgLy8gQ2xvdWRXYXRjaCBhbGFybXMgZm9yIG1vbml0b3JpbmcgKHByb2R1Y3Rpb24gb25seSlcbiAgICBpZiAocHJvcHMuZW52aXJvbm1lbnQgPT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgLy8gUmVhZCB0aHJvdHRsZSBhbGFybVxuICAgICAgbmV3IGNkay5hd3NfY2xvdWR3YXRjaC5BbGFybSh0aGlzLCAnUmVhZFRocm90dGxlQWxhcm0nLCB7XG4gICAgICAgIG1ldHJpYzogdGhpcy50YWJsZS5tZXRyaWNVc2VyRXJyb3JzKCksXG4gICAgICAgIHRocmVzaG9sZDogNSxcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICAgIHRyZWF0TWlzc2luZ0RhdGE6IGNkay5hd3NfY2xvdWR3YXRjaC5UcmVhdE1pc3NpbmdEYXRhLk5PVF9CUkVBQ0hJTkcsXG4gICAgICB9KTtcblxuICAgICAgLy8gV3JpdGUgdGhyb3R0bGUgYWxhcm1cbiAgICAgIG5ldyBjZGsuYXdzX2Nsb3Vkd2F0Y2guQWxhcm0odGhpcywgJ1dyaXRlVGhyb3R0bGVBbGFybScsIHtcbiAgICAgICAgbWV0cmljOiB0aGlzLnRhYmxlLm1ldHJpY1N5c3RlbUVycm9ycygpLFxuICAgICAgICB0aHJlc2hvbGQ6IDUsXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxuICAgICAgICB0cmVhdE1pc3NpbmdEYXRhOiBjZGsuYXdzX2Nsb3Vkd2F0Y2guVHJlYXRNaXNzaW5nRGF0YS5OT1RfQlJFQUNISU5HLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQmFja3VwIGNvbmZpZ3VyYXRpb24gZm9yIHByb2R1Y3Rpb25cbiAgICAvLyBOb3RlOiBBV1MgQmFja3VwIGludGVncmF0aW9uIGNhbiBiZSBhZGRlZCBzZXBhcmF0ZWx5IGlmIG5lZWRlZFxuICAgIC8vIFBvaW50LWluLXRpbWUgcmVjb3ZlcnkgaXMgYWxyZWFkeSBlbmFibGVkIGFib3ZlIGZvciBwcm9kdWN0aW9uXG5cbiAgICAvLyBUYWdzIGZvciByZXNvdXJjZSBtYW5hZ2VtZW50IGFuZCBjb3N0IGFsbG9jYXRpb25cbiAgICBjZGsuVGFncy5vZih0aGlzLnRhYmxlKS5hZGQoJ0NvbXBvbmVudCcsICdEYXRhU3RvcmFnZScpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMudGFibGUpLmFkZCgnUGhhc2UnLCAnMS4xLUluZnJhc3RydWN0dXJlJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcy50YWJsZSkuYWRkKCdEYXRhUGF0dGVybicsICdTaW5nbGVUYWJsZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdyYW50IHJlYWQgcGVybWlzc2lvbnMgdG8gYSBwcmluY2lwYWxcbiAgICovXG4gIHB1YmxpYyBncmFudFJlYWREYXRhKGdyYW50ZWU6IGNkay5hd3NfaWFtLklHcmFudGFibGUpOiBjZGsuYXdzX2lhbS5HcmFudCB7XG4gICAgcmV0dXJuIHRoaXMudGFibGUuZ3JhbnRSZWFkRGF0YShncmFudGVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHcmFudCB3cml0ZSBwZXJtaXNzaW9ucyB0byBhIHByaW5jaXBhbFxuICAgKi9cbiAgcHVibGljIGdyYW50V3JpdGVEYXRhKGdyYW50ZWU6IGNkay5hd3NfaWFtLklHcmFudGFibGUpOiBjZGsuYXdzX2lhbS5HcmFudCB7XG4gICAgcmV0dXJuIHRoaXMudGFibGUuZ3JhbnRXcml0ZURhdGEoZ3JhbnRlZSk7XG4gIH1cblxuICAvKipcbiAgICogR3JhbnQgZnVsbCBhY2Nlc3MgcGVybWlzc2lvbnMgdG8gYSBwcmluY2lwYWxcbiAgICovXG4gIHB1YmxpYyBncmFudEZ1bGxBY2Nlc3MoZ3JhbnRlZTogY2RrLmF3c19pYW0uSUdyYW50YWJsZSk6IGNkay5hd3NfaWFtLkdyYW50IHtcbiAgICByZXR1cm4gdGhpcy50YWJsZS5ncmFudEZ1bGxBY2Nlc3MoZ3JhbnRlZSk7XG4gIH1cblxuICAvKipcbiAgICogR3JhbnQgc3RyZWFtIHJlYWQgcGVybWlzc2lvbnMgdG8gYSBwcmluY2lwYWxcbiAgICovXG4gIHB1YmxpYyBncmFudFN0cmVhbVJlYWQoZ3JhbnRlZTogY2RrLmF3c19pYW0uSUdyYW50YWJsZSk6IGNkay5hd3NfaWFtLkdyYW50IHtcbiAgICByZXR1cm4gdGhpcy50YWJsZS5ncmFudFN0cmVhbVJlYWQoZ3JhbnRlZSk7XG4gIH1cbn0iXX0=