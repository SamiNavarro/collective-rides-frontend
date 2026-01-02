// Route File Management Types - Phase 2.4 MVP

export interface RouteFile {
  PK: string; // CLUB#{clubId}#ROUTE#{routeId}
  SK: string; // FILE#{version}
  
  // File metadata
  fileKey: string;           // S3 object key
  fileName: string;          // Original filename
  contentType: string;       // application/gpx+xml
  fileSize: number;          // File size in bytes
  checksum: string;          // File integrity checksum
  
  // Upload information
  uploadedBy: string;        // User ID
  uploadedAt: string;        // ISO timestamp
  uploadSource: 'web' | 'mobile' | 'api';
  
  // Processing status
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingError?: string;  // Error message if failed
  
  // Basic extracted metadata (MVP)
  metadata?: {
    totalDistance: number;   // Total distance in meters
    totalElevationGain: number; // Total elevation gain in meters
    waypoints: number;       // Number of waypoints
    trackPoints: number;     // Number of track points
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
  
  // Version control
  version: number;           // File version number
  previousVersion?: number;  // Previous version reference
  changeDescription?: string; // Description of changes
}

export interface RouteAnalytics {
  PK: string; // CLUB#{clubId}#ROUTE#{routeId}
  SK: string; // ANALYTICS#{version}
  
  // Analytics summary (stored in DynamoDB)
  elevationSummary: {
    totalGain: number;       // Total elevation gain
    totalLoss: number;       // Total elevation loss
    maxElevation: number;    // Highest point
    minElevation: number;    // Lowest point
    pointCount: number;      // Number of profile points
  };
  
  // S3 pointers for large data (MVP approach)
  elevationProfileKey: string;  // S3 key to full elevation profile
  
  // Basic difficulty analysis (MVP)
  difficultyScore: {
    overall: number;         // Overall difficulty (1-10)
    elevation: number;       // Elevation difficulty
    distance: number;        // Distance difficulty
  };
  
  // Basic performance metrics (MVP)
  performanceMetrics: {
    estimatedTime: {
      recreational: number;  // Recreational pace (minutes)
      moderate: number;      // Moderate pace (minutes)
    };
  };
  
  // Generated timestamps
  analyzedAt: string;        // When analysis was performed
  dataVersion: string;       // Analytics algorithm version
}

// API Request/Response Types

export interface RequestUploadUrlRequest {
  fileName: string;
  fileSize: number;
  contentType: string;
  description?: string;
}

export interface RequestUploadUrlResponse {
  success: true;
  data: {
    uploadUrl: string;
    uploadFields: Record<string, string>;
    fileId: string;
    version: number;
    expiresAt: string;
  };
}

export interface ConfirmUploadRequest {
  fileId: string;
  uploadCompleted: boolean;
}

export interface ConfirmUploadResponse {
  success: true;
  data: {
    fileId: string;
    version: number;
    processingStatus: 'pending' | 'processing';
    estimatedProcessingTime: string;
  };
}

export interface FileProcessingStatusResponse {
  success: true;
  data: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    analytics: {
      elevationProfile: boolean;
      basicMetrics: boolean;
    };
    errors: string[];
  };
}

export interface DownloadFileResponse {
  success: true;
  data: {
    downloadUrl: string;
    expiresAt: string;
    fileName: string;
    fileSize: number;
  };
}

export interface RouteAnalyticsResponse {
  success: true;
  data: {
    elevationSummary: {
      totalGain: number;
      totalLoss: number;
      maxElevation: number;
      minElevation: number;
      pointCount: number;
    };
    elevationProfileUrl: string;
    difficultyScore: {
      overall: number;
      elevation: number;
      distance: number;
    };
    performanceMetrics: {
      estimatedTime: {
        recreational: number;
        moderate: number;
      };
    };
  };
}

// Route File Capabilities are now part of ClubCapability enum
// in backend/shared/types/club-authorization.ts

// Error types
export class RouteFileError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'RouteFileError';
  }
}

export class FileProcessingError extends RouteFileError {
  constructor(message: string, public originalError?: Error) {
    super(message, 'FILE_PROCESSING_ERROR', 500);
    this.name = 'FileProcessingError';
  }
}

export class FileValidationError extends RouteFileError {
  constructor(message: string) {
    super(message, 'FILE_VALIDATION_ERROR', 400);
    this.name = 'FileValidationError';
  }
}

export class FileAccessError extends RouteFileError {
  constructor(message: string) {
    super(message, 'FILE_ACCESS_ERROR', 403);
    this.name = 'FileAccessError';
  }
}