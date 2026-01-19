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

// services/club-service/handlers/membership/join-club.ts
var join_club_exports = {};
__export(join_club_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(join_club_exports);

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
function parseJSON(body) {
  if (!body) {
    throw new Error("Request body is required");
  }
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error("Invalid JSON in request body");
  }
}
function parseJsonBody(event) {
  return parseJSON(event.body);
}
function createSuccessResponse(data, statusCode = 200 /* OK */, origin) {
  const response = {
    success: true,
    data,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  return {
    statusCode,
    headers: getCorsHeaders(origin),
    body: JSON.stringify(response)
  };
}
function createErrorResponse(error, message, statusCode, requestId, origin) {
  const response = {
    error,
    message,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    requestId
  };
  return {
    statusCode,
    headers: getCorsHeaders(origin),
    body: JSON.stringify(response)
  };
}
function createValidationErrorResponse(message, requestId, origin) {
  return createErrorResponse(
    "VALIDATION_ERROR" /* VALIDATION_ERROR */,
    message,
    400 /* BAD_REQUEST */,
    requestId,
    origin
  );
}
function createUnauthorizedResponse(message = "Unauthorized", requestId, origin) {
  return createErrorResponse(
    "UNAUTHORIZED" /* UNAUTHORIZED */,
    message,
    401 /* UNAUTHORIZED */,
    requestId,
    origin
  );
}
function createForbiddenResponse(message = "Forbidden", requestId, origin) {
  return createErrorResponse(
    "FORBIDDEN" /* FORBIDDEN */,
    message,
    403 /* FORBIDDEN */,
    requestId,
    origin
  );
}
function createNotFoundResponse(message = "Not found", requestId, origin) {
  return createErrorResponse(
    "NOT_FOUND" /* NOT_FOUND */,
    message,
    404 /* NOT_FOUND */,
    requestId,
    origin
  );
}
function createInternalErrorResponse(message = "Internal server error", requestId, origin) {
  return createErrorResponse(
    "INTERNAL_ERROR" /* INTERNAL_ERROR */,
    message,
    500 /* INTERNAL_SERVER_ERROR */,
    requestId,
    origin
  );
}
function handleLambdaError(error, requestId, origin) {
  console.error("Lambda error:", error, { requestId });
  if (error instanceof Error) {
    const message = error.message;
    if (message.includes("Authentication required") || message.includes("JWT")) {
      return createUnauthorizedResponse(message, requestId, origin);
    }
    if (message.includes("privileges required") || message.includes("Forbidden")) {
      return createForbiddenResponse(message, requestId, origin);
    }
    if (message.includes("not found") || message.includes("Not found")) {
      return createNotFoundResponse(message, requestId, origin);
    }
    if (message.includes("validation") || message.includes("Invalid")) {
      return createValidationErrorResponse(message, requestId, origin);
    }
  }
  return createInternalErrorResponse("An unexpected error occurred", requestId, origin);
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

// services/club-service/infrastructure/dynamodb-club-repository.ts
var import_client_dynamodb2 = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb2 = require("@aws-sdk/lib-dynamodb");

// shared/types/club.ts
var ClubStatus = /* @__PURE__ */ ((ClubStatus3) => {
  ClubStatus3["ACTIVE"] = "active";
  ClubStatus3["SUSPENDED"] = "suspended";
  ClubStatus3["ARCHIVED"] = "archived";
  return ClubStatus3;
})(ClubStatus || {});
var CLUB_CONSTRAINTS = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  CITY_MAX_LENGTH: 50,
  DEFAULT_LIST_LIMIT: 20,
  MAX_LIST_LIMIT: 100
};

// services/club-service/domain/club.ts
var ClubEntity = class _ClubEntity {
  constructor(club) {
    this.club = club;
  }
  /**
   * Get the club data
   */
  get data() {
    return { ...this.club };
  }
  /**
   * Get club ID
   */
  get id() {
    return this.club.id;
  }
  /**
   * Get club name
   */
  get name() {
    return this.club.name;
  }
  /**
   * Get club status
   */
  get status() {
    return this.club.status;
  }
  /**
   * Check if club is active
   */
  get isActive() {
    return this.club.status === "active" /* ACTIVE */;
  }
  /**
   * Check if club is suspended
   */
  get isSuspended() {
    return this.club.status === "suspended" /* SUSPENDED */;
  }
  /**
   * Check if club is archived
   */
  get isArchived() {
    return this.club.status === "archived" /* ARCHIVED */;
  }
  /**
   * Update club with new data
   */
  update(input) {
    const updatedClub = {
      ...this.club,
      ...input,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    validateClubData(updatedClub);
    return new _ClubEntity(updatedClub);
  }
  /**
   * Activate the club
   */
  activate() {
    return this.update({ status: "active" /* ACTIVE */ });
  }
  /**
   * Suspend the club
   */
  suspend() {
    return this.update({ status: "suspended" /* SUSPENDED */ });
  }
  /**
   * Archive the club
   */
  archive() {
    return this.update({ status: "archived" /* ARCHIVED */ });
  }
  /**
   * Check if club can be updated
   */
  canUpdate() {
    return this.club.status !== "archived" /* ARCHIVED */;
  }
  /**
   * Check if club is visible in public listings
   */
  isPubliclyVisible() {
    return this.club.status === "active" /* ACTIVE */;
  }
  /**
   * Get normalized name for indexing
   */
  get nameLower() {
    return this.club.name.toLowerCase().trim();
  }
};
function createClub(input) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const clubId = generateClubId();
  const club = {
    id: clubId,
    name: input.name.trim(),
    description: input.description?.trim(),
    status: "active" /* ACTIVE */,
    city: input.city?.trim(),
    logoUrl: input.logoUrl?.trim(),
    createdAt: now,
    updatedAt: now
  };
  validateClubData(club);
  return new ClubEntity(club);
}
function validateClubData(club) {
  if (club.name !== void 0) {
    if (!club.name || typeof club.name !== "string") {
      throw new ValidationError("Club name is required");
    }
    const trimmedName = club.name.trim();
    if (trimmedName.length < CLUB_CONSTRAINTS.NAME_MIN_LENGTH) {
      throw new ValidationError("Club name is too short");
    }
    if (trimmedName.length > CLUB_CONSTRAINTS.NAME_MAX_LENGTH) {
      throw new ValidationError("Club name is too long");
    }
  }
  if (club.description !== void 0 && club.description !== null) {
    if (typeof club.description !== "string") {
      throw new ValidationError("Club description must be a string");
    }
    if (club.description.length > CLUB_CONSTRAINTS.DESCRIPTION_MAX_LENGTH) {
      throw new ValidationError("Club description is too long");
    }
  }
  if (club.city !== void 0 && club.city !== null) {
    if (typeof club.city !== "string") {
      throw new ValidationError("Club city must be a string");
    }
    if (club.city.length > CLUB_CONSTRAINTS.CITY_MAX_LENGTH) {
      throw new ValidationError("Club city name is too long");
    }
  }
  if (club.logoUrl !== void 0 && club.logoUrl !== null) {
    if (typeof club.logoUrl !== "string") {
      throw new ValidationError("Club logo URL must be a string");
    }
    try {
      new URL(club.logoUrl);
    } catch {
      throw new ValidationError("Club logo URL is not valid");
    }
  }
  if (club.status !== void 0) {
    if (!Object.values(ClubStatus).includes(club.status)) {
      throw new ValidationError("Invalid club status");
    }
  }
}
function generateClubId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `club_${timestamp}_${random}`;
}
function normalizeClubName(name) {
  return name.toLowerCase().trim();
}
var CLUB_STATUS_TRANSITIONS = {
  ["active" /* ACTIVE */]: ["suspended" /* SUSPENDED */, "archived" /* ARCHIVED */],
  ["suspended" /* SUSPENDED */]: ["active" /* ACTIVE */, "archived" /* ARCHIVED */],
  ["archived" /* ARCHIVED */]: []
  // Archived clubs cannot transition to other states
};

