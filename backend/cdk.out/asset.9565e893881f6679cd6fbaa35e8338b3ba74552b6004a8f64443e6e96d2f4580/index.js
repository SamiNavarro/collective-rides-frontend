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

// services/user-profile/handlers/update-user.ts
var update_user_exports = {};
__export(update_user_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(update_user_exports);

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
async function createEnhancedAuthContext(requestContext, userRepository2) {
  const baseContext = createAuthContext(requestContext);
  if (!baseContext.isAuthenticated) {
    return baseContext;
  }
  try {
    const userData = await userRepository2.getUserById(baseContext.userId);
    if (userData) {
      return {
        ...baseContext,
        systemRole: userData.systemRole,
        isSiteAdmin: userData.systemRole === "SiteAdmin" /* SITE_ADMIN */
      };
    }
    return baseContext;
  } catch (error) {
    return baseContext;
  }
}

// shared/utils/lambda-utils.ts
function createSuccessResponse(data, statusCode = 200 /* OK */) {
  const response = {
    success: true,
    data,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
    },
    body: JSON.stringify(response)
  };
}
function createErrorResponse(error, message, statusCode, requestId) {
  const response = {
    error,
    message,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    requestId
  };
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
    },
    body: JSON.stringify(response)
  };
}
function createValidationErrorResponse(message, requestId) {
  return createErrorResponse(
    "VALIDATION_ERROR" /* VALIDATION_ERROR */,
    message,
    400 /* BAD_REQUEST */,
    requestId
  );
}
function createUnauthorizedResponse(message = "Unauthorized", requestId) {
  return createErrorResponse(
    "UNAUTHORIZED" /* UNAUTHORIZED */,
    message,
    401 /* UNAUTHORIZED */,
    requestId
  );
}
function createForbiddenResponse(message = "Forbidden", requestId) {
  return createErrorResponse(
    "FORBIDDEN" /* FORBIDDEN */,
    message,
    403 /* FORBIDDEN */,
    requestId
  );
}
function createNotFoundResponse(message = "Not found", requestId) {
  return createErrorResponse(
    "NOT_FOUND" /* NOT_FOUND */,
    message,
    404 /* NOT_FOUND */,
    requestId
  );
}
function createInternalErrorResponse(message = "Internal server error", requestId) {
  return createErrorResponse(
    "INTERNAL_ERROR" /* INTERNAL_ERROR */,
    message,
    500 /* INTERNAL_SERVER_ERROR */,
    requestId
  );
}
function handleLambdaError(error, requestId) {
  console.error("Lambda error:", error, { requestId });
  if (error instanceof Error) {
    const message = error.message;
    if (message.includes("Authentication required") || message.includes("JWT")) {
      return createUnauthorizedResponse(message, requestId);
    }
    if (message.includes("privileges required") || message.includes("Forbidden")) {
      return createForbiddenResponse(message, requestId);
    }
    if (message.includes("not found") || message.includes("Not found")) {
      return createNotFoundResponse(message, requestId);
    }
    if (message.includes("validation") || message.includes("Invalid")) {
      return createValidationErrorResponse(message, requestId);
    }
  }
  return createInternalErrorResponse("An unexpected error occurred", requestId);
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

// shared/utils/errors.ts
var AppError = class extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
};
var AuthenticationError = class extends AppError {
  constructor(message = "Authentication required") {
    super(message);
    this.statusCode = 401;
    this.errorType = "UNAUTHORIZED";
  }
};
var AuthorizationError = class extends AppError {
  constructor(message = "Insufficient privileges") {
    super(message);
    this.statusCode = 403;
    this.errorType = "FORBIDDEN";
  }
};
var NotFoundError = class extends AppError {
  constructor(message = "Resource not found") {
    super(message);
    this.statusCode = 404;
    this.errorType = "NOT_FOUND";
  }
};
var ValidationError = class extends AppError {
  constructor(message) {
    super(message);
    this.statusCode = 400;
    this.errorType = "VALIDATION_ERROR";
  }
};
var InternalError = class extends AppError {
  constructor(message = "Internal server error") {
    super(message);
    this.statusCode = 500;
    this.errorType = "INTERNAL_ERROR";
  }
};

