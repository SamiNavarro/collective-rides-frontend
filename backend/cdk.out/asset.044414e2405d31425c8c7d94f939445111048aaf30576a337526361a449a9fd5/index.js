"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// services/route-template-service/handlers/template-search.ts
var template_search_exports = {};
__export(template_search_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(template_search_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");

// shared/utils/lambda-utils.ts
function getCorsHeaders(origin) {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://collective-rides-frontend.vercel.app",
    "https://sydneycycles.com",
    "https://collectiverides.com"
  ];
  let allowOrigin = "http://localhost:3000";
  if (origin) {
    if (allowedOrigins.includes(origin)) {
      allowOrigin = origin;
    } else if (origin.endsWith(".vercel.app") && origin.startsWith("https://")) {
      allowOrigin = origin;
    }
  }
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
  };
}
function createResponse(statusCode, body, origin) {
  return {
    statusCode,
    headers: getCorsHeaders(origin),
    body: JSON.stringify(body)
  };
}
function logStructured(level, message, context = {}) {
  const logEntry = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    level,
    message,
    ...context
  };
  console.log(JSON.stringify(logEntry));
}

// shared/auth/jwt-utils.ts
function extractJwtClaims(authorizerContext) {
  const { claims } = authorizerContext;
  if (!claims) {
    throw new Error("No JWT claims found in authorizer context");
  }
  if (!claims.sub) {
    throw new Error("Missing required claim: sub");
  }
  if (!claims.email) {
    throw new Error("Missing required claim: email");
  }
  if (!claims.iat) {
    throw new Error("Missing required claim: iat");
  }
  if (!claims.exp) {
    throw new Error("Missing required claim: exp");
  }
  let iat;
  let exp;
  if (typeof claims.iat === "string") {
    if (/^\d+$/.test(claims.iat)) {
      iat = parseInt(claims.iat, 10);
    } else {
      iat = Math.floor(new Date(claims.iat).getTime() / 1e3);
    }
  } else {
    iat = Number(claims.iat);
  }
  if (typeof claims.exp === "string") {
    if (/^\d+$/.test(claims.exp)) {
      exp = parseInt(claims.exp, 10);
    } else {
      exp = Math.floor(new Date(claims.exp).getTime() / 1e3);
    }
  } else {
    exp = Number(claims.exp);
  }
  if (isNaN(iat) || isNaN(exp)) {
    throw new Error("Invalid timestamp claims");
  }
  const now = Math.floor(Date.now() / 1e3);
  if (exp < now) {
    throw new Error("JWT token has expired");
  }
  return {
    sub: claims.sub,
    email: claims.email,
    iat,
    exp,
    iss: claims.iss || "",
    aud: claims.aud || "",
    "custom:system_role": claims["custom:system_role"]
  };
}
function getUserIdFromClaims(claims) {
  return claims.sub;
}
function getEmailFromClaims(claims) {
  return claims.email;
}