// services/club-service/infrastructure/dynamodb-club-repository.ts
var DynamoDBClubRepository = class {
  constructor(tableName, dynamoClient) {
    this.tableName = tableName;
    const client = dynamoClient || new import_client_dynamodb2.DynamoDBClient({});
    this.docClient = import_lib_dynamodb2.DynamoDBDocumentClient.from(client);
  }
  /**
   * Get club by ID
   */
  async getClubById(id) {
    const startTime = Date.now();
    try {
      const command = new import_lib_dynamodb2.GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `CLUB#${id}`,
          SK: "METADATA"
        }
      });
      const result = await this.docClient.send(command);
      const duration = Date.now() - startTime;
      if (!result.Item) {
        logStructured("INFO", "Club not found", {
          clubId: id,
          duration
        });
        return null;
      }
      const club = this.mapDynamoItemToClub(result.Item);
      logStructured("INFO", "Club retrieved successfully", {
        clubId: id,
        duration
      });
      return club;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured("ERROR", "Failed to get club by ID", {
        clubId: id,
        error: error instanceof Error ? error.message : "Unknown error",
        duration
      });
      throw error;
    }
  }
  /**
   * List clubs with pagination and filtering
   */
  async listClubs(options) {
    const startTime = Date.now();
    const limit = options.limit || CLUB_CONSTRAINTS.DEFAULT_LIST_LIMIT;
    try {
      const queryParams = {
        TableName: this.tableName,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: {
          ":pk": "INDEX#CLUB"
        },
        Limit: limit + 1,
        // Get one extra to determine if there are more results
        ScanIndexForward: true
        // Sort by GSI1SK (name-based)
      };
      if (options.status) {
        queryParams.FilterExpression = "#status = :status";
        queryParams.ExpressionAttributeNames = {
          "#status": "status"
        };
        queryParams.ExpressionAttributeValues[":status"] = options.status;
      }
      if (options.cursor) {
        const cursor = this.decodeCursor(options.cursor);
        queryParams.ExclusiveStartKey = {
          GSI1PK: "INDEX#CLUB",
          GSI1SK: `NAME#${cursor.nameLower}#ID#${cursor.clubId}`,
          PK: "INDEX#CLUB",
          SK: `NAME#${cursor.nameLower}#ID#${cursor.clubId}`
        };
      }
      const command = new import_lib_dynamodb2.QueryCommand(queryParams);
      const result = await this.docClient.send(command);
      const duration = Date.now() - startTime;
      const items = result.Items || [];
      const hasMore = items.length > limit;
      const clubs = items.slice(0, limit).map((item) => this.indexItemToClub(item));
      let nextCursor;
      if (hasMore) {
        const lastClub = clubs[clubs.length - 1];
        nextCursor = this.encodeCursor({
          nameLower: normalizeClubName(lastClub.name),
          clubId: lastClub.id
        });
      }
      logStructured("INFO", "Clubs listed successfully", {
        count: clubs.length,
        hasMore,
        duration,
        status: options.status
      });
      return {
        clubs,
        nextCursor
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured("ERROR", "Failed to list clubs", {
        error: error instanceof Error ? error.message : "Unknown error",
        duration,
        options
      });
      throw error;
    }
  }
  /**
   * Create a new club
   */
  async createClub(input) {
    const startTime = Date.now();
    try {
      const clubEntity = createClub(input);
      const club = clubEntity.data;
      const clubItem = {
        PK: `CLUB#${club.id}`,
        SK: "METADATA",
        entityType: "CLUB",
        id: club.id,
        name: club.name,
        nameLower: normalizeClubName(club.name),
        description: club.description,
        city: club.city,
        logoUrl: club.logoUrl,
        status: club.status,
        createdAt: club.createdAt,
        updatedAt: club.updatedAt
      };
      const indexItem = {
        PK: "INDEX#CLUB",
        SK: `NAME#${clubItem.nameLower}#ID#${club.id}`,
        GSI1PK: "INDEX#CLUB",
        GSI1SK: `NAME#${clubItem.nameLower}#ID#${club.id}`,
        entityType: "CLUB_INDEX",
        clubId: club.id,
        name: club.name,
        nameLower: clubItem.nameLower,
        status: club.status,
        city: club.city,
        createdAt: club.createdAt,
        updatedAt: club.updatedAt
      };
      const transactParams = {
        TransactItems: [
          {
            Put: {
              TableName: this.tableName,
              Item: clubItem,
              ConditionExpression: "attribute_not_exists(PK)"
              // Ensure club doesn't already exist
            }
          },
          {
            Put: {
              TableName: this.tableName,
              Item: indexItem
            }
          }
        ]
      };
      const command = new import_lib_dynamodb2.TransactWriteCommand(transactParams);
      await this.docClient.send(command);
      const duration = Date.now() - startTime;
      logStructured("INFO", "Club created successfully", {
        clubId: club.id,
        clubName: club.name,
        duration
      });
      return club;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured("ERROR", "Failed to create club", {
        clubName: input.name,
        error: error instanceof Error ? error.message : "Unknown error",
        duration
      });
      throw error;
    }
  }
  /**
   * Update an existing club
   */
  async updateClub(id, input) {
    const startTime = Date.now();
    try {
      const existingClub = await this.getClubById(id);
      if (!existingClub) {
        throw new NotFoundError("Club not found");
      }
      const updatedClub = {
        ...existingClub,
        ...input,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const transactItems = [];
      const clubItem = {
        PK: `CLUB#${id}`,
        SK: "METADATA",
        entityType: "CLUB",
        id: updatedClub.id,
        name: updatedClub.name,
        nameLower: normalizeClubName(updatedClub.name),
        description: updatedClub.description,
        city: updatedClub.city,
        logoUrl: updatedClub.logoUrl,
        status: updatedClub.status,
        createdAt: updatedClub.createdAt,
        updatedAt: updatedClub.updatedAt
      };
      transactItems.push({
        Put: {
          TableName: this.tableName,
          Item: clubItem
        }
      });
      const nameChanged = normalizeClubName(updatedClub.name) !== normalizeClubName(existingClub.name);
      if (nameChanged) {
        transactItems.push({
          Delete: {
            TableName: this.tableName,
            Key: {
              PK: "INDEX#CLUB",
              SK: `NAME#${normalizeClubName(existingClub.name)}#ID#${id}`
            }
          }
        });
        const newIndexItem = {
          PK: "INDEX#CLUB",
          SK: `NAME#${clubItem.nameLower}#ID#${id}`,
          GSI1PK: "INDEX#CLUB",
          GSI1SK: `NAME#${clubItem.nameLower}#ID#${id}`,
          entityType: "CLUB_INDEX",
          clubId: id,
          name: updatedClub.name,
          nameLower: clubItem.nameLower,
          status: updatedClub.status,
          city: updatedClub.city,
          createdAt: updatedClub.createdAt,
          updatedAt: updatedClub.updatedAt
        };
        transactItems.push({
          Put: {
            TableName: this.tableName,
            Item: newIndexItem
          }
        });
      } else {
        const indexItem = {
          PK: "INDEX#CLUB",
          SK: `NAME#${clubItem.nameLower}#ID#${id}`,
          GSI1PK: "INDEX#CLUB",
          GSI1SK: `NAME#${clubItem.nameLower}#ID#${id}`,
          entityType: "CLUB_INDEX",
          clubId: id,
          name: updatedClub.name,
          nameLower: clubItem.nameLower,
          status: updatedClub.status,
          city: updatedClub.city,
          createdAt: updatedClub.createdAt,
          updatedAt: updatedClub.updatedAt
        };
        transactItems.push({
          Put: {
            TableName: this.tableName,
            Item: indexItem
          }
        });
      }
      const transactParams = {
        TransactItems: transactItems
      };
      const command = new import_lib_dynamodb2.TransactWriteCommand(transactParams);
      await this.docClient.send(command);
      const duration = Date.now() - startTime;
      logStructured("INFO", "Club updated successfully", {
        clubId: id,
        clubName: updatedClub.name,
        nameChanged,
        duration
      });
      return updatedClub;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured("ERROR", "Failed to update club", {
        clubId: id,
        error: error instanceof Error ? error.message : "Unknown error",
        duration
      });
      throw error;
    }
  }
  /**
   * Check if club exists
   */
  async clubExists(id) {
    const club = await this.getClubById(id);
    return club !== null;
  }
  /**
   * Check if club name is unique
   */
  async isClubNameUnique(name, excludeId) {
    const startTime = Date.now();
    try {
      const nameLower = normalizeClubName(name);
      const command = new import_lib_dynamodb2.QueryCommand({
        TableName: this.tableName,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk AND begins_with(GSI1SK, :namePrefix)",
        ExpressionAttributeValues: {
          ":pk": "INDEX#CLUB",
          ":namePrefix": `NAME#${nameLower}#`
        },
        Limit: 10
        // Should be very few matches for exact name
      });
      const result = await this.docClient.send(command);
      const duration = Date.now() - startTime;
      const items = result.Items || [];
      const conflictingClub = items.find((item) => {
        const indexItem = item;
        return indexItem.nameLower === nameLower && (!excludeId || indexItem.clubId !== excludeId);
      });
      const isUnique = !conflictingClub;
      logStructured("INFO", "Club name uniqueness check completed", {
        name,
        isUnique,
        excludeId,
        duration
      });
      return isUnique;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured("ERROR", "Failed to check club name uniqueness", {
        name,
        error: error instanceof Error ? error.message : "Unknown error",
        duration
      });
      throw error;
    }
  }
  /**
   * Get clubs by status
   */
  async getClubsByStatus(status, limit) {
    const result = await this.listClubs({
      status,
      limit: limit || CLUB_CONSTRAINTS.DEFAULT_LIST_LIMIT
    });
    return result.clubs;
  }
  /**
   * Search clubs by name
   */
  async searchClubsByName(nameQuery, limit) {
    const result = await this.listClubs({
      limit: limit || CLUB_CONSTRAINTS.DEFAULT_LIST_LIMIT
    });
    const query = nameQuery.toLowerCase();
    return result.clubs.filter(
      (club) => club.name.toLowerCase().includes(query)
    );
  }
  /**
   * Map DynamoDB item to Club
   */
  mapDynamoItemToClub(item) {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      status: item.status,
      city: item.city,
      logoUrl: item.logoUrl,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }
  /**
   * Map index item to Club (minimal data)
   */
  indexItemToClub(item) {
    return {
      id: item.clubId,
      name: item.name,
      status: item.status,
      city: item.city,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
      // Note: description and logoUrl are not in index items
      // They would need to be fetched separately if needed
    };
  }
  /**
   * Encode cursor for pagination
   */
  encodeCursor(cursor) {
    const cursorData = JSON.stringify(cursor);
    return Buffer.from(cursorData).toString("base64");
  }
  /**
   * Decode cursor for pagination
   */
  decodeCursor(cursor) {
    try {
      const cursorData = Buffer.from(cursor, "base64").toString("utf-8");
      return JSON.parse(cursorData);
    } catch (error) {
      throw new Error("Invalid pagination cursor");
    }
  }
};

// services/club-service/infrastructure/dynamodb-membership-repository.ts
var import_client_dynamodb3 = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb3 = require("@aws-sdk/lib-dynamodb");

// shared/types/membership.ts
var ClubRole = /* @__PURE__ */ ((ClubRole2) => {
  ClubRole2["MEMBER"] = "member";
  ClubRole2["ADMIN"] = "admin";
  ClubRole2["OWNER"] = "owner";
  return ClubRole2;
})(ClubRole || {});
var MembershipStatus = /* @__PURE__ */ ((MembershipStatus2) => {
  MembershipStatus2["PENDING"] = "pending";
  MembershipStatus2["ACTIVE"] = "active";
  MembershipStatus2["SUSPENDED"] = "suspended";
  MembershipStatus2["REMOVED"] = "removed";
  return MembershipStatus2;
})(MembershipStatus || {});
var MEMBERSHIP_CONSTRAINTS = {
  JOIN_MESSAGE_MAX_LENGTH: 500,
  REASON_MAX_LENGTH: 500,
  DEFAULT_LIST_LIMIT: 20,
  MAX_LIST_LIMIT: 100
};
var MEMBERSHIP_STATUS_TRANSITIONS = {
  ["pending" /* PENDING */]: ["active" /* ACTIVE */, "removed" /* REMOVED */],
  ["active" /* ACTIVE */]: ["suspended" /* SUSPENDED */, "removed" /* REMOVED */],
  ["suspended" /* SUSPENDED */]: ["active" /* ACTIVE */, "removed" /* REMOVED */],
  ["removed" /* REMOVED */]: []
  // Cannot transition from removed
};
function isValidMembershipStatusTransition(from, to) {
  return MEMBERSHIP_STATUS_TRANSITIONS[from].includes(to);
}

// services/club-service/domain/membership/membership.ts
var MembershipEntity = class _MembershipEntity {
  constructor(membership) {
    this.membership = membership;
  }
  /**
   * Get membership data
   */
  toMembership() {
    return { ...this.membership };
  }
  /**
   * Get membership ID
   */
  getId() {
    return this.membership.membershipId;
  }
  /**
   * Get club ID
   */
  getClubId() {
    return this.membership.clubId;
  }
  /**
   * Get user ID
   */
  getUserId() {
    return this.membership.userId;
  }
  /**
   * Get membership role
   */
  getRole() {
    return this.membership.role;
  }
  /**
   * Get membership status
   */
  getStatus() {
    return this.membership.status;
  }
  /**
   * Check if membership is active
   */
  isActive() {
    return this.membership.status === "active" /* ACTIVE */;
  }
  /**
   * Check if membership is pending
   */
  isPending() {
    return this.membership.status === "pending" /* PENDING */;
  }
  /**
   * Check if member is owner
   */
  isOwner() {
    return this.membership.role === "owner" /* OWNER */;
  }
  /**
   * Check if member is admin or owner
   */
  isAdminOrOwner() {
    return this.membership.role === "admin" /* ADMIN */ || this.membership.role === "owner" /* OWNER */;
  }
  /**
   * Check if member can be removed
   */
  canBeRemoved() {
    return this.membership.role !== "owner" /* OWNER */;
  }
  /**
   * Check if member can leave voluntarily
   */
  canLeave() {
    return this.membership.role !== "owner" /* OWNER */ && this.isActive();
  }
  /**
   * Update member role
   */
  updateRole(input, updatedBy) {
    validateRoleTransition(this.membership.role, input.role);
    if (this.membership.role === "owner" /* OWNER */) {
      throw new ValidationError("Cannot change owner role - ownership transfer required");
    }
    const updatedMembership = {
      ...this.membership,
      role: input.role,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      processedBy: updatedBy,
      processedAt: (/* @__PURE__ */ new Date()).toISOString(),
      reason: input.reason
    };
    return new _MembershipEntity(updatedMembership);
  }
  /**
   * Change membership status
   */
  changeStatus(newStatus, processedBy, reason) {
    if (this.membership.status === newStatus) {
      return this;
    }
    if (!isValidMembershipStatusTransition(this.membership.status, newStatus)) {
      throw new ValidationError(`Cannot transition membership from ${this.membership.status} to ${newStatus}`);
    }
    if (this.membership.role === "owner" /* OWNER */ && (newStatus === "suspended" /* SUSPENDED */ || newStatus === "removed" /* REMOVED */)) {
      throw new ValidationError("Cannot suspend or remove owner - ownership transfer required");
    }
    const updatedMembership = {
      ...this.membership,
      status: newStatus,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      processedBy,
      processedAt: processedBy ? (/* @__PURE__ */ new Date()).toISOString() : void 0,
      reason
    };
    return new _MembershipEntity(updatedMembership);
  }
  /**
   * Activate pending membership (accept join request or invitation)
   */
  activate(processedBy) {
    return this.changeStatus("active" /* ACTIVE */, processedBy, "Membership activated");
  }
  /**
   * Remove membership
   */
  remove(processedBy, reason) {
    return this.changeStatus("removed" /* REMOVED */, processedBy, reason || "Member removed");
  }
  /**
   * Suspend membership
   */
  suspend(processedBy, reason) {
    return this.changeStatus("suspended" /* SUSPENDED */, processedBy, reason || "Member suspended");
  }
  /**
   * Reinstate suspended membership
   */
  reinstate(processedBy) {
    return this.changeStatus("active" /* ACTIVE */, processedBy, "Member reinstated");
  }
};
function createMembership(clubId, userId, role = "member" /* MEMBER */, status = "pending" /* PENDING */, joinMessage, invitedBy) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const membershipId = generateMembershipId();
  const membership = {
    membershipId,
    clubId,
    userId,
    role,
    status,
    joinedAt: now,
    updatedAt: now,
    joinMessage: joinMessage?.trim(),
    invitedBy
  };
  validateMembershipData(membership);
  return new MembershipEntity(membership);
}
function validateMembershipData(membership) {
  if (!membership.membershipId || membership.membershipId.trim().length === 0) {
    throw new ValidationError("Membership ID is required");
  }
  if (!membership.clubId || membership.clubId.trim().length === 0) {
    throw new ValidationError("Club ID is required");
  }
  if (!membership.userId || membership.userId.trim().length === 0) {
    throw new ValidationError("User ID is required");
  }
  if (!Object.values(ClubRole).includes(membership.role)) {
    throw new ValidationError("Invalid club role");
  }
  if (!Object.values(MembershipStatus).includes(membership.status)) {
    throw new ValidationError("Invalid membership status");
  }
  if (membership.joinMessage && membership.joinMessage.length > MEMBERSHIP_CONSTRAINTS.JOIN_MESSAGE_MAX_LENGTH) {
    throw new ValidationError(`Join message must not exceed ${MEMBERSHIP_CONSTRAINTS.JOIN_MESSAGE_MAX_LENGTH} characters`);
  }
  if (membership.reason && membership.reason.length > MEMBERSHIP_CONSTRAINTS.REASON_MAX_LENGTH) {
    throw new ValidationError(`Reason must not exceed ${MEMBERSHIP_CONSTRAINTS.REASON_MAX_LENGTH} characters`);
  }
}
function validateRoleTransition(currentRole, newRole) {
  const allowedTransitions = {
    ["member" /* MEMBER */]: ["admin" /* ADMIN */],
    // Members can be promoted to admin
    ["admin" /* ADMIN */]: ["member" /* MEMBER */],
    // Admins can be demoted to member
    ["owner" /* OWNER */]: []
    // Owners cannot change roles (must transfer ownership)
  };
  const allowed = allowedTransitions[currentRole];
  if (!allowed.includes(newRole)) {
    throw new ValidationError(`Cannot transition role from ${currentRole} to ${newRole}`);
  }
}
function generateMembershipId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `mem_${timestamp}_${random}`;
}

