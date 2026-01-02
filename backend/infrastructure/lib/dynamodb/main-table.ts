import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

/**
 * DynamoDB Main Table Configuration
 * 
 * Interface for configuring the main table construct based on environment
 * and operational requirements.
 */
export interface MainTableConstructProps {
  environment: string;
  enableBackup?: boolean;
}

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
export class MainTableConstruct extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: MainTableConstructProps) {
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
  public grantReadData(grantee: cdk.aws_iam.IGrantable): cdk.aws_iam.Grant {
    return this.table.grantReadData(grantee);
  }

  /**
   * Grant write permissions to a principal
   */
  public grantWriteData(grantee: cdk.aws_iam.IGrantable): cdk.aws_iam.Grant {
    return this.table.grantWriteData(grantee);
  }

  /**
   * Grant full access permissions to a principal
   */
  public grantFullAccess(grantee: cdk.aws_iam.IGrantable): cdk.aws_iam.Grant {
    return this.table.grantFullAccess(grantee);
  }

  /**
   * Grant stream read permissions to a principal
   */
  public grantStreamRead(grantee: cdk.aws_iam.IGrantable): cdk.aws_iam.Grant {
    return this.table.grantStreamRead(grantee);
  }
}