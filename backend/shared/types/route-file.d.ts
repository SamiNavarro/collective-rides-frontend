export interface RouteFile {
    PK: string;
    SK: string;
    fileKey: string;
    fileName: string;
    contentType: string;
    fileSize: number;
    checksum: string;
    uploadedBy: string;
    uploadedAt: string;
    uploadSource: 'web' | 'mobile' | 'api';
    processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
    processingError?: string;
    metadata?: {
        totalDistance: number;
        totalElevationGain: number;
        waypoints: number;
        trackPoints: number;
        bounds: {
            north: number;
            south: number;
            east: number;
            west: number;
        };
    };
    version: number;
    previousVersion?: number;
    changeDescription?: string;
}
export interface RouteAnalytics {
    PK: string;
    SK: string;
    elevationSummary: {
        totalGain: number;
        totalLoss: number;
        maxElevation: number;
        minElevation: number;
        pointCount: number;
    };
    elevationProfileKey: string;
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
    analyzedAt: string;
    dataVersion: string;
}
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
export declare class RouteFileError extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code: string, statusCode?: number);
}
export declare class FileProcessingError extends RouteFileError {
    originalError?: Error | undefined;
    constructor(message: string, originalError?: Error | undefined);
}
export declare class FileValidationError extends RouteFileError {
    constructor(message: string);
}
export declare class FileAccessError extends RouteFileError {
    constructor(message: string);
}