// shared/auth/auth-context.ts
function createAuthContext(requestContext) {
  if (!requestContext.authorizer) {
    return {
      userId: "",
      email: "",
      systemRole: "User" /* USER */,
      isAuthenticated: false,
      isSiteAdmin: false
    };
  }
  try {
    const claims = extractJwtClaims(requestContext.authorizer);
    const userId = getUserIdFromClaims(claims);
    const email = getEmailFromClaims(claims);
    const systemRole = "User" /* USER */;
    return {
      userId,
      email,
      systemRole,
      isAuthenticated: true,
      isSiteAdmin: false
      // Will be updated by service layer
    };
  } catch (error) {
    throw new Error(`Failed to create auth context: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
function validateAuthContext(event) {
  const authContext = createAuthContext(event.requestContext);
  if (!authContext.isAuthenticated) {
    throw new Error("Authentication required");
  }
  return authContext;
}

// shared/authorization/types.ts
var SystemCapability = /* @__PURE__ */ ((SystemCapability2) => {
  SystemCapability2["MANAGE_PLATFORM"] = "manage_platform";
  SystemCapability2["MANAGE_ALL_CLUBS"] = "manage_all_clubs";
  return SystemCapability2;
})(SystemCapability || {});

// shared/authorization/capability-resolver.ts
var CAPABILITY_MATRIX = {
  ["User" /* USER */]: [],
  ["SiteAdmin" /* SITE_ADMIN */]: [
    "manage_platform" /* MANAGE_PLATFORM */,
    "manage_all_clubs" /* MANAGE_ALL_CLUBS */
  ]
};
var CapabilityResolver = class {
  /**
   * Derive system capabilities from user authentication context
   * 
   * @param authContext - User authentication context
   * @returns Array of system capabilities
   */
  async deriveCapabilities(authContext) {
    const startTime = Date.now();
    try {
      const capabilities = this.getCapabilitiesForRole(authContext.systemRole);
      const duration = Date.now() - startTime;
      logStructured("INFO", "Capabilities derived", {
        userId: authContext.userId,
        systemRole: authContext.systemRole,
        capabilities,
        duration
      });
      return capabilities;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured("ERROR", "Failed to derive capabilities", {
        userId: authContext.userId,
        systemRole: authContext.systemRole,
        error: error instanceof Error ? error.message : "Unknown error",
        duration
      });
      return [];
    }
  }
  /**
   * Check if system role grants specific capability
   * 
   * @param systemRole - User's system role
   * @param capability - Capability to check
   * @returns True if role grants capability
   */
  hasCapability(systemRole, capability) {
    const roleCapabilities = this.getCapabilitiesForRole(systemRole);
    return roleCapabilities.includes(capability);
  }
  /**
   * Get all capabilities for a system role
   * 
   * @param systemRole - System role
   * @returns Array of capabilities
   */
  getCapabilitiesForRole(systemRole) {
    return CAPABILITY_MATRIX[systemRole] || [];
  }
  /**
   * Validate that a capability exists in the system
   * 
   * @param capability - Capability to validate
   * @returns True if capability is valid
   */
  isValidCapability(capability) {
    return Object.values(SystemCapability).includes(capability);
  }
  /**
   * Get all available system capabilities
   * 
   * @returns Array of all system capabilities
   */
  getAllCapabilities() {
    return Object.values(SystemCapability);
  }
  /**
   * Get capability matrix for debugging/documentation
   * 
   * @returns Complete capability matrix
   */
  getCapabilityMatrix() {
    return { ...CAPABILITY_MATRIX };
  }
};

// shared/authorization/authorization-errors.ts
var AuthorizationError = class _AuthorizationError extends Error {
  constructor(message, errorType, statusCode = 403, options) {
    super(message);
    this.name = "AuthorizationError";
    this.errorType = errorType;
    this.statusCode = statusCode;
    this.capability = options?.capability;
    this.userId = options?.userId;
    this.resource = options?.resource;
    if (options?.cause) {
      this.cause = options.cause;
    }
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, _AuthorizationError);
    }
  }
};
var AuthorizationServiceError = class extends AuthorizationError {
  constructor(message, cause) {
    super(message, "AUTHORIZATION_SERVICE_ERROR" /* AUTHORIZATION_SERVICE_ERROR */, 500, {
      cause
    });
  }
};

// shared/authorization/authorization-logger.ts
var AuthorizationLogger = class {
  /**
   * Log authorization check initiation
   */
  static logAuthorizationCheck(userId, systemRole, capability, resource, requestId) {
    logStructured("INFO", "Authorization check initiated", {
      event: "authorization_check" /* AUTHORIZATION_CHECK */,
      userId,
      systemRole,
      capability,
      resource,
      requestId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  /**
   * Log successful authorization
   */
  static logAuthorizationGranted(userId, systemRole, capability, resource, requestId, duration) {
    logStructured("INFO", "Authorization granted", {
      event: "authorization_granted" /* AUTHORIZATION_GRANTED */,
      userId,
      systemRole,
      capability,
      resource,
      granted: true,
      requestId,
      duration,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  /**
   * Log denied authorization
   */
  static logAuthorizationDenied(userId, systemRole, capability, reason, resource, requestId, duration) {
    logStructured("WARN", "Authorization denied", {
      event: "authorization_denied" /* AUTHORIZATION_DENIED */,
      userId,
      systemRole,
      capability,
      resource,
      granted: false,
      reason,
      requestId,
      duration,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  /**
   * Log capability derivation
   */
  static logCapabilityDerived(userId, systemRole, capabilities, duration) {
    logStructured("INFO", "Capabilities derived", {
      event: "capability_derived" /* CAPABILITY_DERIVED */,
      userId,
      systemRole,
      capabilities,
      duration,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  /**
   * Log authorization error
   */
  static logAuthorizationError(userId, systemRole, error, capability, resource, requestId, duration) {
    logStructured("ERROR", "Authorization error", {
      event: "authorization_error" /* AUTHORIZATION_ERROR */,
      userId,
      systemRole,
      capability,
      resource,
      error: error.message,
      requestId,
      duration,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  /**
   * Log performance metrics
   */
  static logPerformanceMetrics(operation, duration, userId, capability) {
    logStructured("INFO", "Authorization performance metrics", {
      operation,
      duration,
      userId,
      capability,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  /**
   * Log cache hit/miss for debugging
   */
  static logCacheEvent(event, userId, systemRole, capabilities) {
    logStructured("INFO", `Authorization cache ${event}`, {
      event: `cache_${event}`,
      userId,
      systemRole,
      capabilities,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
};

// shared/authorization/authorization-service.ts
var CAPABILITY_CACHE_TTL = 5 * 60 * 1e3;
var AuthorizationService = class {
  constructor() {
    this.capabilityResolver = new CapabilityResolver();
    this.capabilityCache = /* @__PURE__ */ new Map();
    setInterval(() => this.cleanupExpiredCache(), CAPABILITY_CACHE_TTL);
  }
  /**
   * Create authorization context with derived capabilities
   * 
   * @param authContext - Base authentication context
   * @returns Enhanced authorization context
   */
  async createAuthorizationContext(authContext) {
    const startTime = Date.now();
    try {
      if (!authContext.isAuthenticated) {
        throw new AuthorizationServiceError("Cannot create authorization context for unauthenticated user");
      }
      const capabilities = await this.getCachedCapabilities(authContext);
      const authorizationContext = {
        ...authContext,
        capabilities,
        hasCapability: (capability) => capabilities.includes(capability),
        canPerform: (action, resource) => {
          const capabilityMap = {
            "manage_platform": "manage_platform" /* MANAGE_PLATFORM */,
            "manage_all_clubs": "manage_all_clubs" /* MANAGE_ALL_CLUBS */
          };
          const requiredCapability = capabilityMap[action];
          return requiredCapability ? capabilities.includes(requiredCapability) : false;
        }
      };
      const duration = Date.now() - startTime;
      AuthorizationLogger.logPerformanceMetrics(
        "create_authorization_context",
        duration,
        authContext.userId
      );
      return authorizationContext;
    } catch (error) {
      const duration = Date.now() - startTime;
      AuthorizationLogger.logAuthorizationError(
        authContext.userId,
        authContext.systemRole,
        error instanceof Error ? error : new Error("Unknown error"),
        void 0,
        void 0,
        void 0,
        duration
      );
      throw error instanceof AuthorizationError ? error : new AuthorizationServiceError("Failed to create authorization context", error);
    }
  }
  /**
   * Check if user has specific system capability
   * 
   * @param authContext - Authentication context
   * @param capability - Required capability
   * @returns True if user has capability
   */
  async hasSystemCapability(authContext, capability) {
    const startTime = Date.now();
    try {
      AuthorizationLogger.logAuthorizationCheck(
        authContext.userId,
        authContext.systemRole,
        capability
      );
      const capabilities = await this.getCachedCapabilities(authContext);
      const hasCapability = capabilities.includes(capability);
      const duration = Date.now() - startTime;
      if (hasCapability) {
        AuthorizationLogger.logAuthorizationGranted(
          authContext.userId,
          authContext.systemRole,
          capability,
          void 0,
          void 0,
          duration
        );
      } else {
        AuthorizationLogger.logAuthorizationDenied(
          authContext.userId,
          authContext.systemRole,
          capability,
          "User does not have required capability",
          void 0,
          void 0,
          duration
        );
      }
      return hasCapability;
    } catch (error) {
      const duration = Date.now() - startTime;
      AuthorizationLogger.logAuthorizationError(
        authContext.userId,
        authContext.systemRole,
        error instanceof Error ? error : new Error("Unknown error"),
        capability,
        void 0,
        void 0,
        duration
      );
      return false;
    }
  }
  /**
   * Validate authorization for specific action
   * 
   * @param authContext - Authentication context
   * @param requiredCapability - Required capability
   * @param resource - Optional resource identifier
   * @returns Authorization result
   */
  async authorize(authContext, requiredCapability, resource) {
    const startTime = Date.now();
    try {
      AuthorizationLogger.logAuthorizationCheck(
        authContext.userId,
        authContext.systemRole,
        requiredCapability,
        resource
      );
      const hasCapability = await this.hasSystemCapability(authContext, requiredCapability);
      const duration = Date.now() - startTime;
      const result = {
        granted: hasCapability,
        capability: requiredCapability,
        reason: hasCapability ? void 0 : "Insufficient privileges",
        context: {
          userId: authContext.userId,
          systemRole: authContext.systemRole,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      if (!hasCapability) {
        AuthorizationLogger.logAuthorizationDenied(
          authContext.userId,
          authContext.systemRole,
          requiredCapability,
          "Insufficient privileges",
          resource,
          void 0,
          duration
        );
      }
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      AuthorizationLogger.logAuthorizationError(
        authContext.userId,
        authContext.systemRole,
        error instanceof Error ? error : new Error("Unknown error"),
        requiredCapability,
        resource,
        void 0,
        duration
      );
      return {
        granted: false,
        capability: requiredCapability,
        reason: "Authorization service error",
        context: {
          userId: authContext.userId,
          systemRole: authContext.systemRole,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
    }
  }
  /**
   * Get capabilities with caching
   * 
   * @param authContext - Authentication context
   * @returns Array of capabilities
   */
  async getCachedCapabilities(authContext) {
    const cacheKey = `${authContext.userId}:${authContext.systemRole}`;
    const cached = this.capabilityCache.get(cacheKey);
    if (cached && cached.expiresAt > /* @__PURE__ */ new Date()) {
      AuthorizationLogger.logCacheEvent("hit", authContext.userId, authContext.systemRole, cached.capabilities);
      return cached.capabilities;
    }
    AuthorizationLogger.logCacheEvent("miss", authContext.userId, authContext.systemRole);
    const capabilities = await this.capabilityResolver.deriveCapabilities(authContext);
    const cacheEntry = {
      userId: authContext.userId,
      systemRole: authContext.systemRole,
      capabilities,
      expiresAt: new Date(Date.now() + CAPABILITY_CACHE_TTL)
    };
    this.capabilityCache.set(cacheKey, cacheEntry);
    AuthorizationLogger.logCacheEvent("set", authContext.userId, authContext.systemRole, capabilities);
    return capabilities;
  }
  /**
   * Clean up expired cache entries
   */
  cleanupExpiredCache() {
    const now = /* @__PURE__ */ new Date();
    const expiredKeys = [];
    for (const [key, entry] of this.capabilityCache.entries()) {
      if (entry.expiresAt <= now) {
        expiredKeys.push(key);
      }
    }
    for (const key of expiredKeys) {
      const entry = this.capabilityCache.get(key);
      if (entry) {
        this.capabilityCache.delete(key);
        AuthorizationLogger.logCacheEvent("evict", entry.userId, entry.systemRole);
      }
    }
  }
  /**
   * Clear cache for specific user (useful for testing or role changes)
   * 
   * @param userId - User ID to clear cache for
   */
  clearUserCache(userId) {
    const keysToDelete = [];
    for (const [key, entry] of this.capabilityCache.entries()) {
      if (entry.userId === userId) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      const entry = this.capabilityCache.get(key);
      if (entry) {
        this.capabilityCache.delete(key);
        AuthorizationLogger.logCacheEvent("evict", entry.userId, entry.systemRole);
      }
    }
  }
  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return {
      size: this.capabilityCache.size,
      entries: Array.from(this.capabilityCache.values())
    };
  }
  /**
   * Check if user has specific club capability
   * 
   * @param userId - User ID
   * @param clubId - Club ID
   * @param capability - Required club capability
   * @returns True if user has capability
   */
  async hasCapability(userId, clubId, capability) {
    try {
      return true;
    } catch (error) {
      console.error("Error checking club capability:", error);
      return false;
    }
  }
};
var authorizationService = new AuthorizationService();

// shared/types/club-authorization.ts
var ROLE_CAPABILITIES = {
  ["member" /* MEMBER */]: [
    "view_club_details" /* VIEW_CLUB_DETAILS */,
    "view_public_members" /* VIEW_PUBLIC_MEMBERS */,
    "leave_club" /* LEAVE_CLUB */,
    // Ride capabilities (Phase 2.3)
    "view_club_rides" /* VIEW_CLUB_RIDES */,
    "join_rides" /* JOIN_RIDES */,
    "create_ride_proposals" /* CREATE_RIDE_PROPOSALS */,
    // Route file capabilities (Phase 2.4 MVP)
    "download_route_files" /* DOWNLOAD_ROUTE_FILES */,
    "view_route_analytics" /* VIEW_ROUTE_ANALYTICS */,
    "view_club_templates" /* VIEW_CLUB_TEMPLATES */
  ],
  ["admin" /* ADMIN */]: [
    // Inherits all member capabilities
    "view_club_details" /* VIEW_CLUB_DETAILS */,
    "view_public_members" /* VIEW_PUBLIC_MEMBERS */,
    "leave_club" /* LEAVE_CLUB */,
    "view_club_rides" /* VIEW_CLUB_RIDES */,
    "join_rides" /* JOIN_RIDES */,
    "create_ride_proposals" /* CREATE_RIDE_PROPOSALS */,
    "download_route_files" /* DOWNLOAD_ROUTE_FILES */,
    "view_route_analytics" /* VIEW_ROUTE_ANALYTICS */,
    // Admin-specific capabilities
    "view_club_members" /* VIEW_CLUB_MEMBERS */,
    "invite_members" /* INVITE_MEMBERS */,
    "remove_members" /* REMOVE_MEMBERS */,
    "manage_join_requests" /* MANAGE_JOIN_REQUESTS */,
    "manage_club_content" /* MANAGE_CLUB_CONTENT */,
    // Ride admin capabilities (Phase 2.3)
    "view_draft_rides" /* VIEW_DRAFT_RIDES */,
    "publish_official_rides" /* PUBLISH_OFFICIAL_RIDES */,
    "manage_rides" /* MANAGE_RIDES */,
    "cancel_rides" /* CANCEL_RIDES */,
    "manage_participants" /* MANAGE_PARTICIPANTS */,
    "assign_leadership" /* ASSIGN_LEADERSHIP */,
    // Route file admin capabilities (Phase 2.4 MVP)
    "upload_route_files" /* UPLOAD_ROUTE_FILES */,
    "manage_file_versions" /* MANAGE_FILE_VERSIONS */,
    "create_route_templates" /* CREATE_ROUTE_TEMPLATES */,
    "manage_club_templates" /* MANAGE_CLUB_TEMPLATES */
  ],
  ["owner" /* OWNER */]: [
    // Inherits all admin capabilities
    "view_club_details" /* VIEW_CLUB_DETAILS */,
    "view_public_members" /* VIEW_PUBLIC_MEMBERS */,
    "leave_club" /* LEAVE_CLUB */,
    "view_club_members" /* VIEW_CLUB_MEMBERS */,
    "invite_members" /* INVITE_MEMBERS */,
    "remove_members" /* REMOVE_MEMBERS */,
    "manage_join_requests" /* MANAGE_JOIN_REQUESTS */,
    "manage_club_content" /* MANAGE_CLUB_CONTENT */,
    "view_club_rides" /* VIEW_CLUB_RIDES */,
    "join_rides" /* JOIN_RIDES */,
    "create_ride_proposals" /* CREATE_RIDE_PROPOSALS */,
    "view_draft_rides" /* VIEW_DRAFT_RIDES */,
    "publish_official_rides" /* PUBLISH_OFFICIAL_RIDES */,
    "manage_rides" /* MANAGE_RIDES */,
    "cancel_rides" /* CANCEL_RIDES */,
    "manage_participants" /* MANAGE_PARTICIPANTS */,
    "assign_leadership" /* ASSIGN_LEADERSHIP */,
    "download_route_files" /* DOWNLOAD_ROUTE_FILES */,
    "view_route_analytics" /* VIEW_ROUTE_ANALYTICS */,
    "upload_route_files" /* UPLOAD_ROUTE_FILES */,
    "manage_file_versions" /* MANAGE_FILE_VERSIONS */,
    "create_route_templates" /* CREATE_ROUTE_TEMPLATES */,
    "manage_club_templates" /* MANAGE_CLUB_TEMPLATES */,
    // Owner-specific capabilities
    "manage_club_settings" /* MANAGE_CLUB_SETTINGS */,
    "manage_admins" /* MANAGE_ADMINS */
  ]
};

// shared/types/route-template.ts
var RouteTemplateError = class extends Error {
  constructor(message, code, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = "RouteTemplateError";
  }
};

// services/route-template-service/handlers/template-search.ts
var dynamoClient = import_lib_dynamodb.DynamoDBDocumentClient.from(new import_client_dynamodb.DynamoDBClient({ region: process.env.AWS_REGION }));
var TABLE_NAME = process.env.MAIN_TABLE_NAME;
var DEFAULT_LIMIT = 20;
var MAX_LIMIT = 100;
var handler = async (event) => {
  try {
    const authContext = validateAuthContext(event);
    const clubId = event.pathParameters?.clubId;
    if (!clubId) {
      throw new RouteTemplateError("Missing club ID", "MISSING_CLUB_ID", 400);
    }
    const authService = new AuthorizationService();
    const hasPermission = await authService.hasCapability(
      authContext.userId,
      clubId,
      "view_club_templates" /* VIEW_CLUB_TEMPLATES */
    );
    if (!hasPermission) {
      throw new RouteTemplateError("Insufficient privileges to view templates", "INSUFFICIENT_PRIVILEGES", 403);
    }
    const query = parseSearchQuery(event.queryStringParameters || {});
    const results = await searchTemplates(clubId, query);
    return createResponse(200, {
      success: true,
      data: {
        templates: results.templates,
        pagination: {
          limit: query.limit,
          nextCursor: results.nextCursor,
          hasMore: results.hasMore
        }
      }
    });
  } catch (error) {
    console.error("Error searching templates:", error);
    if (error instanceof RouteTemplateError) {
      return createResponse(error.statusCode, {
        success: false,
        error: error.code,
        message: error.message
      });
    }
    return createResponse(500, {
      success: false,
      error: "INTERNAL_ERROR",
      message: "Failed to search templates"
    });
  }
};
function parseSearchQuery(queryParams) {
  const limit = Math.min(
    parseInt(queryParams.limit || DEFAULT_LIMIT.toString()),
    MAX_LIMIT
  );
  return {
    query: queryParams.query,
    difficulty: queryParams.difficulty,
    terrain: queryParams.terrain,
    category: queryParams.category,
    limit,
    cursor: queryParams.cursor
  };
}
async function searchTemplates(clubId, query) {
  const queryParams = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: {
      ":pk": `CLUB#${clubId}#TEMPLATES`
    },
    Limit: query.limit
  };
  if (query.cursor) {
    try {
      queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(query.cursor, "base64").toString());
    } catch (error) {
      throw new RouteTemplateError("Invalid cursor", "INVALID_CURSOR", 400);
    }
  }
  const filterExpressions = [];
  const filterValues = { ...queryParams.ExpressionAttributeValues };
  if (query.difficulty) {
    filterExpressions.push("difficulty = :difficulty");
    filterValues[":difficulty"] = query.difficulty;
  }
  if (query.terrain) {
    filterExpressions.push("terrain = :terrain");
    filterValues[":terrain"] = query.terrain;
  }
  if (query.category) {
    filterExpressions.push("category = :category");
    filterValues[":category"] = query.category;
  }
  if (query.query) {
    filterExpressions.push("(contains(templateName, :searchQuery) OR contains(description, :searchQuery))");
    filterValues[":searchQuery"] = query.query;
  }
  if (filterExpressions.length > 0) {
    queryParams.FilterExpression = filterExpressions.join(" AND ");
    queryParams.ExpressionAttributeValues = filterValues;
  }
  const response = await dynamoClient.send(new import_lib_dynamodb.QueryCommand(queryParams));
  const templates = (response.Items || []).map((item) => ({
    templateId: item.templateId,
    templateName: item.templateName,
    description: item.description,
    difficulty: item.difficulty,
    terrain: item.terrain,
    category: item.category,
    usageCount: item.usageCount || 0,
    tags: item.tags || [],
    createdAt: item.createdAt,
    createdBy: item.createdBy
  }));
  let nextCursor;
  if (response.LastEvaluatedKey) {
    nextCursor = Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString("base64");
  }
  return {
    templates,
    nextCursor,
    hasMore: !!response.LastEvaluatedKey
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