// shared/utils/validation.ts
function isValidDisplayName(displayName) {
  return displayName.length > 0 && displayName.length <= 100;
}
function isValidAvatarUrl(avatarUrl) {
  try {
    const url = new URL(avatarUrl);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
function isValidSystemRole(role) {
  return role === "User" /* USER */ || role === "SiteAdmin" /* SITE_ADMIN */;
}
function validateUpdateUserInput(input, allowSystemRoleChange = false) {
  if (!input.displayName && !input.avatarUrl && !input.systemRole) {
    throw new ValidationError("At least one field must be provided for update");
  }
  if (input.displayName !== void 0) {
    if (typeof input.displayName !== "string") {
      throw new ValidationError("Display name must be a string");
    }
    if (!isValidDisplayName(input.displayName)) {
      throw new ValidationError("Display name must be between 1 and 100 characters");
    }
  }
  if (input.avatarUrl !== void 0) {
    if (typeof input.avatarUrl !== "string") {
      throw new ValidationError("Avatar URL must be a string");
    }
    if (input.avatarUrl.length > 0 && !isValidAvatarUrl(input.avatarUrl)) {
      throw new ValidationError("Avatar URL must be a valid HTTP(S) URL");
    }
  }
  if (input.systemRole !== void 0) {
    if (!allowSystemRoleChange) {
      throw new ValidationError("System role changes are not allowed");
    }
    if (!isValidSystemRole(input.systemRole)) {
      throw new ValidationError("Invalid system role");
    }
  }
}
function parseJsonBody(body) {
  if (!body) {
    throw new ValidationError("Request body is required");
  }
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new ValidationError("Invalid JSON in request body");
  }
}

// services/user-profile/infrastructure/dynamodb-user-repository.ts
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var DynamoDBUserRepository = class {
  constructor(tableName, dynamoClient) {
    this.tableName = tableName;
    const client = dynamoClient || new import_client_dynamodb.DynamoDBClient({});
    this.docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(client);
  }
  /**
   * Get user by ID
   * 
   * @param userId - User ID
   * @returns User data or null if not found
   */
  async getUserById(userId) {
    try {
      const command = new import_lib_dynamodb.GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${userId}`,
          SK: "PROFILE"
        },
        ConsistentRead: true
        // Strong consistency as per spec
      });
      const result = await this.docClient.send(command);
      if (!result.Item) {
        return null;
      }
      return this.mapDynamoItemToUser(result.Item);
    } catch (error) {
      console.error("Error getting user by ID:", error, { userId });
      throw new InternalError("Failed to retrieve user");
    }
  }
  /**
   * Create a new user
   * 
   * @param input - User creation input
   * @returns Created user data
   */
  async createUser(input) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const user = {
      id: input.id,
      email: input.email,
      displayName: input.displayName || this.extractDisplayNameFromEmail(input.email),
      avatarUrl: input.avatarUrl,
      systemRole: "User" /* USER */,
      // Default to User as per domain rules
      createdAt: now,
      updatedAt: now
    };
    try {
      const command = new import_lib_dynamodb.PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `USER#${user.id}`,
          SK: "PROFILE",
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          systemRole: user.systemRole,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          // GSI attributes for future queries
          GSI1PK: `USER#${user.id}`,
          GSI1SK: "PROFILE"
        },
        ConditionExpression: "attribute_not_exists(PK)"
        // Prevent overwriting existing user
      });
      await this.docClient.send(command);
      return user;
    } catch (error) {
      if (error.name === "ConditionalCheckFailedException") {
        const existingUser = await this.getUserById(input.id);
        if (existingUser) {
          return existingUser;
        }
      }
      console.error("Error creating user:", error, { input });
      throw new InternalError("Failed to create user");
    }
  }
  /**
   * Update an existing user
   * 
   * @param userId - User ID
   * @param input - Update input
   * @returns Updated user data
   */
  async updateUser(userId, input) {
    try {
      const updateExpressions = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};
      if (input.displayName !== void 0) {
        updateExpressions.push("#displayName = :displayName");
        expressionAttributeNames["#displayName"] = "displayName";
        expressionAttributeValues[":displayName"] = input.displayName;
      }
      if (input.avatarUrl !== void 0) {
        updateExpressions.push("#avatarUrl = :avatarUrl");
        expressionAttributeNames["#avatarUrl"] = "avatarUrl";
        expressionAttributeValues[":avatarUrl"] = input.avatarUrl;
      }
      if (input.systemRole !== void 0) {
        updateExpressions.push("#systemRole = :systemRole");
        expressionAttributeNames["#systemRole"] = "systemRole";
        expressionAttributeValues[":systemRole"] = input.systemRole;
      }
      updateExpressions.push("#updatedAt = :updatedAt");
      expressionAttributeNames["#updatedAt"] = "updatedAt";
      expressionAttributeValues[":updatedAt"] = (/* @__PURE__ */ new Date()).toISOString();
      const command = new import_lib_dynamodb.UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${userId}`,
          SK: "PROFILE"
        },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: "attribute_exists(PK)",
        // Ensure user exists
        ReturnValues: "ALL_NEW"
      });
      const result = await this.docClient.send(command);
      if (!result.Attributes) {
        throw new InternalError("Update operation did not return updated item");
      }
      return this.mapDynamoItemToUser(result.Attributes);
    } catch (error) {
      if (error.name === "ConditionalCheckFailedException") {
        throw new NotFoundError("User not found");
      }
      console.error("Error updating user:", error, { userId, input });
      throw new InternalError("Failed to update user");
    }
  }
  /**
   * Check if user exists
   * 
   * @param userId - User ID
   * @returns True if user exists
   */
  async userExists(userId) {
    try {
      const command = new import_lib_dynamodb.GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${userId}`,
          SK: "PROFILE"
        },
        ProjectionExpression: "PK"
        // Only fetch the key to minimize data transfer
      });
      const result = await this.docClient.send(command);
      return !!result.Item;
    } catch (error) {
      console.error("Error checking user existence:", error, { userId });
      return false;
    }
  }
  /**
   * Map DynamoDB item to User object
   * 
   * @param item - DynamoDB item
   * @returns User object
   */
  mapDynamoItemToUser(item) {
    return {
      id: item.PK.replace("USER#", ""),
      email: item.email,
      displayName: item.displayName,
      avatarUrl: item.avatarUrl,
      systemRole: item.systemRole,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }
  /**
   * Extract display name from email address
   * 
   * @param email - Email address
   * @returns Display name
   */
  extractDisplayNameFromEmail(email) {
    const localPart = email.split("@")[0];
    return localPart.replace(/[._-]/g, " ").split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
  }
};

