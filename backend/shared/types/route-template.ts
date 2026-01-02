// Route Template Types - Phase 2.4 MVP

export interface RouteTemplate {
  PK: string; // CLUB#{clubId}#TEMPLATES
  SK: string; // TEMPLATE#{templateId}
  
  // Template metadata
  templateId: string;        // Unique template identifier
  templateName: string;      // Display name
  description: string;       // Detailed description
  tags: string[];           // Searchable tags
  
  // Route reference
  sourceRouteId: string;     // Original route ID
  routeVersion: number;      // Route version used
  
  // Basic classification (MVP)
  category: 'training' | 'recreational' | 'competitive' | 'touring';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  terrain: 'road' | 'gravel' | 'mountain' | 'mixed';
  
  // Usage statistics (MVP)
  usageCount: number;        // Times used in rides
  
  // Club-scoped sharing (MVP)
  visibility: 'private' | 'club';  // Public deferred
  allowDownload: boolean;   // Allow GPX download
  
  // Template metadata
  createdBy: string;        // Creator user ID
  createdAt: string;        // Creation timestamp
  updatedAt: string;        // Last update timestamp
}

// API Request/Response Types

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

// Template Capabilities are now part of ClubCapability enum
// in backend/shared/types/club-authorization.ts

// Error types
export class RouteTemplateError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'RouteTemplateError';
  }
}

export class TemplateNotFoundError extends RouteTemplateError {
  constructor(templateId: string) {
    super(`Template not found: ${templateId}`, 'TEMPLATE_NOT_FOUND', 404);
    this.name = 'TemplateNotFoundError';
  }
}

export class TemplateAccessError extends RouteTemplateError {
  constructor(message: string) {
    super(message, 'TEMPLATE_ACCESS_ERROR', 403);
    this.name = 'TemplateAccessError';
  }
}

export class TemplateValidationError extends RouteTemplateError {
  constructor(message: string) {
    super(message, 'TEMPLATE_VALIDATION_ERROR', 400);
    this.name = 'TemplateValidationError';
  }
}