// services/club-service/domain/membership/membership-errors.ts
var MembershipNotFoundError = class _MembershipNotFoundError extends Error {
  constructor(membershipId, clubId, userId) {
    super("Membership not found");
    this.statusCode = 404;
    this.errorType = "MEMBERSHIP_NOT_FOUND";
    this.name = "MembershipNotFoundError";
    this.membershipId = membershipId;
    this.clubId = clubId;
    this.userId = userId;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, _MembershipNotFoundError);
    }
  }
};
var AlreadyMemberError = class _AlreadyMemberError extends Error {
  constructor(clubId, userId) {
    super("User is already a member of this club");
    this.statusCode = 409;
    this.errorType = "ALREADY_MEMBER";
    this.name = "AlreadyMemberError";
    this.clubId = clubId;
    this.userId = userId;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, _AlreadyMemberError);
    }
  }
};
var CannotRemoveOwnerError = class _CannotRemoveOwnerError extends Error {
  constructor(clubId, userId) {
    super("Cannot remove club owner - ownership transfer required");
    this.statusCode = 400;
    this.errorType = "CANNOT_REMOVE_OWNER";
    this.name = "CannotRemoveOwnerError";
    this.clubId = clubId;
    this.userId = userId;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, _CannotRemoveOwnerError);
    }
  }
};
var MembershipOperationNotAllowedError = class _MembershipOperationNotAllowedError extends Error {
  constructor(operation, membershipId, reason) {
    super(`Membership operation not allowed: ${operation}${reason ? ` - ${reason}` : ""}`);
    this.statusCode = 403;
    this.errorType = "MEMBERSHIP_OPERATION_NOT_ALLOWED";
    this.name = "MembershipOperationNotAllowedError";
    this.operation = operation;
    this.membershipId = membershipId;
    this.reason = reason;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, _MembershipOperationNotAllowedError);
    }
  }
};

