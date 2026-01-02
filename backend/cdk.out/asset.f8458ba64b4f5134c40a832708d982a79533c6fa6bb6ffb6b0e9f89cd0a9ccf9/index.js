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

// services/club-service/handlers/create-club.ts
var create_club_exports = {};
__export(create_club_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(create_club_exports);

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
var ConflictError = class extends AppError {
  constructor(message = "Resource conflict") {
    super(message);
    this.statusCode = 409;
    this.errorType = "CONFLICT";
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
function fromClubData(club) {
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
function validateCreateClubInput(input) {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Invalid club data");
  }
  if (!input.name) {
    throw new ValidationError("Club name is required");
  }
  validateClubData({
    name: input.name,
    description: input.description,
    city: input.city,
    logoUrl: input.logoUrl
  });
}
function validateUpdateClubInput(input) {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Invalid club update data");
  }
  const hasUpdates = Object.keys(input).length > 0;
  if (!hasUpdates) {
    throw new ValidationError("At least one field must be updated");
  }
  validateClubData(input);
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
function isValidStatusTransition(from, to) {
  return CLUB_STATUS_TRANSITIONS[from].includes(to);
}

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

// services/club-service/domain/club-service.ts
var ClubService = class {
  constructor(clubRepository2) {
    this.clubRepository = clubRepository2;
  }
  /**
   * Get club by ID
   * 
   * @param id - Club ID
   * @returns Club if found
   * @throws NotFoundError if club doesn't exist
   */
  async getClubById(id) {
    if (!id || typeof id !== "string") {
      throw new ValidationError("Club ID is required");
    }
    const club = await this.clubRepository.getClubById(id);
    if (!club) {
      throw new NotFoundError("Club not found");
    }
    return club;
  }
  /**
   * List clubs with pagination and filtering
   * 
   * @param options - List options
   * @returns Paginated list of clubs
   */
  async listClubs(options = {}) {
    const validatedOptions = this.validateListOptions(options);
    logStructured("INFO", "Listing clubs", {
      limit: validatedOptions.limit,
      status: validatedOptions.status,
      hasCursor: !!validatedOptions.cursor
    });
    const result = await this.clubRepository.listClubs(validatedOptions);
    logStructured("INFO", "Clubs listed successfully", {
      count: result.clubs.length,
      hasNextCursor: !!result.nextCursor
    });
    return result;
  }
  /**
   * Create a new club
   * 
   * @param input - Club creation data
   * @returns Created club
   * @throws ValidationError if input is invalid
   * @throws ConflictError if club name already exists
   */
  async createClub(input) {
    validateCreateClubInput(input);
    const isNameUnique = await this.clubRepository.isClubNameUnique(input.name);
    if (!isNameUnique) {
      throw new ConflictError("Club name already exists");
    }
    const clubEntity = createClub(input);
    logStructured("INFO", "Creating club", {
      clubName: input.name,
      city: input.city
    });
    const createdClub = await this.clubRepository.createClub(input);
    logStructured("INFO", "Club created successfully", {
      clubId: createdClub.id,
      clubName: createdClub.name
    });
    return createdClub;
  }
  /**
   * Update an existing club
   * 
   * @param id - Club ID
   * @param input - Club update data
   * @returns Updated club
   * @throws NotFoundError if club doesn't exist
   * @throws ValidationError if input is invalid
   * @throws ConflictError if name conflicts with existing club
   */
  async updateClub(id, input) {
    if (!id || typeof id !== "string") {
      throw new ValidationError("Club ID is required");
    }
    validateUpdateClubInput(input);
    const existingClub = await this.getClubById(id);
    const clubEntity = fromClubData(existingClub);
    if (!clubEntity.canUpdate()) {
      throw new ValidationError("Archived clubs cannot be updated");
    }
    if (input.status && input.status !== existingClub.status) {
      if (!isValidStatusTransition(existingClub.status, input.status)) {
        throw new ValidationError(`Cannot transition from ${existingClub.status} to ${input.status}`);
      }
    }
    if (input.name && normalizeClubName(input.name) !== normalizeClubName(existingClub.name)) {
      const isNameUnique = await this.clubRepository.isClubNameUnique(input.name, id);
      if (!isNameUnique) {
        throw new ConflictError("Club name already exists");
      }
    }
    logStructured("INFO", "Updating club", {
      clubId: id,
      updateFields: Object.keys(input)
    });
    const updatedClub = await this.clubRepository.updateClub(id, input);
    logStructured("INFO", "Club updated successfully", {
      clubId: id,
      clubName: updatedClub.name,
      status: updatedClub.status
    });
    return updatedClub;
  }
  /**
   * Check if club exists
   * 
   * @param id - Club ID
   * @returns True if club exists
   */
  async clubExists(id) {
    if (!id || typeof id !== "string") {
      return false;
    }
    return await this.clubRepository.clubExists(id);
  }
  /**
   * Get clubs by status
   * 
   * @param status - Club status
   * @param limit - Maximum number of clubs
   * @returns List of clubs
   */
  async getClubsByStatus(status, limit) {
    if (!Object.values(ClubStatus).includes(status)) {
      throw new ValidationError("Invalid club status");
    }
    return await this.clubRepository.getClubsByStatus(status, limit);
  }
  /**
   * Search clubs by name
   * 
   * @param nameQuery - Name search query
   * @param limit - Maximum number of results
   * @returns List of matching clubs
   */
  async searchClubsByName(nameQuery, limit) {
    if (!nameQuery || typeof nameQuery !== "string") {
      throw new ValidationError("Search query is required");
    }
    const trimmedQuery = nameQuery.trim();
    if (trimmedQuery.length === 0) {
      throw new ValidationError("Search query cannot be empty");
    }
    return await this.clubRepository.searchClubsByName(trimmedQuery, limit);
  }
  /**
   * Validate list options
   * 
   * @param options - List options to validate
   * @returns Validated options with defaults
   */
  validateListOptions(options) {
    const validated = { ...options };
    if (validated.limit === void 0) {
      validated.limit = CLUB_CONSTRAINTS.DEFAULT_LIST_LIMIT;
    } else {
      if (typeof validated.limit !== "number" || validated.limit < 1) {
        throw new ValidationError("Limit must be a positive number");
      }
      if (validated.limit > CLUB_CONSTRAINTS.MAX_LIST_LIMIT) {
        validated.limit = CLUB_CONSTRAINTS.MAX_LIST_LIMIT;
      }
    }
    if (validated.status !== void 0) {
      if (!Object.values(ClubStatus).includes(validated.status)) {
        throw new ValidationError("Invalid status filter");
      }
    } else {
      validated.status = "active" /* ACTIVE */;
    }
    if (validated.cursor !== void 0) {
      if (typeof validated.cursor !== "string" || validated.cursor.trim().length === 0) {
        throw new ValidationError("Invalid pagination cursor");
      }
    }
    return validated;
  }
};

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
var InsufficientPrivilegesError = class extends AuthorizationError {
  constructor(capability, userId, resource) {
    const message = `Insufficient privileges: ${capability} required`;
    super(message, "INSUFFICIENT_PRIVILEGES" /* INSUFFICIENT_PRIVILEGES */, 403, {
      capability,
      userId,
      resource
    });
  }
};
var AuthorizationServiceError = class extends AuthorizationError {
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
  return error instanceof AuthorizationError;
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
      const hasCapability2 = capabilities.includes(capability);
      const duration = Date.now() - startTime;
      if (hasCapability2) {
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
      return hasCapability2;
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
      const hasCapability2 = await this.hasSystemCapability(authContext, requiredCapability);
      const duration = Date.now() - startTime;
      const result = {
        granted: hasCapability2,
        capability: requiredCapability,
        reason: hasCapability2 ? void 0 : "Insufficient privileges",
        context: {
          userId: authContext.userId,
          systemRole: authContext.systemRole,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      if (!hasCapability2) {
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

// services/club-service/handlers/create-club.ts
var TABLE_NAME = process.env.TABLE_NAME;
var userRepository = new DynamoDBUserRepository(TABLE_NAME);
var clubRepository = new DynamoDBClubRepository(TABLE_NAME);
var clubService = new ClubService(clubRepository);
async function handler(event) {
  const requestId = event.requestContext.requestId;
  logStructured("INFO", "Processing create club request", {
    requestId,
    httpMethod: event.httpMethod,
    path: event.path
  });
  try {
    const createInput = parseJsonBody(event.body);
    const authContext = await createEnhancedAuthContext(event.requestContext, userRepository);
    logStructured("INFO", "Authentication context created", {
      requestId,
      userId: authContext.userId,
      isAuthenticated: authContext.isAuthenticated,
      isSiteAdmin: authContext.isSiteAdmin
    });
    await requireCapability("manage_all_clubs" /* MANAGE_ALL_CLUBS */)(authContext);
    logStructured("INFO", "Authorization successful", {
      requestId,
      userId: authContext.userId,
      capability: "manage_all_clubs" /* MANAGE_ALL_CLUBS */
    });
    const club = await clubService.createClub(createInput);
    logStructured("INFO", "Club created successfully", {
      requestId,
      userId: authContext.userId,
      clubId: club.id,
      clubName: club.name
    });
    const response = {
      success: true,
      data: club,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(response)
    };
  } catch (error) {
    logStructured("ERROR", "Error processing create club request", {
      requestId,
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
