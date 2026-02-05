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

// services/club-service/handlers/get-club.ts
var get_club_exports = {};
__export(get_club_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(get_club_exports);

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

// services/club-service/infrastructure/dynamodb-club-repository.ts
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");

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
    const client = dynamoClient || new import_client_dynamodb.DynamoDBClient({});
    this.docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(client);
  }
  /**
   * Get club by ID
   */
  async getClubById(id) {
    const startTime = Date.now();
    try {
      const command = new import_lib_dynamodb.GetCommand({
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
      const command = new import_lib_dynamodb.QueryCommand(queryParams);
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
      const command = new import_lib_dynamodb.TransactWriteCommand(transactParams);
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
      const command = new import_lib_dynamodb.TransactWriteCommand(transactParams);
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
      const command = new import_lib_dynamodb.QueryCommand({
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
var import_client_dynamodb2 = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb2 = require("@aws-sdk/lib-dynamodb");

// shared/types/membership.ts
var ClubRole = /* @__PURE__ */ ((ClubRole2) => {
  ClubRole2["MEMBER"] = "member";
  ClubRole2["CAPTAIN"] = "captain";
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
    ["member" /* MEMBER */]: ["captain" /* CAPTAIN */, "admin" /* ADMIN */],
    // Members can be promoted to captain or admin
    ["captain" /* CAPTAIN */]: ["member" /* MEMBER */, "admin" /* ADMIN */],
    // Captains can be promoted to admin or demoted to member
    ["admin" /* ADMIN */]: ["captain" /* CAPTAIN */, "member" /* MEMBER */],
    // Admins can be demoted to captain or member
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

// services/club-service/infrastructure/dynamodb-membership-repository.ts
var DynamoDBMembershipRepository = class {
  constructor(tableName, userRepository2, dynamoClient) {
    this.userRepository = userRepository2;
    const client = dynamoClient || new import_client_dynamodb2.DynamoDBClient({});
    this.dynamoClient = import_lib_dynamodb2.DynamoDBDocumentClient.from(client);
    this.tableName = tableName || process.env.MAIN_TABLE_NAME || "sydney-cycles-main-development";
  }
  /**
   * Get membership by club and user
   */
  async getMembershipByClubAndUser(clubId, userId) {
    const startTime = Date.now();
    try {
      const command = new import_lib_dynamodb2.GetCommand({
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
      const command = new import_lib_dynamodb2.QueryCommand(queryParams);
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
        queryParams.FilterExpression = "#status = :status AND #entityType = :entityType";
        queryParams.ExpressionAttributeNames = {
          "#status": "status",
          "#entityType": "entityType"
        };
        queryParams.ExpressionAttributeValues[":status"] = status;
        queryParams.ExpressionAttributeValues[":entityType"] = "USER_MEMBERSHIP";
      } else {
        queryParams.FilterExpression = "#entityType = :entityType";
        queryParams.ExpressionAttributeNames = {
          "#entityType": "entityType"
        };
        queryParams.ExpressionAttributeValues[":entityType"] = "USER_MEMBERSHIP";
      }
      const command = new import_lib_dynamodb2.QueryCommand(queryParams);
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
      const command = new import_lib_dynamodb2.TransactWriteCommand({
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
      const scanCommand = new import_lib_dynamodb2.QueryCommand({
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
      const command = new import_lib_dynamodb2.TransactWriteCommand({
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

// services/user-profile/infrastructure/dynamodb-user-repository.ts
var import_client_dynamodb3 = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb3 = require("@aws-sdk/lib-dynamodb");
var DynamoDBUserRepository = class {
  constructor(tableName, dynamoClient) {
    this.tableName = tableName;
    const client = dynamoClient || new import_client_dynamodb3.DynamoDBClient({});
    this.docClient = import_lib_dynamodb3.DynamoDBDocumentClient.from(client);
  }
  /**
   * Get user by ID
   * 
   * @param userId - User ID
   * @returns User data or null if not found
   */
  async getUserById(userId) {
    try {
      const command = new import_lib_dynamodb3.GetCommand({
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
      const command = new import_lib_dynamodb3.PutCommand({
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
      const command = new import_lib_dynamodb3.UpdateCommand({
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
      const command = new import_lib_dynamodb3.GetCommand({
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

// services/club-service/handlers/get-club.ts
var TABLE_NAME = process.env.TABLE_NAME;
var clubRepository = new DynamoDBClubRepository(TABLE_NAME);
var userRepository = new DynamoDBUserRepository(TABLE_NAME);
var membershipRepository = new DynamoDBMembershipRepository(TABLE_NAME, userRepository);
var clubService = new ClubService(clubRepository);
async function handler(event) {
  const requestId = event.requestContext.requestId;
  logStructured("INFO", "Processing get club request", {
    requestId,
    httpMethod: event.httpMethod,
    path: event.path
  });
  try {
    const clubId = event.pathParameters?.clubId;
    if (!clubId) {
      throw new ValidationError("Club ID is required");
    }
    logStructured("INFO", "Extracted club ID", {
      requestId,
      clubId
    });
    const club = await clubService.getClubById(clubId);
    let userMembership = null;
    try {
      const authContext = await createEnhancedAuthContext(event.requestContext, userRepository);
      if (authContext.isAuthenticated && authContext.userId) {
        const membership = await membershipRepository.getMembershipByClubAndUser(clubId, authContext.userId);
        if (membership) {
          userMembership = {
            membershipId: membership.membershipId,
            role: membership.role,
            status: membership.status,
            joinedAt: membership.joinedAt
          };
        }
      }
    } catch (error) {
      logStructured("WARN", "Failed to get user membership", {
        requestId,
        clubId,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
    logStructured("INFO", "Club retrieved successfully", {
      requestId,
      clubId,
      clubName: club.name,
      status: club.status,
      hasMembership: !!userMembership
    });
    const clubWithMembership = {
      ...club,
      ...userMembership && { userMembership }
    };
    const origin = event.headers?.origin || event.headers?.Origin;
    return createSuccessResponse(clubWithMembership, 200, origin);
  } catch (error) {
    logStructured("ERROR", "Error processing get club request", {
      requestId,
      clubId: event.pathParameters?.clubId,
      error: error instanceof Error ? error.message : "Unknown error"
    });
    const origin = event.headers?.origin || event.headers?.Origin;
    return handleLambdaError(error, requestId, origin);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