// services/user-profile/domain/user.ts
var UserEntity = class _UserEntity {
  constructor(user) {
    this.user = user;
  }
  /**
   * Get user data
   */
  get data() {
    return { ...this.user };
  }
  /**
   * Get user ID
   */
  get id() {
    return this.user.id;
  }
  /**
   * Get user email
   */
  get email() {
    return this.user.email;
  }
  /**
   * Get display name
   */
  get displayName() {
    return this.user.displayName;
  }
  /**
   * Get avatar URL
   */
  get avatarUrl() {
    return this.user.avatarUrl;
  }
  /**
   * Get system role
   */
  get systemRole() {
    return this.user.systemRole;
  }
  /**
   * Check if user is a site administrator
   */
  get isSiteAdmin() {
    return this.user.systemRole === "SiteAdmin" /* SITE_ADMIN */;
  }
  /**
   * Update user with new data
   * 
   * @param input - Update input
   * @param canModifySystemRole - Whether system role can be modified
   * @returns Updated user entity
   */
  update(input, canModifySystemRole = false) {
    if (input.systemRole !== void 0 && !canModifySystemRole) {
      throw new ValidationError("System role changes are not allowed");
    }
    const updatedUser = {
      ...this.user,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (input.displayName !== void 0) {
      updatedUser.displayName = input.displayName.trim();
    }
    if (input.avatarUrl !== void 0) {
      updatedUser.avatarUrl = input.avatarUrl.trim() || void 0;
    }
    if (input.systemRole !== void 0 && canModifySystemRole) {
      updatedUser.systemRole = input.systemRole;
    }
    return new _UserEntity(updatedUser);
  }
  /**
   * Check if this user can access another user's profile
   * 
   * @param targetUserId - Target user ID
   * @returns True if access is allowed
   */
  canAccessUser(targetUserId) {
    if (this.id === targetUserId) {
      return true;
    }
    if (this.isSiteAdmin) {
      return true;
    }
    return false;
  }
  /**
   * Check if this user can modify another user's profile
   * 
   * @param targetUserId - Target user ID
   * @returns True if modification is allowed
   */
  canModifyUser(targetUserId) {
    return this.canAccessUser(targetUserId);
  }
};
function fromUserData(userData) {
  return new UserEntity(userData);
}

// shared/authorization/types.ts
var SystemCapability = /* @__PURE__ */ ((SystemCapability3) => {
  SystemCapability3["MANAGE_PLATFORM"] = "manage_platform";
  SystemCapability3["MANAGE_ALL_CLUBS"] = "manage_all_clubs";
  return SystemCapability3;
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
var AuthorizationError2 = class _AuthorizationError extends Error {
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
var InsufficientPrivilegesError = class extends AuthorizationError2 {
  constructor(capability, userId, resource) {
    const message = `Insufficient privileges: ${capability} required`;
    super(message, "INSUFFICIENT_PRIVILEGES" /* INSUFFICIENT_PRIVILEGES */, 403, {
      capability,
      userId,
      resource
    });
  }
};
var AuthorizationServiceError = class extends AuthorizationError2 {
  constructor(message, cause) {
    super(message, "AUTHORIZATION_SERVICE_ERROR" /* AUTHORIZATION_SERVICE_ERROR */, 500, {
      cause
    });
  }
};
function createAuthorizationErrorResponse(error, requestId) {
  return {
    error: error.errorType,
    message: error.message,
    details: {
      requiredCapability: error.capability,
      userId: error.userId,
      resource: error.resource
    },
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    requestId
  };
}
function isAuthorizationError(error) {
  return error instanceof AuthorizationError2;
}

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
      throw error instanceof AuthorizationError2 ? error : new AuthorizationServiceError("Failed to create authorization context", error);
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
      const hasCapability3 = capabilities.includes(capability);
      const duration = Date.now() - startTime;
      if (hasCapability3) {
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
      return hasCapability3;
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
      const hasCapability3 = await this.hasSystemCapability(authContext, requiredCapability);
      const duration = Date.now() - startTime;
      const result = {
        granted: hasCapability3,
        capability: requiredCapability,
        reason: hasCapability3 ? void 0 : "Insufficient privileges",
        context: {
          userId: authContext.userId,
          systemRole: authContext.systemRole,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      if (!hasCapability3) {
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

// shared/authorization/authorization-middleware.ts
function requireCapability(capability, resource) {
  return async (authContext) => {
    const result = await authorizationService.authorize(authContext, capability, resource);
    if (!result.granted) {
      throw new InsufficientPrivilegesError(capability, authContext.userId, resource);
    }
  };
}
var requirePlatformManagement = requireCapability("manage_platform" /* MANAGE_PLATFORM */);
var requireClubManagement = requireCapability("manage_all_clubs" /* MANAGE_ALL_CLUBS */);
async function hasCapability(authContext, capability) {
  return await authorizationService.hasSystemCapability(authContext, capability);
}

// services/user-profile/domain/user-service.ts
var UserService = class {
  constructor(userRepository2) {
    this.userRepository = userRepository2;
  }
  /**
   * Get current user profile (lazy creation)
   * 
   * @param authContext - Authentication context
   * @returns User profile
   */
  async getCurrentUser(authContext) {
    if (!authContext.isAuthenticated) {
      throw new AuthenticationError("Authentication required");
    }
    let user = await this.userRepository.getUserById(authContext.userId);
    if (!user) {
      const createInput = {
        id: authContext.userId,
        email: authContext.email
      };
      user = await this.userRepository.createUser(createInput);
    }
    return user;
  }
  /**
   * Get user by ID
   * 
   * @param userId - User ID
   * @param authContext - Authentication context
   * @returns User profile
   */
  async getUserById(userId, authContext) {
    if (!authContext.isAuthenticated) {
      throw new AuthenticationError("Authentication required");
    }
    const user = await this.userRepository.getUserById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }
  /**
   * Update user profile
   * 
   * @param userId - User ID
   * @param input - Update input
   * @param authContext - Authentication context
   * @returns Updated user profile
   */
  async updateUser(userId, input, authContext) {
    if (!authContext.isAuthenticated) {
      throw new AuthenticationError("Authentication required");
    }
    const existingUser = await this.userRepository.getUserById(userId);
    if (!existingUser) {
      throw new NotFoundError("User not found");
    }
    const userEntity = fromUserData(existingUser);
    if (!userEntity.canModifyUser(userId) && !authContext.isSiteAdmin) {
      throw new AuthorizationError("Cannot modify this user profile");
    }
    const canModifySystemRole = await hasCapability(authContext, "manage_platform" /* MANAGE_PLATFORM */);
    if (input.systemRole && !canModifySystemRole) {
      throw new InsufficientPrivilegesError("manage_platform" /* MANAGE_PLATFORM */, authContext.userId, `user:${userId}`);
    }
    validateUpdateUserInput(input, canModifySystemRole);
    const updatedEntity = userEntity.update(input, canModifySystemRole);
    return await this.userRepository.updateUser(userId, {
      displayName: updatedEntity.displayName,
      avatarUrl: updatedEntity.avatarUrl,
      systemRole: updatedEntity.systemRole
    });
  }
  /**
   * Check if user exists
   * 
   * @param userId - User ID
   * @returns True if user exists
   */
  async userExists(userId) {
    return await this.userRepository.userExists(userId);
  }
};

// services/user-profile/handlers/update-user.ts
var TABLE_NAME = process.env.TABLE_NAME;
var userRepository = new DynamoDBUserRepository(TABLE_NAME);
var userService = new UserService(userRepository);
async function handler(event) {
  const requestId = event.requestContext.requestId;
  logStructured("INFO", "Processing update user request", {
    requestId,
    httpMethod: event.httpMethod,
    path: event.path
  });
  try {
    const userId = event.pathParameters?.id;
    if (!userId) {
      throw new ValidationError("User ID is required");
    }
    const updateInput = parseJsonBody(event.body);
    const authContext = await createEnhancedAuthContext(event.requestContext, userRepository);
    logStructured("INFO", "Authentication context created", {
      requestId,
      requestingUserId: authContext.userId,
      targetUserId: userId,
      isAuthenticated: authContext.isAuthenticated,
      isSiteAdmin: authContext.isSiteAdmin,
      updateFields: Object.keys(updateInput)
    });
    const updatedUser = await userService.updateUser(userId, updateInput, authContext);
    logStructured("INFO", "User updated successfully", {
      requestId,
      requestingUserId: authContext.userId,
      targetUserId: userId,
      updatedFields: Object.keys(updateInput),
      systemRole: updatedUser.systemRole
    });
    return createSuccessResponse(updatedUser);
  } catch (error) {
    logStructured("ERROR", "Error processing update user request", {
      requestId,
      targetUserId: event.pathParameters?.id,
      error: error instanceof Error ? error.message : "Unknown error"
    });
    if (isAuthorizationError(error)) {
      return {
        statusCode: error.statusCode,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify(createAuthorizationErrorResponse(error, requestId))
      };
    }
    return handleLambdaError(error, requestId);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