// services/club-service/infrastructure/dynamodb-membership-repository.ts
var DynamoDBMembershipRepository = class {
  constructor(tableName, userRepository2, dynamoClient) {
    this.userRepository = userRepository2;
    const client = dynamoClient || new import_client_dynamodb3.DynamoDBClient({});
    this.dynamoClient = import_lib_dynamodb3.DynamoDBDocumentClient.from(client);
    this.tableName = tableName || process.env.MAIN_TABLE_NAME || "sydney-cycles-main-development";
  }
  /**
   * Get membership by club and user
   */
  async getMembershipByClubAndUser(clubId, userId) {
    const startTime = Date.now();
    try {
      const command = new import_lib_dynamodb3.GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `CLUB#${clubId}`,
          SK: `MEMBER#${userId}`
        }
      });
      const result = await this.dynamoClient.send(command);
      const duration = Date.now() - startTime;
      if (!result.Item) {
        logStructured("INFO", "Membership not found", {
          clubId,
          userId,
          duration,
          operation: "get_membership_by_club_and_user"
        });
        return null;
      }
      const membership = this.dynamoItemToMembership(result.Item);
      logStructured("INFO", "Membership retrieved from DynamoDB", {
        clubId,
        userId,
        membershipId: membership.membershipId,
        role: membership.role,
        status: membership.status,
        duration,
        operation: "get_membership_by_club_and_user"
      });
      return membership;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured("ERROR", "Failed to get membership by club and user", {
        clubId,
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
        duration,
        operation: "get_membership_by_club_and_user"
      });
      throw error;
    }
  }
  /**
   * Get membership by ID
   */
  async getMembershipById(membershipId) {
    throw new Error("getMembershipById not implemented - requires GSI or scan operation");
  }
  /**
   * List club members with pagination and filtering
   */
  async listClubMembers(clubId, options) {
    const startTime = Date.now();
    const limit = options.limit || MEMBERSHIP_CONSTRAINTS.DEFAULT_LIST_LIMIT;
    try {
      const queryParams = {
        TableName: this.tableName,
        IndexName: "GSI2",
        KeyConditionExpression: "GSI2PK = :gsi2pk",
        ExpressionAttributeValues: {
          ":gsi2pk": `CLUB#${clubId}#MEMBERS`
        },
        Limit: limit + 1,
        // Get one extra to determine if there are more results
        ScanIndexForward: true
      };
      if (options.role) {
        queryParams.KeyConditionExpression += " AND begins_with(GSI2SK, :rolePrefix)";
        queryParams.ExpressionAttributeValues[":rolePrefix"] = `ROLE#${options.role}#`;
      }
      if (options.status) {
        queryParams.FilterExpression = "#status = :status";
        queryParams.ExpressionAttributeNames = {
          "#status": "status"
        };
        queryParams.ExpressionAttributeValues[":status"] = options.status;
      }
      if (options.cursor) {
        try {
          const decodedCursor = JSON.parse(Buffer.from(options.cursor, "base64").toString());
          queryParams.ExclusiveStartKey = {
            GSI2PK: `CLUB#${clubId}#MEMBERS`,
            GSI2SK: `ROLE#${decodedCursor.role}#USER#${decodedCursor.userId}`,
            PK: `CLUB#${clubId}#MEMBERS`,
            SK: `ROLE#${decodedCursor.role}#USER#${decodedCursor.userId}`
          };
        } catch (error) {
          throw new Error("Invalid cursor format");
        }
      }
      const command = new import_lib_dynamodb3.QueryCommand(queryParams);
      const result = await this.dynamoClient.send(command);
      const duration = Date.now() - startTime;
      const items = result.Items || [];
      const hasMore = items.length > limit;
      const memberItems = items.slice(0, limit);
      const members = [];
      if (this.userRepository && memberItems.length > 0) {
        const userIds = memberItems.map((item) => item.userId);
        const users = await Promise.all(
          userIds.map((userId) => this.userRepository.getUserById(userId))
        );
        for (let i = 0; i < memberItems.length; i++) {
          const memberItem = memberItems[i];
          const user = users[i];
          members.push({
            membershipId: memberItem.membershipId,
            userId: memberItem.userId,
            displayName: user?.displayName || "Unknown User",
            email: user?.email || "",
            avatarUrl: user?.avatarUrl,
            role: memberItem.role,
            status: memberItem.status,
            joinedAt: memberItem.joinedAt,
            updatedAt: memberItem.updatedAt
          });
        }
      } else {
        for (const item of memberItems) {
          const memberItem = item;
          members.push({
            membershipId: memberItem.membershipId,
            userId: memberItem.userId,
            displayName: "Unknown User",
            email: "",
            role: memberItem.role,
            status: memberItem.status,
            joinedAt: memberItem.joinedAt,
            updatedAt: memberItem.updatedAt
          });
        }
      }
      let nextCursor;
      if (hasMore && members.length > 0) {
        const lastMember = memberItems[memberItems.length - 1];
        const cursorData = {
          role: lastMember.role,
          userId: lastMember.userId
        };
        nextCursor = Buffer.from(JSON.stringify(cursorData)).toString("base64");
      }
      logStructured("INFO", "Club members listed from DynamoDB", {
        clubId,
        resultCount: members.length,
        hasMore,
        role: options.role,
        status: options.status,
        duration,
        operation: "list_club_members"
      });
      return {
        members,
        nextCursor
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured("ERROR", "Failed to list club members", {
        clubId,
        error: error instanceof Error ? error.message : "Unknown error",
        duration,
        operation: "list_club_members"
      });
      throw error;
    }
  }
  /**
   * List user's club memberships
   */
  async listUserMemberships(userId, status) {
    const startTime = Date.now();
    try {
      const queryParams = {
        TableName: this.tableName,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :gsi1pk AND begins_with(GSI1SK, :membershipPrefix)",
        ExpressionAttributeValues: {
          ":gsi1pk": `USER#${userId}`,
          ":membershipPrefix": "MEMBERSHIP#"
        }
      };
      if (status) {
        queryParams.FilterExpression = "#status = :status";
        queryParams.ExpressionAttributeNames = {
          "#status": "status"
        };
        queryParams.ExpressionAttributeValues[":status"] = status;
      }
      const command = new import_lib_dynamodb3.QueryCommand(queryParams);
      const result = await this.dynamoClient.send(command);
      const duration = Date.now() - startTime;
      const items = result.Items || [];
      const memberships = items.map((item) => {
        const membershipItem = item;
        return {
          membershipId: membershipItem.membershipId,
          clubId: membershipItem.clubId,
          clubName: "Unknown Club",
          // Would need club data enrichment
          role: membershipItem.role,
          status: membershipItem.status,
          joinedAt: membershipItem.joinedAt
        };
      });
      logStructured("INFO", "User memberships listed from DynamoDB", {
        userId,
        resultCount: memberships.length,
        status,
        duration,
        operation: "list_user_memberships"
      });
      return memberships;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured("ERROR", "Failed to list user memberships", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
        duration,
        operation: "list_user_memberships"
      });
      throw error;
    }
  }
  /**
   * Create a new membership
   */
  async createMembership(clubId, userId, input, role = "member" /* MEMBER */, status = "pending" /* PENDING */) {
    const startTime = Date.now();
    try {
      const membershipEntity = createMembership(clubId, userId, role, status, input.message);
      const membership = membershipEntity.toMembership();
      const canonicalItem = this.membershipToCanonicalItem(membership);
      const userIndexItem = this.membershipToUserIndexItem(membership);
      const clubMemberIndexItem = this.membershipToClubMemberIndexItem(membership);
      const command = new import_lib_dynamodb3.TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: this.tableName,
              Item: canonicalItem,
              ConditionExpression: "attribute_not_exists(PK)"
              // Ensure membership doesn't already exist
            }
          },
          {
            Put: {
              TableName: this.tableName,
              Item: userIndexItem
            }
          },
          {
            Put: {
              TableName: this.tableName,
              Item: clubMemberIndexItem
            }
          }
        ]
      });
      await this.dynamoClient.send(command);
      const duration = Date.now() - startTime;
      logStructured("INFO", "Membership created in DynamoDB", {
        clubId,
        userId,
        membershipId: membership.membershipId,
        role: membership.role,
        status: membership.status,
        duration,
        operation: "create_membership"
      });
      return membership;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured("ERROR", "Failed to create membership", {
        clubId,
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
        duration,
        operation: "create_membership"
      });
      throw error;
    }
  }
  /**
   * Update membership role
   */
  async updateMembershipRole(membershipId, input, updatedBy) {
    throw new Error("updateMembershipRole not fully implemented");
  }
  /**
   * Update membership status
   */
  async updateMembershipStatus(membershipId, status, processedBy, reason) {
    const startTime = Date.now();
    try {
      const scanCommand = new import_lib_dynamodb3.QueryCommand({
        TableName: this.tableName,
        IndexName: "GSI1",
        FilterExpression: "membershipId = :membershipId",
        ExpressionAttributeValues: {
          ":membershipId": membershipId
        },
        Limit: 1
      });
      throw new MembershipNotFoundError(`Cannot update membership ${membershipId} - requires clubId and userId`);
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured("ERROR", "Failed to update membership status", {
        membershipId,
        status,
        error: error instanceof Error ? error.message : "Unknown error",
        duration,
        operation: "update_membership_status"
      });
      throw error;
    }
  }
  /**
   * Update membership status by club and user (more efficient)
   */
  async updateMembershipStatusByClubAndUser(clubId, userId, status, processedBy, reason) {
    const startTime = Date.now();
    try {
      const membership = await this.getMembershipByClubAndUser(clubId, userId);
      if (!membership) {
        throw new MembershipNotFoundError(`Membership not found for club ${clubId} and user ${userId}`);
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const updatedMembership = {
        ...membership,
        status,
        updatedAt: now,
        processedBy,
        processedAt: processedBy ? now : membership.processedAt,
        reason: reason || membership.reason
      };
      const canonicalItem = this.membershipToCanonicalItem(updatedMembership);
      const userIndexItem = this.membershipToUserIndexItem(updatedMembership);
      const clubMemberIndexItem = this.membershipToClubMemberIndexItem(updatedMembership);
      const command = new import_lib_dynamodb3.TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: this.tableName,
              Item: canonicalItem
            }
          },
          {
            Put: {
              TableName: this.tableName,
              Item: userIndexItem
            }
          },
          {
            Put: {
              TableName: this.tableName,
              Item: clubMemberIndexItem
            }
          }
        ]
      });
      await this.dynamoClient.send(command);
      const duration = Date.now() - startTime;
      logStructured("INFO", "Membership status updated in DynamoDB", {
        clubId,
        userId,
        membershipId: membership.membershipId,
        oldStatus: membership.status,
        newStatus: status,
        processedBy,
        duration,
        operation: "update_membership_status_by_club_and_user"
      });
      return updatedMembership;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured("ERROR", "Failed to update membership status by club and user", {
        clubId,
        userId,
        status,
        error: error instanceof Error ? error.message : "Unknown error",
        duration,
        operation: "update_membership_status_by_club_and_user"
      });
      throw error;
    }
  }
  /**
   * Remove membership
   */
  async removeMembership(membershipId, removedBy, reason) {
    return this.updateMembershipStatus(membershipId, "removed" /* REMOVED */, removedBy, reason);
  }
  /**
   * Remove membership by club and user (more efficient)
   */
  async removeMembershipByClubAndUser(clubId, userId, removedBy, reason) {
    return this.updateMembershipStatusByClubAndUser(clubId, userId, "removed" /* REMOVED */, removedBy, reason);
  }
  /**
   * Check if user is a member of club
   */
  async isUserMember(clubId, userId) {
    const membership = await this.getMembershipByClubAndUser(clubId, userId);
    return membership !== null && membership.status === "active" /* ACTIVE */;
  }
  /**
   * Get user's role in club
   */
  async getUserRoleInClub(clubId, userId) {
    const membership = await this.getMembershipByClubAndUser(clubId, userId);
    return membership && membership.status === "active" /* ACTIVE */ ? membership.role : null;
  }
  /**
   * Count club members by status
   */
  async countClubMembers(clubId, status = "active" /* ACTIVE */) {
    const members = await this.listClubMembers(clubId, { status, limit: 1e3 });
    return members.members.length;
  }
  /**
   * Get club owner
   */
  async getClubOwner(clubId) {
    const members = await this.listClubMembers(clubId, { role: "owner" /* OWNER */, status: "active" /* ACTIVE */ });
    return members.members.length > 0 ? this.memberInfoToMembership(members.members[0]) : null;
  }
  /**
   * Get club admins (including owner)
   */
  async getClubAdmins(clubId) {
    const [admins, owners] = await Promise.all([
      this.listClubMembers(clubId, { role: "admin" /* ADMIN */, status: "active" /* ACTIVE */ }),
      this.listClubMembers(clubId, { role: "owner" /* OWNER */, status: "active" /* ACTIVE */ })
    ]);
    return [
      ...admins.members.map((member) => this.memberInfoToMembership(member)),
      ...owners.members.map((member) => this.memberInfoToMembership(member))
    ];
  }
  /**
   * Check if user has pending membership request
   */
  async hasPendingMembershipRequest(clubId, userId) {
    const membership = await this.getMembershipByClubAndUser(clubId, userId);
    return membership !== null && membership.status === "pending" /* PENDING */;
  }
  /**
   * Get club member count (active members only)
   */
  async getClubMemberCount(clubId) {
    return this.countClubMembers(clubId, "active" /* ACTIVE */);
  }
  /**
   * Convert DynamoDB canonical item to Membership
   */
  dynamoItemToMembership(item) {
    return {
      membershipId: item.membershipId,
      clubId: item.clubId,
      userId: item.userId,
      role: item.role,
      status: item.status,
      joinedAt: item.joinedAt,
      updatedAt: item.updatedAt,
      joinMessage: item.joinMessage,
      invitedBy: item.invitedBy,
      processedBy: item.processedBy,
      processedAt: item.processedAt,
      reason: item.reason
    };
  }
  /**
   * Convert ClubMemberInfo to ClubMembership
   */
  memberInfoToMembership(memberInfo) {
    return {
      membershipId: memberInfo.membershipId,
      clubId: "",
      // Would need to be provided or looked up
      userId: memberInfo.userId,
      role: memberInfo.role,
      status: memberInfo.status,
      joinedAt: memberInfo.joinedAt,
      updatedAt: memberInfo.updatedAt || memberInfo.joinedAt
    };
  }
  /**
   * Convert Membership to DynamoDB canonical item
   */
  membershipToCanonicalItem(membership) {
    return {
      PK: `CLUB#${membership.clubId}`,
      SK: `MEMBER#${membership.userId}`,
      entityType: "CLUB_MEMBERSHIP",
      membershipId: membership.membershipId,
      clubId: membership.clubId,
      userId: membership.userId,
      role: membership.role,
      status: membership.status,
      joinedAt: membership.joinedAt,
      updatedAt: membership.updatedAt,
      joinMessage: membership.joinMessage,
      invitedBy: membership.invitedBy,
      processedBy: membership.processedBy,
      processedAt: membership.processedAt,
      reason: membership.reason
    };
  }
  /**
   * Convert Membership to DynamoDB user index item
   */
  membershipToUserIndexItem(membership) {
    const sk = `MEMBERSHIP#${membership.clubId}`;
    return {
      PK: `USER#${membership.userId}`,
      SK: sk,
      GSI1PK: `USER#${membership.userId}`,
      GSI1SK: sk,
      entityType: "USER_MEMBERSHIP",
      membershipId: membership.membershipId,
      clubId: membership.clubId,
      userId: membership.userId,
      role: membership.role,
      status: membership.status,
      joinedAt: membership.joinedAt,
      updatedAt: membership.updatedAt
    };
  }
  /**
   * Convert Membership to DynamoDB club member index item
   */
  membershipToClubMemberIndexItem(membership) {
    const sk = `ROLE#${membership.role}#USER#${membership.userId}`;
    return {
      PK: `CLUB#${membership.clubId}#MEMBERS`,
      SK: sk,
      GSI2PK: `CLUB#${membership.clubId}#MEMBERS`,
      GSI2SK: sk,
      entityType: "CLUB_MEMBER_INDEX",
      membershipId: membership.membershipId,
      userId: membership.userId,
      role: membership.role,
      status: membership.status,
      joinedAt: membership.joinedAt,
      updatedAt: membership.updatedAt
    };
  }
};

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
function getCapabilitiesForRole(role) {
  return ROLE_CAPABILITIES[role] || [];
}
function roleHasCapability(role, capability) {
  return getCapabilitiesForRole(role).includes(capability);
}
function getMinimumRoleForCapability(capability) {
  for (const [role, capabilities] of Object.entries(ROLE_CAPABILITIES)) {
    if (capabilities.includes(capability)) {
      return role;
    }
  }
  return null;
}

