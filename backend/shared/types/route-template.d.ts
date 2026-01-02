export interface RouteTemplate {
    PK: string;
    SK: string;
    templateId: string;
    templateName: string;
    description: string;
    tags: string[];
    sourceRouteId: string;
    routeVersion: number;
    category: 'training' | 'recreational' | 'competitive' | 'touring';
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    terrain: 'road' | 'gravel' | 'mountain' | 'mixed';
    usageCount: number;
    visibility: 'private' | 'club';
    allowDownload: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}
export interface CreateTemplateRequest {
    sourceRouteId: string;
    templateName: string;
    description: string;
    tags: string[];
    category: 'training' | 'recreational' | 'competitive' | 'touring';
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    terrain: 'road' | 'gravel' | 'mountain' | 'mixed';
    visibility: 'private' | 'club';
    allowDownload: boolean;
}
export interface CreateTemplateResponse {
    success: true;
    data: {
        templateId: string;
        templateName: string;
        createdAt: string;
        visibility: 'private' | 'club';
        usageCount: number;
    };
}
export interface SearchTemplatesQuery {
    query?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    terrain?: 'road' | 'gravel' | 'mountain' | 'mixed';
    category?: 'training' | 'recreational' | 'competitive' | 'touring';
    limit?: number;
    cursor?: string;
}
export interface SearchTemplatesResponse {
    success: true;
    data: {
        templates: TemplateSearchResult[];
        pagination: {
            limit: number;
            nextCursor?: string;
            hasMore: boolean;
        };
    };
}
export interface TemplateSearchResult {
    templateId: string;
    templateName: string;
    description: string;
    difficulty: string;
    distance?: number;
    elevationGain?: number;
    usageCount: number;
    tags: string[];
}
export declare class RouteTemplateError extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code: string, statusCode?: number);
}
export declare class TemplateNotFoundError extends RouteTemplateError {
    constructor(templateId: string);
}
export declare class TemplateAccessError extends RouteTemplateError {
    constructor(message: string);
}
export declare class TemplateValidationError extends RouteTemplateError {
    constructor(message: string);
}