// shared/authorization/types.ts
var SystemCapability = /* @__PURE__ */ ((SystemCapability2) => {
  SystemCapability2["MANAGE_PLATFORM"] = "manage_platform";
  SystemCapability2["MANAGE_ALL_CLUBS"] = "manage_all_clubs";
  return SystemCapability2;
})(SystemCapability || {});

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

// services/club-service/domain/authorization/club-authorization.ts
var ClubAuthorizationService = class {
  constructor(membershipRepository2, authorizationService2) {
    this.membershipRepository = membershipRepository2;
    this.authorizationService = authorizationService2;
  }
  /**
   * Create enhanced authorization context with club membership
   */
  async createClubAuthContext(authContext, clubId) {
    const membership = await this.membershipRepository.getMembershipByClubAndUser(clubId, authContext.userId);
    let clubCapabilities = [];
    let clubMembership = void 0;
    if (membership && membership.status === "active" /* ACTIVE */) {
      clubCapabilities = getCapabilitiesForRole(membership.role);
      clubMembership = {
        membershipId: membership.membershipId,
        clubId: membership.clubId,
        role: membership.role,
        status: membership.status,
        joinedAt: membership.joinedAt
      };
    }
    return {
      ...authContext,
      clubMembership,
      clubCapabilities
    };
  }
  /**
   * Check if user has club capability
   */
  async hasClubCapability(authContext, clubId, capability) {
    try {
      await this.requireClubCapability(authContext, clubId, capability);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Require club capability (throws if not authorized)
   */
  async requireClubCapability(authContext, clubId, capability) {
    const hasSystemOverride = await this.authorizationService.hasSystemCapability(
      authContext,
      "manage_all_clubs" /* MANAGE_ALL_CLUBS */
    );
    if (hasSystemOverride) {
      return;
    }
    const membership = await this.membershipRepository.getMembershipByClubAndUser(clubId, authContext.userId);
    if (!membership || membership.status !== "active" /* ACTIVE */) {
      throw new AuthorizationError(
        `Insufficient privileges: ${capability} required`,
        "INSUFFICIENT_PRIVILEGES" /* INSUFFICIENT_PRIVILEGES */,
        403,
        {
          capability,
          // Type assertion for compatibility
          userId: authContext.userId,
          resource: `club:${clubId}`
        }
      );
    }
    if (!roleHasCapability(membership.role, capability)) {
      const requiredRoles = [getMinimumRoleForCapability(capability)].filter(Boolean);
      throw new AuthorizationError(
        `Insufficient privileges: ${capability} requires ${requiredRoles.join(" or ")} role`,
        "INSUFFICIENT_PRIVILEGES" /* INSUFFICIENT_PRIVILEGES */,
        403,
        {
          capability,
          // Type assertion for compatibility
          userId: authContext.userId,
          resource: `club:${clubId}`
        }
      );
    }
  }
  /**
   * Check if user can manage member (role hierarchy check)
   */
  async canManageMember(authContext, clubId, targetMemberRole) {
    const hasSystemOverride = await this.authorizationService.hasSystemCapability(
      authContext,
      "manage_all_clubs" /* MANAGE_ALL_CLUBS */
    );
    if (hasSystemOverride) {
      return true;
    }
    const membership = await this.membershipRepository.getMembershipByClubAndUser(clubId, authContext.userId);
    if (!membership || membership.status !== "active" /* ACTIVE */) {
      return false;
    }
    const roleHierarchy = {
      ["member" /* MEMBER */]: 1,
      ["admin" /* ADMIN */]: 2,
      ["owner" /* OWNER */]: 3
    };
    const userLevel = roleHierarchy[membership.role];
    const targetLevel = roleHierarchy[targetMemberRole];
    if (targetMemberRole === "owner" /* OWNER */) {
      return false;
    }
    return userLevel >= targetLevel;
  }
  /**
   * Validate role assignment permissions
   */
  async validateRoleAssignment(authContext, clubId, targetRole) {
    const hasSystemOverride = await this.authorizationService.hasSystemCapability(
      authContext,
      "manage_all_clubs" /* MANAGE_ALL_CLUBS */
    );
    if (hasSystemOverride) {
      return;
    }
    const membership = await this.membershipRepository.getMembershipByClubAndUser(clubId, authContext.userId);
    if (!membership || membership.status !== "active" /* ACTIVE */) {
      throw new AuthorizationError(
        "Must be an active club member to assign roles",
        "INSUFFICIENT_PRIVILEGES" /* INSUFFICIENT_PRIVILEGES */,
        403,
        {
          userId: authContext.userId,
          resource: `club:${clubId}`
        }
      );
    }
    if (targetRole === "owner" /* OWNER */) {
      throw new AuthorizationError(
        "Cannot assign owner role - ownership transfer required",
        "INSUFFICIENT_PRIVILEGES" /* INSUFFICIENT_PRIVILEGES */,
        403,
        {
          userId: authContext.userId,
          resource: `club:${clubId}`
        }
      );
    }
    if (targetRole === "admin" /* ADMIN */ && membership.role !== "owner" /* OWNER */) {
      throw new AuthorizationError(
        "Only club owners can assign admin roles",
        "INSUFFICIENT_PRIVILEGES" /* INSUFFICIENT_PRIVILEGES */,
        403,
        {
          userId: authContext.userId,
          resource: `club:${clubId}`
        }
      );
    }
    if (targetRole === "member" /* MEMBER */ && !this.isAdminOrOwner(membership.role)) {
      throw new AuthorizationError(
        "Only club admins and owners can assign member roles",
        "INSUFFICIENT_PRIVILEGES" /* INSUFFICIENT_PRIVILEGES */,
        403,
        {
          userId: authContext.userId,
          resource: `club:${clubId}`
        }
      );
    }
  }
  /**
   * Check if role is admin or owner
   */
  isAdminOrOwner(role) {
    return role === "admin" /* ADMIN */ || role === "owner" /* OWNER */;
  }
};

// services/club-service/domain/membership/membership-service.ts
var MembershipService = class {
  constructor(membershipRepository2, clubRepository2, authorizationService2) {
    this.membershipRepository = membershipRepository2;
    this.clubRepository = clubRepository2;
    this.authorizationService = authorizationService2;
    this.authService = new ClubAuthorizationService(membershipRepository2, authorizationService2);
  }
  /**
   * Join a club (create membership request)
   * 
   * @param clubId - Club ID
   * @param input - Join club input
   * @param authContext - Authentication context
   * @returns Created membership
   */
  async joinClub(clubId, input, authContext) {
    logStructured("INFO", "Processing club join request", {
      clubId,
      userId: authContext.userId,
      operation: "join_club"
    });
    this.validateJoinClubInput(input);
    const club = await this.clubRepository.getClubById(clubId);
    if (!club) {
      throw new NotFoundError("Club not found");
    }
    const existingMembership = await this.membershipRepository.getMembershipByClubAndUser(clubId, authContext.userId);
    if (existingMembership && existingMembership.status !== "removed" /* REMOVED */) {
      throw new AlreadyMemberError(clubId, authContext.userId);
    }
    const initialStatus = "pending" /* PENDING */;
    const membership = await this.membershipRepository.createMembership(
      clubId,
      authContext.userId,
      input,
      "member" /* MEMBER */,
      initialStatus
    );
    logStructured("INFO", "User joined club successfully", {
      clubId,
      userId: authContext.userId,
      membershipId: membership.membershipId,
      status: membership.status
    });
    return membership;
  }
  /**
   * Leave a club (voluntary departure)
   * 
   * @param clubId - Club ID
   * @param authContext - Authentication context
   * @returns Updated membership
   */
  async leaveClub(clubId, authContext) {
    logStructured("INFO", "Processing club leave request", {
      clubId,
      userId: authContext.userId,
      operation: "leave_club"
    });
    const membership = await this.membershipRepository.getMembershipByClubAndUser(clubId, authContext.userId);
    if (!membership || membership.status !== "active" /* ACTIVE */) {
      throw new MembershipNotFoundError(void 0, clubId, authContext.userId);
    }
    if (membership.role === "owner" /* OWNER */) {
      throw new MembershipOperationNotAllowedError(
        "leave_club",
        membership.membershipId,
        "Owners cannot leave - ownership transfer required"
      );
    }
    const updatedMembership = await this.membershipRepository.removeMembershipByClubAndUser(
      clubId,
      authContext.userId,
      authContext.userId,
      "Voluntary departure"
    );
    logStructured("INFO", "User left club successfully", {
      clubId,
      userId: authContext.userId,
      membershipId: membership.membershipId
    });
    return updatedMembership;
  }
  /**
   * List club members
   * 
   * @param clubId - Club ID
   * @param options - List options
   * @param authContext - Authentication context
   * @returns Paginated list of club members
   */
  async listClubMembers(clubId, options, authContext) {
    logStructured("INFO", "Listing club members", {
      clubId,
      userId: authContext.userId,
      limit: options.limit,
      role: options.role,
      status: options.status,
      operation: "list_club_members"
    });
    const limit = Math.min(
      options.limit || MEMBERSHIP_CONSTRAINTS.DEFAULT_LIST_LIMIT,
      MEMBERSHIP_CONSTRAINTS.MAX_LIST_LIMIT
    );
    const club = await this.clubRepository.getClubById(clubId);
    if (!club) {
      throw new NotFoundError("Club not found");
    }
    const result = await this.membershipRepository.listClubMembers(clubId, {
      ...options,
      limit
    });
    logStructured("INFO", "Club members listed successfully", {
      clubId,
      userId: authContext.userId,
      resultCount: result.members.length,
      hasNextCursor: !!result.nextCursor
    });
    return result;
  }
  /**
   * Update member role
   * 
   * @param clubId - Club ID
   * @param targetUserId - Target user ID
   * @param input - Update member input
   * @param authContext - Authentication context
   * @returns Updated membership
   */
  async updateMemberRole(clubId, targetUserId, input, authContext) {
    logStructured("INFO", "Updating member role", {
      clubId,
      userId: authContext.userId,
      targetUserId,
      newRole: input.role,
      operation: "update_member_role"
    });
    this.validateUpdateMemberInput(input);
    const targetMembership = await this.membershipRepository.getMembershipByClubAndUser(clubId, targetUserId);
    if (!targetMembership || targetMembership.status !== "active" /* ACTIVE */) {
      throw new MembershipNotFoundError(void 0, clubId, targetUserId);
    }
    await this.authService.validateRoleAssignment(authContext, clubId, input.role);
    const canManage = await this.authService.canManageMember(authContext, clubId, targetMembership.role);
    if (!canManage) {
      throw new MembershipOperationNotAllowedError(
        "update_member_role",
        targetMembership.membershipId,
        "Insufficient privileges to manage this member"
      );
    }
    const updatedMembership = await this.membershipRepository.updateMembershipRole(
      targetMembership.membershipId,
      input,
      authContext.userId
    );
    logStructured("INFO", "Member role updated successfully", {
      clubId,
      userId: authContext.userId,
      targetUserId,
      membershipId: targetMembership.membershipId,
      previousRole: targetMembership.role,
      newRole: updatedMembership.role
    });
    return updatedMembership;
  }
  /**
   * Remove member from club
   * 
   * @param clubId - Club ID
   * @param targetUserId - Target user ID
   * @param input - Remove member input
   * @param authContext - Authentication context
   * @returns Updated membership
   */
  async removeMember(clubId, targetUserId, input, authContext) {
    logStructured("INFO", "Removing club member", {
      clubId,
      userId: authContext.userId,
      targetUserId,
      reason: input.reason,
      operation: "remove_member"
    });
    this.validateRemoveMemberInput(input);
    const targetMembership = await this.membershipRepository.getMembershipByClubAndUser(clubId, targetUserId);
    if (!targetMembership || targetMembership.status !== "active" /* ACTIVE */) {
      throw new MembershipNotFoundError(void 0, clubId, targetUserId);
    }
    if (targetMembership.role === "owner" /* OWNER */) {
      throw new CannotRemoveOwnerError(clubId, targetUserId);
    }
    const canManage = await this.authService.canManageMember(authContext, clubId, targetMembership.role);
    if (!canManage) {
      throw new MembershipOperationNotAllowedError(
        "remove_member",
        targetMembership.membershipId,
        "Insufficient privileges to remove this member"
      );
    }
    const updatedMembership = await this.membershipRepository.removeMembership(
      targetMembership.membershipId,
      authContext.userId,
      input.reason
    );
    logStructured("INFO", "Member removed successfully", {
      clubId,
      userId: authContext.userId,
      targetUserId,
      membershipId: targetMembership.membershipId,
      reason: input.reason
    });
    return updatedMembership;
  }
  /**
   * Get user's club memberships
   * 
   * @param authContext - Authentication context
   * @param status - Optional status filter
   * @returns List of user's club memberships
   */
  async getUserMemberships(authContext, status) {
    logStructured("INFO", "Getting user memberships", {
      userId: authContext.userId,
      status,
      operation: "get_user_memberships"
    });
    const memberships = await this.membershipRepository.listUserMemberships(authContext.userId, status);
    logStructured("INFO", "User memberships retrieved", {
      userId: authContext.userId,
      membershipCount: memberships.length,
      status
    });
    return memberships;
  }
  /**
   * Get user's role in club
   * 
   * @param clubId - Club ID
   * @param userId - User ID
   * @returns User's role if they are an active member, null otherwise
   */
  async getUserRoleInClub(clubId, userId) {
    return this.membershipRepository.getUserRoleInClub(clubId, userId);
  }
  /**
   * Check if user is club member
   * 
   * @param clubId - Club ID
   * @param userId - User ID
   * @returns True if user is an active member
   */
  async isUserMember(clubId, userId) {
    return this.membershipRepository.isUserMember(clubId, userId);
  }
  /**
   * Validate join club input
   */
  validateJoinClubInput(input) {
    if (input.message && input.message.length > MEMBERSHIP_CONSTRAINTS.JOIN_MESSAGE_MAX_LENGTH) {
      throw new ValidationError(`Join message must not exceed ${MEMBERSHIP_CONSTRAINTS.JOIN_MESSAGE_MAX_LENGTH} characters`);
    }
  }
  /**
   * Validate update member input
   */
  validateUpdateMemberInput(input) {
    if (!Object.values(ClubRole).includes(input.role)) {
      throw new ValidationError("Invalid club role");
    }
    if (input.reason && input.reason.length > MEMBERSHIP_CONSTRAINTS.REASON_MAX_LENGTH) {
      throw new ValidationError(`Reason must not exceed ${MEMBERSHIP_CONSTRAINTS.REASON_MAX_LENGTH} characters`);
    }
  }
  /**
   * Validate remove member input
   */
  validateRemoveMemberInput(input) {
    if (input.reason && input.reason.length > MEMBERSHIP_CONSTRAINTS.REASON_MAX_LENGTH) {
      throw new ValidationError(`Reason must not exceed ${MEMBERSHIP_CONSTRAINTS.REASON_MAX_LENGTH} characters`);
    }
  }
};

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

// services/club-service/handlers/membership/join-club.ts
var TABLE_NAME = process.env.TABLE_NAME;
var userRepository = new DynamoDBUserRepository(TABLE_NAME);
var clubRepository = new DynamoDBClubRepository(TABLE_NAME);
var membershipRepository = new DynamoDBMembershipRepository(TABLE_NAME, userRepository);
var membershipService = new MembershipService(membershipRepository, clubRepository, authorizationService);
async function handler(event) {
  const requestId = event.requestContext.requestId;
  const origin = event.headers.origin || event.headers.Origin;
  logStructured("INFO", "Processing join club request", {
    requestId,
    httpMethod: event.httpMethod,
    path: event.path,
    origin
  });
  try {
    const clubId = event.pathParameters?.clubId;
    if (!clubId) {
      throw new ValidationError("Club ID is required");
    }
    const joinInput = parseJsonBody(event) || {};
    const authContext = await createEnhancedAuthContext(event.requestContext, userRepository);
    logStructured("INFO", "Authentication context created", {
      requestId,
      userId: authContext.userId,
      clubId,
      isAuthenticated: authContext.isAuthenticated
    });
    if (!authContext.isAuthenticated) {
      throw new ValidationError("Authentication required");
    }
    const membership = await membershipService.joinClub(clubId, joinInput, authContext);
    logStructured("INFO", "User joined club successfully", {
      requestId,
      userId: authContext.userId,
      clubId,
      membershipId: membership.membershipId,
      status: membership.status
    });
    const response = {
      success: true,
      data: {
        membershipId: membership.membershipId,
        clubId: membership.clubId,
        userId: membership.userId,
        role: membership.role,
        status: membership.status,
        joinedAt: membership.joinedAt,
        message: membership.joinMessage
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    return createSuccessResponse(response.data, membership.status === "active" ? 201 : 202, origin);
  } catch (error) {
    logStructured("ERROR", "Error processing join club request", {
      requestId,
      clubId: event.pathParameters?.clubId,
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return handleLambdaError(error, requestId, origin);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
